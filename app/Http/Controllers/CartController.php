<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\CreditSale;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\User;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function index(): Response
    {
        $cart = Cart::with(['cartItems.product', 'customer'])->firstOrCreate();

        return Inertia::render('Cart/Index', [
            'cart'=> Cart::with(['cartItems.product', 'customer'])->firstOrCreate(),
            'total' => $cart->cartItems->reduce(fn ($acc, $item) => $acc + $item->quantity * $item->price, 0) ?? 0,
            'products' => Product::where('stock', '>', 0)->get(),
            'paymentMethods' => PaymentMethod::where('company_id', auth()->user()->company_id)->get(),
        ]);
    }

    public function add(Request $request)
    {
        $product = Product::find($request->input('product_id'));

        $cart = Cart::first();
        
        $productExist = CartItem::where('product_id', $product->id)->first();
        if($productExist) {
            if($product->stock < $productExist->quantity) {
                return back()->withErrors([
                    'quantity' => 'Product exceed the available stock.',
                ]);
            } 
            // $productExist->increment('quantity');
        } else {
            $cart->cartItems()->create([
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => $product->sale_price
            ]);
        }

        return back();
    }

    public function update(Request $request, $item_id)
    {
        $quantity = $request->input('quantity');
        $item = CartItem::find($item_id);
        $product = Product::find($item->product_id);

        // dd($item);
    
        if($product->stock < $quantity) {
            return back()->withErrors([
                'quantity' => 'Quantity exceed the available stock.'
            ]);
        } else {
            if($product->whole_sale > 0 && $quantity >= $product->whole_sale ) {
                $item->update([
                    'quantity' => $quantity,
                    'price' => $product->whole_price,
                ]);

                return back()->with(
                    'message', "Whole sale price applied to this item."
                );
            }
            $item->update([
                'quantity' => $quantity,
                'price' => $product->sale_price,
            ]);
        }

        return redirect()->back();
    }

    
    public function addCustomer(StoreCustomerRequest $request) {
        $cart = Cart::first();
        $customer = Customer::create([...$request->validated(), 'branch_id' => auth()->user()->branch_id]);

        $cart->update(['customer_id' => $customer->id]);
        return back();
    }


    public function remove(Request $request, $item_id)
    {
        $item = CartItem::find($item_id);
        $item->delete();
        return back();
    }

    public function sales(): Response
    {
        $products_sold = OrderItem::with('product')
            ->select(
                'product_id',
                DB::raw('SUM(quantity) as total_qty'),
                DB::raw('SUM(total) as total_price'),
                DB::raw('MAX(created_at) as latest_created_at') // ✅ needed for ordering
            )
            ->whereRelation('order', 'user_id', auth()->id())
            ->whereDate('created_at', today())
            ->groupBy('product_id') // ✅ group only by product_id
            ->orderByDesc('latest_created_at') // ✅ safe because it's aggregated
            ->get();

        return Inertia::render('Sales/History', [
            'orders' => auth()->user()->orderItems()
                ->whereRelation('order', 'status', 'paid')
                ->whereDate('order_items.created_at', today())
                ->sum('total'),

            'payments' => auth()->user()->creditSalePayments()
                ->whereDate('created_at', today())
                ->sum('amount'),

            'expenses' => auth()->user()->expenseItems()
                ->whereDate('expense_items.created_at', today())
                ->sum('cost'),

            'products_sold' => $products_sold
        ]);
    }


    public function pricing(): Response
    {
       $products = Product::paginate(25);
        if(request()->get('search')) {
            $products = Product::search(request()->get('search'))->paginate(25);
        }
        return Inertia::render('Products/Pricing', [
            'products' => $products,
        ]);
    }


    public function credit_sales(): Response
    {
        $creditSales = auth()->user()->creditSales()->where('status', 'onprogresss')->with(['creditSalePayments.user', 'user', 'order' => ['customer', 'orderItems']])->orderByDesc('created_at')->paginate(25);

        if(auth()->user()->role == 'admin') {
            $creditSales = CreditSale::where('status', 'onprogresss')->with(['creditSalePayments.user', 'user', 'order' => ['customer', 'orderItems']])->orderByDesc('created_at')->paginate(50);
        }

        if(request()->search) {
            if(auth()->user()->role == 'admin') {
                $creditSales = CreditSale::where('status', 'onprogresss')->with(['creditSalePayments.user', 'user', 'order' => ['customer', 'orderItems']])
                             ->whereRelation('customer', 'name', 'LIKE', '%'. request()->search . '%')
                             ->orderByDesc('created_at')->paginate(25);
            }
            $creditSales = CreditSale::where('status', 'onprogresss')->with(['creditSalePayments.user', 'user', 'order' => ['customer', 'orderItems']])
                             ->whereRelation('customer', 'name', 'LIKE', '%'. request()->search . '%')
                             ->orderByDesc('created_at')->paginate(25);
        }

        return Inertia::render('Credits/UserCreditSales', [
            'creditSales' => $creditSales,
        ]);
    }

    public function expenses(): Response
    {
        return Inertia::render('Expenses/UserExpenses', [
            'expenseItems' => auth()->user()->expenseItems()->whereDate('expenses.created_at', now())->get(),
            'users' => User::where('id', auth()->id())->orWhere('role', 'vendor')->get(),
        ]);
    }
}

