<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CreditSale;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function complete(Request $request)
    {
        $cart = Cart::with('cartItems')->first();
        $totalPrice = $cart->cartItems->reduce(fn ($acc, $item) => $acc + $item->price * $item->quantity);
        $paid = (float) $request->post('paid');

        DB::transaction(function () use ($request, $cart, $totalPrice, $paid) {
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

            //if amount paid is less than total price add order to the credit sales
            if($paid < $totalPrice) {
                $creditSale = $order->creditSale()->create();

                //take what has paid and add to credit payments
                $creditSale->creditSalePayments()->create(['amount' => $order->paid ?? 0]);
            }
    
            $cart->delete();
        });

        if($cart->print_invoice == 1)
            return redirect(route('orders.preview'));
        else
            return redirect()->back();
    }


    public function preview()
    {
        $latesOrder = Order::where('user_id', auth()->id())->with(['customer', 'user', 'branch', 'orderItems.product'])->latest()->first();
        return Inertia::render('Orders/Preview', [
            'order' => $latesOrder,
        ]);
    }
}
