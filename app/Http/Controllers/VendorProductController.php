<?php

namespace App\Http\Controllers;

use App\Models\VendorProduct;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\User;
use Inertia\Inertia;
use App\Models\Order;
use Inertia\Response;

class VendorProductController extends Controller
{
    public function index():Response
    {
        $vendorProducts = VendorProduct::with(['user', 'releasedBy', 'confirmedBy', 'product'])
                                ->whereDate('created_at', today())
                                ->where('status', 'pending')
                                ->orderBy('user_id')
                                ->get();

        return Inertia::render('VendorProducts/Index', [
            'vendorProducts' => $vendorProducts,
            'users' => User::where('role', 'vendor')->get(),
            'products' => Product::get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => 'required',
            'product_id' => 'required',
            'stock' => 'required|numeric|max:99999999|min:0.5',
        ]);

        $product = Product::find($validated['product_id']);

        if($validated['stock'] > $product->stock) {
            return redirect()->back()->with('error', "Stock not enough!");
        }

        $productExist = VendorProduct::where([
            ['user_id', '=', $validated['user_id']],
            ['product_id', '=', $validated['product_id']],
            ['status', '=', 'pending'],
        ])->whereDate('created_at', today())->first();

        if($productExist) {
            $productExist->increment('stock', $validated['stock']);

            $productExist->decrement('stock', $validated['stock']);
            return redirect()->back()->with('info', 'Bidhaa hii amepewa huyu venda tayari kwahiyo imeongezwa kwenye stock yake.');
        }

        VendorProduct::create([
            ...$validated,
            'released_by' => auth()->id(),
            'buy_price' => $product->buy_price,
            'sale_price' => $product->sale_price,
        ]);

        $product->decrement('stock', $validated['stock']);

        return redirect()->back()->with('success','created successfully');
    }

    public function update(Request $request, VendorProduct $vendorProduct): RedirectResponse
    {
        $validated = $request->validate([
            'sold' => 'required|numeric|min:0.5',
        ]);

        if($validated['sold'] > $vendorProduct->stock) {
            return redirect()->back()->with('error', 'This amount is greater than the stock available.');
        }
        
        $vendorProduct->update($validated);

        return redirect()->back()->with('success', 'confirmed successfully!');
    }

    public function confirm_stock(Request $request, VendorProduct $vendorProduct) 
    {
        // find todays order of this vendor if exists
        $vendorOrder = Order::whereDate('created_at', today())->where('user_id', $vendorProduct->user_id)->first();

        // if order exist add order item(vendor product) into it else create new order and add order item
        if($vendorOrder) {
            $vendorOrder->orderItems()->create([
                'product_id' => $vendorProduct->product_id,
                'buy_price' => $vendorProduct->buy_price,
                'price' => $vendorProduct->sale_price,
                'quantity' => $vendorProduct->sold,
            ]);
        } else {
            $newOrder = Order::create([
                'branch_id' => auth()->user()->branch_id,
                'user_id' => $vendorProduct->user_id,
                'paid' => 0,
            ]);
    
            $newOrder->orderItems()->create([
                'product_id' => $vendorProduct->product_id,
                'buy_price' => $vendorProduct->buy_price,
                'price' => $vendorProduct->sale_price,
                'quantity' => $vendorProduct->sold,
            ]);
        }

        // mark vendor product as confirmed
        $vendorProduct->update(['status' => 'confirmed']);

        return redirect()->back()->with('success', 'Stock confirmed successfully!');
    }

    public function destroy(Request $request, VendorProduct $vendorProduct): RedirectResponse
    {
        $vendorProduct->delete();
        return redirect()->back();
    }
}
