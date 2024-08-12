<?php

namespace App\Http\Controllers;

use App\Models\NewStock;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;
use Inertia\Inertia;

class NewStockController extends Controller
{
    public function index(): Response
    {
        $newStocks = NewStock::with('product')->whereDate('created_at', today())->get();
        $products = Product::get();
        return Inertia::render('Stocks/Index', [
            'newStocks' => $newStocks,
            'products' => $products,
        ]);
    }


    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => 'required',
            'new_stock' => 'required|numeric|max:99999999', 
        ]);

        $product = Product::find($validated['product_id']);

        // if new stock exist today show the info message else create new
        $newStock = NewStock::with('product')->whereDate('created_at', today())->where('product_id', $validated['product_id'])->first();

        if($newStock) {
            $newStock->increment('new_stock', $validated['new_stock']);
            return redirect()->back()->with('info', "Incremented the stock of {$newStock->product->name}.");
        }
        NewStock::create([...$validated, 'stock' => $product->stock]);

        //increment the product
        $product->increment('stock', $validated['new_stock']);

        return redirect()->back()->with('success', 'Created successfully!');
    }
}
