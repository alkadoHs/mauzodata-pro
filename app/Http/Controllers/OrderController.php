<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CreditSale;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        $startDate = request()->startDate ?? null;
        $endDate = request()->endDate ?? null;
        $search = request()->search ?? null;
        $userId = request()->user_id;

        $products_sold = OrderItem::query()
            ->with('product')
            ->select(
                'product_id',
                DB::raw('SUM(quantity) as total_qty'),
                DB::raw('SUM(total) as total_price'),
                DB::raw('SUM(total_buy_price) as total_buy_price'),
                DB::raw('SUM(profit) as total_profit'),
                DB::raw('MAX(created_at) as latest_created_at') // ✅ for ordering
            )
            ->when(!$startDate && !$endDate && !$userId, function (Builder $query) {
                return $query->whereDate('created_at', today());
            })
            ->when($userId, function (Builder $query) use ($userId) {
                return $query->whereRelation('order', 'user_id', $userId);
            })
            ->when($startDate, function (Builder $query) use ($startDate) {
                return $query->whereDate('created_at', '>=', $startDate);
            })
            ->when($endDate, function (Builder $query) use ($endDate) {
                return $query->whereDate('created_at', '<=', $endDate);
            })
            ->when($search, function (Builder $query) use ($search) {
                return $query->whereHas('product', function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%');
                });
            })
            ->groupBy('product_id') // ✅ only group by product_id
            ->orderByDesc('latest_created_at') // ✅ safe because it's aggregated
            ->get();

        $filters = [
            'dateBtn' => [
                'startDate' => $startDate,
                'endDate' => $endDate,
            ],
            'search' => $search,
        ];

        return Inertia::render('Sales/Index', [
            'filters' => $filters,
            'users' => User::get(),
            'products_sold' => $products_sold,
        ]);
    }



    public function complete(Request $request)
    {
        $cart = Cart::with('cartItems')->first();
        $totalPrice = $cart->cartItems->reduce(fn ($acc, $item) => $acc + $item->price * $item->quantity);
        $paid = (float) $request->post('paid');

        DB::transaction(function () use ($request, $cart, $totalPrice, $paid) {
            $order = Order::create(['customer_id' => $cart->customer_id, 'user_id' => auth()->id(), ...$request->all()]);
            
            foreach ($cart->cartItems as $item) {
                $product = Product::find($item->product_id);

                $order->orderItems()->create([
                    'product_id' => $item->product_id,
                    'buy_price' => $product->buy_price,
                    'price' => $item->price,
                    'quantity' => $item->quantity,
                ]);

                
                $product->decrement('stock', $item->quantity);
            }

            //if amount paid is less than total price add order to the credit sales
            if($request->post('status') == 'credit') {
                $creditSale = $order->creditSale()->create([
                    'customer_id' => $order->customer_id
                ]);

                //take what has paid and add to credit payments
                $creditSale->creditSalePayments()->create(['amount' => $order->paid ?? 0.00 ]);
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

    public function invoices(Request $request)
    {
        $order = request()->order_id ?? null;
        $search = request()->search ?? null;

        $orders = Order::with(['customer', 'user', 'orderItems.product'])->orderBy('user_id')->latest()->paginate(50);

        if($search) {
            $orders = Order::with(['customer', 'user', 'orderItems.product'])->where('id', $search)->orWhereRelation('customer', 'name', "%$search%")->paginate(10);
        }
        return Inertia::render('Sales/Invoices', [
            'orders'  => $orders,
        ]);
    }

    public function invoice(Request $request, Order $invoice)
    {
        $currentOrder = Order::where('id', $invoice->id)->with(['customer', 'user', 'branch', 'orderItems.product'])->first();
        return Inertia::render('Orders/Invoice', [
            'order' => $currentOrder,
        ]);
    }

    public function destroy(Order $order): RedirectResponse
    {
        $order->delete();

        return redirect()->back();
    }
}
