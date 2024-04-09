<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function complete(Request $request)
    {
        $cart = Cart::with('cartItems')->first();

        DB::transaction(function () use ($request, $cart) {
            $order = Order::create(['customer_id' => $cart->customer_id, ...$request->all()]);
            
            foreach ($cart->cartItems as $item) {
                $product = Product::find($item->product_id);

                $order->orderItems()->create([
                    'product_id' => $item->product_id,
                    'price' => $item->price,
                    'quantity' => $item->quantity,
                ]);

                $product->decrement('stock', $item->quantity);
            }
    
            $cart->delete();
        });

        return back();
    }
}
