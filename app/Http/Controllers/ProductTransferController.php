<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductTransfer;
use App\Models\ProductTransferItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductTransferController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $search = request()->search ?? null;
        $productTransferItems = ProductTransferItem::with('productTransfer', 'product')
                                   ->whereRelation('productTransfer', 'status', 'pending')
                                    ->whereRelation('productTransfer', 'user_id', auth()->id())
                                   ->get();

        return Inertia::render('ProductTransfers/Index', [
            'productTransferItems' => fn () => $productTransferItems,
            'branches' => fn () => Branch::get(),
            'products' => fn () => Product::where('name', 'LIKE', "%{$search}%")->limit(10)->get()
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
{
    $validated = $request->validate([
        'branch_id' => 'required|exists:branches,id',
    ]);

    $pendingProductTransfer = ProductTransfer::where('status', 'pending')
                                 ->where('user_id', auth()->id())
                                 ->first();

    if ($pendingProductTransfer) {
        // Use a transaction to ensure atomicity
        DB::transaction(function () use ($pendingProductTransfer, $validated) {
            $pendingProductTransfer->update([
                'branch_id' => $validated['branch_id'],
            ]);

            // Get all the product transfer items of the pending product transfer
            $pendingProductTransferItems = $pendingProductTransfer->productTransferItems()->with('product')->get();

            foreach ($pendingProductTransferItems as $item) {
                // Decrement the stock of the product
                $item->product->decrement('stock', $item->stock);

                // Snapshot the stock level *after* decrementing
                // We call fresh() to get the updated stock value from the database
                $item->update(['stock_after' => $item->product->fresh()->stock]);
            }

            // Update the status of the entire transfer to 'transferred'
            $pendingProductTransfer->update(['status' => 'transferred']);
        });

    } else {
        return back()->withErrors(['error' => 'You have no pending product transfer']);
    }

    return redirect()->route('product-transfers.show', $pendingProductTransfer->id)
        ->with('success', 'Product transfer completed successfully'); 
}

    /**
     * Display the specified resource.
     */
    public function show(ProductTransfer $productTransfer)
    {
        return Inertia::render('ProductTransfers/Show', [
            'productTransfer' => ProductTransfer::with(['productTransferItems.product', 'user', 'branch'])->find($productTransfer->id),
        ]);
    }


    public function cart(Product $product): RedirectResponse
    {
        $pendingProductTransfer = ProductTransfer::where('status', 'pending')->first();
          if (!$pendingProductTransfer) {
            $pendingProductTransfer = ProductTransfer::create([
                'branch_id' => auth()->user()->branch_id,
                'user_id' => auth()->id(),
            ]);
        }

        $productTransferItem = $pendingProductTransfer->productTransferItems()->firstOrCreate(
            ['product_id' => $product->id],
            ['stock' => 1, 'previous_stock' => $product->stock]
        );

        return redirect()->back();
    }


    public function update_cart(ProductTransferItem $item)
    {
        $stock = request()->stock;

        // check if stock is greater than available stock of the product
        $product = $item->product;
        if ($stock > $product->stock) {
            return redirect()->back()->withErrors('error', 'Stock is greater than available stock');
        }

        $item->update([
            'stock' => $stock,
        ]);

        return redirect()->back();
    }

    public function destroy_cart(ProductTransferItem $item)
    {
        $item->delete();
        return redirect()->back();
    }
}
