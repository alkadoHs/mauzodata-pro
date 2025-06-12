<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('PurchaseOrders/Index', [
            'purchaseOrders' => PurchaseOrder::with('supplier', 'user', 'items')
                ->where('branch_id', auth()->user()->branch_id)
                ->latest()
                ->paginate(20),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('PurchaseOrders/Create', [
            'suppliers' => Supplier::where('company_id', auth()->user()->company_id)->get(),
            'products' => Product::where('branch_id', auth()->user()->branch_id)
                ->get(['id', 'name', 'unit', 'buy_price']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.1',
            'items.*.cost' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated) {
            $po = PurchaseOrder::create([
                'branch_id' => auth()->user()->branch_id,
                'user_id' => auth()->id(),
                'supplier_id' => $validated['supplier_id'],
                'notes' => $validated['notes'],
            ]);

            $po->items()->createMany($validated['items']);
        });

        return redirect()->route('purchase-orders.index')->with('success', 'Purchase Order created.');
    }

    /**
     * Display the specified resource.
     */
    public function show(PurchaseOrder $purchaseOrder): Response
    {
        // Ensure the user can only view POs from their own branch
        abort_if($purchaseOrder->branch_id !== auth()->user()->branch_id, 403);

        $purchaseOrder->load('supplier', 'user', 'branch', 'items.product');

        return Inertia::render('PurchaseOrders/Show', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    /**
     * Mark the Purchase Order as received and update stock.
     */
    public function receive(Request $request, PurchaseOrder $purchaseOrder)
    {
        // Ensure the user can only receive POs for their own branch
        abort_if($purchaseOrder->branch_id !== auth()->user()->branch_id, 403);
        
        if ($purchaseOrder->status !== 'pending') {
            return back()->withErrors(['status' => 'This PO has already been processed.']);
        }

        DB::transaction(function () use ($purchaseOrder) {
            foreach ($purchaseOrder->items as $item) {
                // Find the product and increment its stock
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->increment('stock', $item->quantity);

                    // Optional: Update product's buy_price if it has changed
                    if ($product->buy_price != $item->cost) {
                        $product->update(['buy_price' => $item->cost]);
                    }
                }
            }

            // Mark the Purchase Order as received
            $purchaseOrder->update(['status' => 'received']);
        });

        return redirect()->route('purchase-orders.show', $purchaseOrder)->with('success', 'Stock has been received and inventory updated.');
    }
}