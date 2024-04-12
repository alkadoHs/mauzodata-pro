<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\CreditSale;
use App\Models\Customer;
use Illuminate\Http\Request;
use App\Models\Product;
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
        return Inertia::render('Sales/History', [
            'orders' => auth()->user()->orders()->with(['branch', 'customer', 'orderItems.product'])->whereDate('orders.created_at', today())->orderByDesc('created_at')->get(),
            'payments' => auth()->user()->creditSalePayments()->whereDate('created_at', today())->get(),
            'expenses' => auth()->user()->expenseItems()->whereDate('expense_items.created_at', today())->get(),
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
        return Inertia::render('Credits/UserCreditSales', [
            'creditSales' => auth()->user()->creditSales()->with(['creditSalePayments.user', 'user', 'order' => ['customer', 'orderItems']])->orderByDesc('created_at')->get(),
        ]);
    }

    public function expenses(): Response
    {
        return Inertia::render('Expenses/UserExpenses', [
            'expenseItems' => auth()->user()->expenseItems()->whereDate('expenses.created_at', now())->get(),
        ]);
    }
}

