<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductTransfer;
use App\Models\ProductTransferItem;
use App\Models\Scopes\BranchScope;
use App\Support\BranchCatalog;
use App\Support\CurrentBranch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Moving stock between branches.
 *
 * Three steps, and stock is only in one place at a time:
 *
 *   build      the sender fills a cart from their own branch and names the
 *              destination. Every line already knows which row it will land on
 *              over there — matched, or created once from the source.
 *   dispatch   stock leaves the sending branch. It is now in transit and
 *              belongs to neither branch.
 *   receive    the destination counts it in, and only then does stock land —
 *              on the row chosen at dispatch, so nobody picks it by hand.
 */
class ProductTransferController extends Controller
{
    public function __construct(
        private readonly BranchCatalog $catalog,
        private readonly CurrentBranch $branch,
    ) {}

    public function index(Request $request)
    {
        $search = trim((string) $request->input('search'));
        $transfer = $this->pendingTransfer();

        return Inertia::render('ProductTransfers/Index', [
            // Source products: branch-scoped, so this is the sender's own stock.
            'products' => Product::query()
                ->when($search, fn ($q) => $q->where('name', 'LIKE', "%{$search}%"))
                ->orderBy('name')
                ->limit(25)
                ->get(),
            'transfer' => $transfer ? $this->cartPayload($transfer) : null,
            // Anywhere but here — a transfer to your own branch is a no-op.
            'branches' => Branch::where('company_id', auth()->user()->company_id)
                ->when($this->sourceBranchId(), fn ($q, $id) => $q->where('id', '!=', $id))
                ->orderBy('name')
                ->get(['id', 'name']),
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Name the destination. Done before the goods are picked so every line can
     * show where it is going while the cart is being built.
     */
    public function destination(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
        ]);

        $source = $this->sourceBranchId();

        if ((int) $validated['branch_id'] === $source) {
            return back()->withErrors(['branch_id' => 'Choose a branch other than this one.']);
        }

        $transfer = $this->pendingTransfer(create: true);
        $destination = (int) $validated['branch_id'];

        if ($transfer->branch_id !== $destination) {
            // Every line was pointed at a row in the *previous* destination, so
            // those choices are now meaningless — and left in place they would
            // send stock to a product in the wrong branch, where nobody could
            // ever receive it. Drop them and match afresh.
            $transfer->productTransferItems()->update(['to_product_id' => null]);
        }

        $transfer->update(['branch_id' => $destination]);

        return back();
    }

    /** Put one of this branch's products into the transfer. */
    public function cart(Product $product): RedirectResponse
    {
        if ($product->stock < 1) {
            return back()->withErrors(['stock' => "{$product->name} is out of stock."]);
        }

        $transfer = $this->pendingTransfer(create: true);

        $transfer->productTransferItems()->firstOrCreate(
            ['product_id' => $product->id],
            ['stock' => 1, 'previous_stock' => $product->stock]
        );

        return back();
    }

    public function update_cart(Request $request, ProductTransferItem $item): RedirectResponse
    {
        $this->authorizeItem($item);

        $validated = $request->validate([
            'stock' => 'required|numeric|min:0.01|max:99999999',
        ]);

        // The product is unscoped on the relation, so this is the sending
        // branch's row whichever branch the user is looking at.
        if ($validated['stock'] > $item->product->stock) {
            return back()->withErrors([
                'stock' => "Only {$item->product->stock} {$item->product->unit} of {$item->product->name} in stock.",
            ]);
        }

        $item->update(['stock' => $validated['stock']]);

        return back();
    }

    /**
     * Point a line at a specific row in the destination branch, overriding the
     * automatic match. Sending null goes back to matching automatically.
     */
    public function map(Request $request, ProductTransferItem $item): RedirectResponse
    {
        $this->authorizeItem($item);

        $validated = $request->validate([
            'to_product_id' => 'nullable|integer',
        ]);

        $target = $validated['to_product_id'] ?? null;

        if ($target !== null) {
            $exists = Product::withoutGlobalScope(BranchScope::class)
                ->where('id', $target)
                ->where('branch_id', $item->productTransfer->branch_id)
                ->exists();

            // Guards the whole point of this screen: a line can only ever be
            // pointed at a row that actually belongs to the receiving branch.
            abort_unless($exists, 422, 'That product is not in the receiving branch.');
        }

        $item->update(['to_product_id' => $target]);

        return back();
    }

    public function destroy_cart(ProductTransferItem $item): RedirectResponse
    {
        $this->authorizeItem($item);

        $item->delete();

        return back();
    }

    /**
     * Send it: stock leaves the sending branch and the destination row for
     * every line is fixed, creating it where the branch doesn't stock it yet.
     */
    public function store(Request $request): RedirectResponse
    {
        $transfer = $this->pendingTransfer();

        if (! $transfer) {
            return back()->withErrors(['error' => 'You have no transfer in progress.']);
        }

        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
        ]);

        $destination = (int) $validated['branch_id'];

        if ($destination === $this->sourceBranchId()) {
            return back()->withErrors(['branch_id' => 'Choose a branch other than this one.']);
        }

        $items = $transfer->productTransferItems()->with('product')->get();

        if ($items->isEmpty()) {
            return back()->withErrors(['error' => 'Add at least one product to transfer.']);
        }

        try {
            DB::transaction(function () use ($transfer, $items, $destination) {
                $transfer->update(['branch_id' => $destination]);

                foreach ($items as $item) {
                    $product = $item->product;

                    if (! $product) {
                        throw new \RuntimeException('A product on this transfer no longer exists.');
                    }

                    // Re-check under the lock: stock may have been sold while
                    // the cart sat open.
                    $locked = Product::withoutGlobalScope(BranchScope::class)
                        ->lockForUpdate()
                        ->find($product->id);

                    if ($item->stock > $locked->stock) {
                        throw new \RuntimeException(
                            "Only {$locked->stock} {$locked->unit} of {$locked->name} left — adjust the quantity."
                        );
                    }

                    // Fix the destination row now, while the sender is here to
                    // see it, rather than leaving it to whoever unpacks the box.
                    $chosen = $item->to_product_id
                        ? Product::withoutGlobalScope(BranchScope::class)->find($item->to_product_id)
                        : null;

                    // Only honour a choice that still belongs to the receiving
                    // branch. destination() clears mappings when the branch
                    // changes, so this should never fire — but a line pointed
                    // elsewhere would strand the stock somewhere nobody can
                    // receive it, which is worth being sure about. A target
                    // deleted since mapping falls through here too.
                    $target = ($chosen && $chosen->branch_id === $destination)
                        ? $chosen
                        : $this->catalog->resolve($locked, $destination);

                    $locked->decrement('stock', $item->stock);

                    $item->update([
                        'to_product_id' => $target->id,
                        'previous_stock' => $locked->stock + $item->stock,
                        'stock_after' => $locked->stock,
                    ]);
                }

                $transfer->update(['status' => ProductTransfer::TRANSFERRED]);
            });
        } catch (\RuntimeException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }

        return redirect()
            ->route('product-transfers.show', $transfer->id)
            ->with('success', 'Stock sent. The receiving branch confirms it on arrival.');
    }

    /** Transfers on their way to the branch the user is working in. */
    public function incoming()
    {
        $branchId = $this->branch->id();

        return Inertia::render('ProductTransfers/Incoming', [
            'transfers' => ProductTransfer::query()
                ->awaitingReceipt()
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                // ProductTransfer carries no branch scope, so "all branches"
                // would otherwise reach across companies.
                ->whereHas('branch', fn ($q) => $q->where('company_id', auth()->user()->company_id))
                ->with([
                    'fromBranch:id,name',
                    'branch:id,name',
                    'user:id,name',
                    'productTransferItems.product:id,name,unit',
                    'productTransferItems.toProduct:id,name,unit,stock',
                    'productTransferItems.receivedBy:id,name',
                ])
                ->latest()
                ->get(),
            'branchLabel' => $this->branch->isAll()
                ? 'All branches'
                : ($this->branch->branch()?->name ?? 'this branch'),
        ]);
    }

    /**
     * Count in one line. A delivery is unpacked item by item, so each line is
     * settled on its own and the transfer closes itself once the last one is.
     *
     * Stock lands on the row fixed at dispatch — the receiver confirms a
     * quantity, never picks the product. Whatever didn't arrive goes straight
     * back onto the sending branch's shelf, so the two branches still add up
     * to what left.
     */
    public function receiveItem(Request $request, ProductTransferItem $item): RedirectResponse
    {
        $transfer = $item->productTransfer;

        $this->authorizeReceipt($transfer);

        $validated = $request->validate([
            'received_stock' => 'required|numeric|min:0|max:99999999',
        ]);

        try {
            DB::transaction(fn () => $this->settle($transfer->id, [$item->id => (float) $validated['received_stock']]));
        } catch (\RuntimeException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }

        return back()->with('success', 'Line confirmed.');
    }

    /**
     * Count in everything still outstanding — the clean-delivery shortcut.
     * Lines already confirmed are left exactly as they were.
     */
    public function receive(Request $request, ProductTransfer $productTransfer): RedirectResponse
    {
        $this->authorizeReceipt($productTransfer);

        $validated = $request->validate([
            'items' => 'nullable|array',
            'items.*.id' => 'required|integer',
            'items.*.received_stock' => 'required|numeric|min:0|max:99999999',
        ]);

        $counted = collect($validated['items'] ?? [])
            ->mapWithKeys(fn ($i) => [(int) $i['id'] => (float) $i['received_stock']])
            ->all();

        try {
            DB::transaction(fn () => $this->settle($productTransfer->id, $counted, all: true));
        } catch (\RuntimeException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }

        return back()->with('success', 'Delivery received and stock added.');
    }

    /**
     * Settle the given lines, and close the transfer if nothing is left.
     *
     * @param  array<int,float>  $counted  line id => quantity actually counted
     * @param  bool  $all  settle every outstanding line, defaulting to the
     *                     quantity sent for any not named in $counted
     */
    private function settle(int $transferId, array $counted, bool $all = false): void
    {
        // Lock first: two people confirming the same delivery at once would
        // otherwise both add the stock.
        $transfer = ProductTransfer::whereKey($transferId)->lockForUpdate()->first();

        if ($transfer->status !== ProductTransfer::TRANSFERRED) {
            throw new \RuntimeException('This delivery has already been received.');
        }

        if ($transfer->predatesReceiving()) {
            throw new \RuntimeException(
                'This transfer was sent before the receiving step existed and was already settled by hand.'
            );
        }

        foreach ($transfer->productTransferItems as $item) {
            // Already counted in — never twice.
            if ($item->isReceived()) {
                continue;
            }

            if (! $all && ! array_key_exists($item->id, $counted)) {
                continue;
            }

            $sent = (float) $item->stock;
            $received = $counted[$item->id] ?? $sent;

            if ($received > $sent) {
                throw new \RuntimeException('You cannot receive more than was sent.');
            }

            $this->land($transfer, $item, $received, $sent - $received);
        }

        // The delivery is done when every line has been dealt with.
        $outstanding = $transfer->productTransferItems()->whereNull('received_at')->exists();

        if (! $outstanding) {
            $transfer->update([
                'status' => ProductTransfer::RECEIVED,
                'received_by' => auth()->id(),
                'received_at' => now(),
            ]);
        }
    }

    /** Put the counted stock on the destination and the shortfall back home. */
    private function land(ProductTransfer $transfer, ProductTransferItem $item, float $received, float $returned): void
    {
        $target = Product::withoutGlobalScope(BranchScope::class)
            ->lockForUpdate()
            ->find($item->to_product_id);

        if (! $target || $target->branch_id !== $transfer->branch_id) {
            throw new \RuntimeException("There is no product in this branch for {$item->product?->name}.");
        }

        if ($received > 0) {
            $target->increment('stock', $received);
        }

        // What never arrived goes back where it came from, rather than
        // evaporating between two branches.
        if ($returned > 0) {
            $source = Product::withoutGlobalScope(BranchScope::class)
                ->lockForUpdate()
                ->find($item->product_id);

            $source?->increment('stock', $returned);
        }

        $item->update([
            'received_stock' => $received,
            'returned_stock' => $returned,
            'to_stock_after' => $target->fresh()->stock,
            'received_at' => now(),
            'received_by' => auth()->id(),
        ]);
    }

    /**
     * Only the branch a delivery was sent to may take it in, and never another
     * company's.
     */
    private function authorizeReceipt(?ProductTransfer $transfer): void
    {
        abort_unless($transfer !== null, 404);

        $this->authorizeCompany($transfer);

        $branchId = $this->branch->id();

        // In "all branches" mode there is no single receiving branch to check
        // against, and the company check above is what holds.
        abort_unless($branchId === null || $transfer->branch_id === $branchId, 403);
    }

    public function show(ProductTransfer $productTransfer)
    {
        $this->authorizeCompany($productTransfer);

        return Inertia::render('ProductTransfers/Show', [
            'productTransfer' => ProductTransfer::with([
                'productTransferItems.product',
                'productTransferItems.toProduct:id,name,unit',
                'user', 'branch', 'fromBranch', 'receivedBy:id,name',
            ])->find($productTransfer->id),
        ]);
    }

    /**
     * The caller's own transfer in progress, out of the branch they're working
     * in. Scoped to the user: two sellers building transfers at once must not
     * end up sharing one cart.
     */
    private function pendingTransfer(bool $create = false): ?ProductTransfer
    {
        $query = ProductTransfer::where('status', ProductTransfer::PENDING)
            ->where('user_id', auth()->id())
            ->where('from_branch_id', $this->sourceBranchId());

        $transfer = $query->first();

        if ($transfer || ! $create) {
            return $transfer;
        }

        return ProductTransfer::create([
            'from_branch_id' => $this->sourceBranchId(),
            // Stands in until a destination is named; never dispatched as-is.
            'branch_id' => $this->sourceBranchId(),
            'user_id' => auth()->id(),
        ]);
    }

    private function sourceBranchId(): ?int
    {
        return $this->branch->writeBranchId();
    }

    /**
     * A transfer is reachable by id alone, and ProductTransfer has no branch
     * scope of its own — so the company has to be checked explicitly.
     */
    private function authorizeCompany(ProductTransfer $transfer): void
    {
        $companyId = auth()->user()->company_id;

        abort_unless(
            $transfer->branch?->company_id === $companyId
            || $transfer->fromBranch?->company_id === $companyId,
            403
        );
    }

    private function authorizeItem(ProductTransferItem $item): void
    {
        $transfer = $item->productTransfer;

        abort_unless(
            $transfer
            && $transfer->user_id === auth()->id()
            && $transfer->status === ProductTransfer::PENDING,
            403
        );
    }

    /**
     * The cart as the sender needs to see it: every line with the row it will
     * land on, and whether that row has to be created.
     */
    private function cartPayload(ProductTransfer $transfer): array
    {
        $destination = $transfer->branch_id === $transfer->from_branch_id
            ? null
            : $transfer->branch_id;

        $items = $transfer->productTransferItems()->with('product')->get()->map(function ($item) use ($destination) {
            $target = null;

            if ($destination && $item->product) {
                $target = $item->to_product_id
                    ? Product::withoutGlobalScope(BranchScope::class)->find($item->to_product_id)
                    : $this->catalog->match($item->product, $destination);
            }

            // About to create a new row — but if the branch already stocks
            // something spelled almost the same, say so before a near-twin is
            // made and the stock lands where nobody looks for it.
            $suggestions = ($destination && $target === null && $item->product)
                ? array_map(
                    fn ($p) => $p->only(['id', 'name', 'unit', 'stock']),
                    $this->catalog->nearMatches($item->product, $destination)
                )
                : [];

            return [
                'id' => $item->id,
                'product' => $item->product?->only(['id', 'name', 'unit', 'stock']),
                'stock' => (float) $item->stock,
                'to_product_id' => $item->to_product_id,
                'destination' => $target?->only(['id', 'name', 'unit', 'stock']),
                // Nothing over there matches, so dispatch will create it.
                'will_create' => $destination !== null && $target === null,
                'chosen' => $item->to_product_id !== null,
                'suggestions' => $suggestions,
            ];
        });

        return [
            'id' => $transfer->id,
            'branch_id' => $destination,
            'items' => $items,
            'destination_products' => $destination
                ? Product::withoutGlobalScope(BranchScope::class)
                    ->where('branch_id', $destination)
                    ->orderBy('name')
                    ->get(['id', 'name', 'unit', 'stock'])
                : [],
        ];
    }
}
