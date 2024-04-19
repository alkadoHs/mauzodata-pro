<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CreditSale;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        $orders = Order::with(['orderItems.product', 'user'])->paginate(25);
        $filters = ['dateBtn' => ['startDate' => null, 'endDate' =>null ], 'search' => null];
        if(request()->search) {
            $orders = Order::where('id', request()->search)->with(['orderItems.product', 'user'])->paginate(25);
            $filters['search'] = request()->search;
            
        } elseif (request(['startDate', 'endDate'])) {
            $orders = Order::whereBetween('created_at', [request()->startDate, request()->endDate]) ->with(['orderItems.product', 'user'])->paginate(25);
            $filters['dateBtn']['startDate'] = request()->startDate;
            $filters['dateBtn']['endDate'] = request()->endDate;
        }
        return Inertia::render('Sales/Index', [
            'orders' => $orders,
            'filters' => $filters,
        ]);
    }


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

        return redirect(route('orders.preview'));
    }


    public function preview()
    {
        $latesOrder = Order::where('user_id', auth()->id())->with(['customer', 'user', 'branch', 'orderItems.product'])->latest()->first();
        return Inertia::render('Orders/Preview', [
            'order' => $latesOrder,
        ]);
    }
}
