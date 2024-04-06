<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function index(): Response
    {
        $products = Product::paginate(10);
        if(request()->get('search'))
            $products = Product::search(request()->get('search'))->paginate(10);

        return Inertia::render('Cart/Index', [
            'cart'=> session()->get('cart', []),
            'products' => $products,
        ]);
    }

    public function add(Request $request)
    {
        $product = Product::find($request->input('product_id'));
        if (!$product) {
            abort(404);
        }

        $cart = session()->get('cart', []);

        if(isset($cart[$product->id])) {
            return back()->withErrors([
                'product_id' => 'Alredy available to the cart.'
            ]);
        }

        $cart[$product->id] = [
            'id' => $product->id,
            'name' => $product->name,
            'price' => $product->sale_price,
            'quantity' => isset($cart[$product->id]) ? $cart[$product->id]['quantity'] + 1 : 1,
        ];

        session()->put('cart', $cart);

        return redirect()->route('cart.index');
    }

    public function update(Request $request, int $productId)
    {
        $quantity = $request->input('quantity');
        $product = Product::find($productId);

        if (!$product) {
            abort(404);
        }

        // Check if requested quantity exceeds available stock
        if($quantity <= 0 || $quantity == "" || $quantity == null) {
            return back()->withErrors([
                'quantity' => "Quantity can not be equals to zero or less than zero"
            ]);
        }

        if ($quantity > $product->stock) {
            return redirect()->back()->withErrors([
                "quantity" => "Stock is not enough, stock available for '$product->name' is ~ $product->stock $product->unit"
            ]);
        }

        $cart = session()->get('cart', []);

        if (isset($cart[$productId])) {
            $cart[$productId]['quantity'] = $quantity;
            session()->put('cart', $cart);
        }

        return redirect()->back();
    }

    public function remove(Request $request)
    {
        $productId = $request->input('product_id');
        $cart = session()->get('cart', []);

        if (isset($cart[$productId])) {
            unset($cart[$productId]);
            session()->put('cart', $cart);
        }

        return redirect()->route('cart.index');
    }
}

