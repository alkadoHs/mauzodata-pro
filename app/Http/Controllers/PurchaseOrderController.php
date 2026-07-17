<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Support\CurrentBranch;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $request->validate([
            'search' => 'nullable|string',
            'status' => 'nullable|in:all,pending,received,cancelled',
        ]);

        $search = $request->string('search')->trim()->value();
        $status = $request->input('status', 'all');

        // Branch isolation is handled by PurchaseOrder's BranchScope.
        $query = PurchaseOrder::query()
            ->with('supplier:id,name', 'user:id,name')
            ->withCount('items')
            // Total value of each PO, computed in SQL rather than shipping every item.
            ->withSum('items as total_value', DB::raw('quantity * cost'))
            ->when($status !== 'all', fn (Builder $q) => $q->where('status', $status))
            ->when($search, fn (Builder $q) => $q->where(function (Builder $inner) use ($search) {
                $inner->where('id', ltrim($search, 'PO-#'))
                    ->orWhereRelation('supplier', 'name', 'like', "%{$search}%");
            }))
            ->latest();

        return Inertia::render('PurchaseOrders/Index', [
            'purchaseOrders' => $query->paginate(20)->withQueryString(),
            'stats' => $this->stats(),
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    /**
     * Headline numbers for the current branch (respects the active branch).
     */
    private function stats(): array
    {
        $valueOf = fn (string $status) => (float) PurchaseOrder::where('status', $status)
            ->join('purchase_order_items', 'purchase_orders.id', '=', 'purchase_order_items.purchase_order_id')
            ->sum(DB::raw('purchase_order_items.quantity * purchase_order_items.cost'));

        return [
            'pending_count' => PurchaseOrder::where('status', 'pending')->count(),
            'pending_value' => $valueOf('pending'),
            'received_count' => PurchaseOrder::where('status', 'received')->count(),
            'received_value' => $valueOf('received'),
        ];
    }

    public function create(): Response
    {
        return Inertia::render('PurchaseOrders/Create', [
            'suppliers' => Supplier::where('company_id', auth()->user()->company_id)
                ->orderBy('name')
                ->get(['id', 'name']),
            // Product's BranchScope already limits these to the active branch.
            'products' => Product::orderBy('name')->get(['id', 'name', 'unit', 'buy_price', 'stock']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'supplier_id' => [
                'required',
                // Must be a supplier of the caller's own company.
                \Illuminate\Validation\Rule::exists('suppliers', 'id')
                    ->where('company_id', auth()->user()->company_id),
            ],
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.cost' => 'required|numeric|min:0',
        ], [
            'items.required' => 'Add at least one product to this purchase order.',
            'supplier_id.exists' => 'The selected supplier does not belong to your company.',
        ]);

        $po = DB::transaction(function () use ($validated) {
            $po = PurchaseOrder::create([
                'branch_id' => app(CurrentBranch::class)->writeBranchId(),
                'user_id' => auth()->id(),
                'supplier_id' => $validated['supplier_id'],
                'notes' => $validated['notes'] ?? null,
                // Set explicitly rather than leaning on the column default, so the
                // in-memory model matches the row straight after create().
                'status' => 'pending',
            ]);

            $po->items()->createMany($validated['items']);

            return $po;
        });

        return redirect()
            ->route('purchase-orders.show', $po)
            ->with('success', 'Purchase order created.');
    }

    public function show(PurchaseOrder $purchaseOrder): Response
    {
        // Branch isolation is enforced by BranchScope on route-model binding:
        // a PO outside the active branch won't resolve (404); "All" mode sees any.
        $purchaseOrder->load('supplier', 'user', 'branch', 'items.product');

        return Inertia::render('PurchaseOrders/Show', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    /**
     * Mark the Purchase Order as received and move the stock in.
     */
    public function receive(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        if ($purchaseOrder->status !== 'pending') {
            return back()->withErrors(['status' => 'This purchase order has already been processed.']);
        }

        DB::transaction(function () use ($purchaseOrder) {
            // Lock the items so a double-submit can't apply the stock twice.
            $items = $purchaseOrder->items()->with('product')->lockForUpdate()->get();

            foreach ($items as $item) {
                // Use the relation (it bypasses BranchScope) rather than a scoped
                // Product::find, which could resolve to null for a cross-branch product.
                $product = $item->product;

                if (! $product) {
                    continue;
                }

                $product->increment('stock', $item->quantity);
                $product->refresh();

                // Record the resulting stock level so the product ledger has a
                // complete audit trail (mirrors ProductTransferItem).
                $item->update(['stock_after' => $product->stock]);

                // Keep the buying price in step with what we actually paid.
                if ((float) $product->buy_price !== (float) $item->cost) {
                    $product->update(['buy_price' => $item->cost]);
                }
            }

            $purchaseOrder->update(['status' => 'received']);
        });

        return back()->with('success', 'Stock received and inventory updated.');
    }

    /**
     * Cancel a purchase order that hasn't been received yet. Non-destructive:
     * the record stays for the audit trail, no stock moves.
     */
    public function cancel(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        if ($purchaseOrder->status !== 'pending') {
            return back()->withErrors(['status' => 'Only a pending purchase order can be cancelled.']);
        }

        $purchaseOrder->update(['status' => 'cancelled']);

        return back()->with('success', 'Purchase order cancelled.');
    }
}
