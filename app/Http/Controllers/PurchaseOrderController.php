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
    public function index(): Response
    {
        return Inertia::render('PurchaseOrders/Index', [
            'purchaseOrders' => PurchaseOrder::with('supplier', 'user', 'items')
                ->latest()
                ->paginate(20),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('PurchaseOrders/Create', [
            'suppliers' => Supplier::where('company_id', auth()->user()->company_id)->get(),
            'products' => Product::get(['id', 'name', 'unit', 'buy_price']),
        ]);
    }

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

    public function show(PurchaseOrder $purchaseOrder): Response
    {
        $purchaseOrder->load('supplier', 'user', 'branch', 'items.product');

        return Inertia::render('PurchaseOrders/Show', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    public function receive(Request $request, PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'pending') {
            return back()->withErrors(['status' => 'This PO has already been processed.']);
        }

        DB::transaction(function () use ($purchaseOrder) {
            foreach ($purchaseOrder->items as $item) {
                // Find the product and increment its stock
                $product = Product::find($item->product_id);
                $product->increment('stock', $item->quantity);

                // Optional: Update product's buy_price if it has changed
                if ($product->buy_price != $item->cost) {
                    $product->update(['buy_price' => $item->cost]);
                }
            }

            // Mark the Purchase Order as received
            $purchaseOrder->update(['status' => 'received']);
        });

        return redirect()->route('purchase-orders.show', $purchaseOrder)->with('success', 'Stock has been received and inventory updated.');
    }
}