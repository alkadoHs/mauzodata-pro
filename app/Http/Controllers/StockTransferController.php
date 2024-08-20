<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\StockTransfer;

class StockTransferController extends Controller
{
    public function index():Response
    {
        $stockTransfers = StockTransfer::with(['branch', 'releasedBy', 'product'])
                                ->where('status', 'pending')
                                ->orderBy('branch_id')
                                ->get();

        return Inertia::render('StockTransfers/Index', [
            'stockTransfers' => $stockTransfers,
            'branches' => Branch::get(),
            'products' => Product::get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required',
            'product_id' => 'required',
            'stock' => 'required|numeric|max:99999999',
        ]);

        $product = Product::find($validated['product_id']);

        if($validated['stock'] > $product->stock) {
            return redirect()->back()->with('error', "Stock not enough!");
        }

        $productExist = StockTransfer::where([
            ['branch_id', '=', $validated['branch_id']],
            ['product_id', '=', $validated['product_id']],
            ['status', '=', 'pending'],
        ])->whereDate('created_at', today())->first();

        if($productExist) {
            $productExist->increment('stock', $validated['stock']);

            $product->decrement('stock', $validated['stock']);
            return redirect()->back()->with('info', 'Bidhaa hii amepewa huyu venda tayari kwahiyo imeongezwa kwenye stock yake.');
        }

        StockTransfer::create([
            ...$validated,
            'released_by' => auth()->id(),
        ]);

        $product->decrement('stock', $validated['stock']);

        return redirect()->back()->with('success','Transfered successfully');
    }

    public function update(Request $request, StockTransfer $product): RedirectResponse
    {
        $validated = $request->validate([
            'stock' => 'required|numeric',
        ]);

        $oProduct = Product::find($product->product_id);

        if($validated['stock'] > $oProduct->stock + $validated['stock']) {
            return redirect()->back()->with('error', 'This amount is greater than the stock available.');
        }
        
        $product->update($validated);

        return redirect()->back()->with('success', 'confirmed successfully!');
    }


    public function confirm(Request $request, StockTransfer $product) 
    {
        // mark stock transfer as confirmed
        $product->update(['status' => 'confirmed']);

        return redirect()->back()->with('success', 'Stock confirmed successfully!');
    }



    public function destroy(Request $request, StockTransfer $vendorProduct): RedirectResponse
    {
        $vendorProduct->delete();
        return redirect()->back();
    }

}
