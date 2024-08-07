<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\User;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function user_sales(): Response
    {
        return Inertia::render('Reports/UserSales', [
            'users' => User::with([
                'orders' => fn (Builder $query) => $query->whereDate('orders.created_at', today()),
                'orderItems' => fn (Builder $query) => $query->with('product')->whereDate('order_items.created_at', today()),
                'expenseItems' => fn (Builder $query) => $query->whereDate('expense_items.created_at', today()),
                'creditSalePayments' => fn (Builder $query) => $query->whereDate('credit_sale_payments.created_at', today())
            ])->where('company_id', auth()->user()->company_id)->get(),
        ]);
    }


    public function out_stock(): Response
    {
        return Inertia::render('Reports/OutStock', [
            'products' => Product::where('branch_id', auth()->user()->branch_id)->whereColumn('stock', '<', 'stock_alert')->paginate(25),
        ]);
    }


    public function empty_stock(): Response
    {
        return Inertia::render('Reports/OutStock', [
            'products' => Product::where('branch_id', auth()->user()->branch_id)->where('stock', '<', 1)->paginate(25),
        ]);
    }


    public function credit_sales(): Response
    {
        return Inertia::render('Reports/OutStock', [
            'products' => Product::where('branch_id', auth()->user()->branch_id)->whereColumn('stock', '<', 'stock_alert')->get(),
        ]);
    }
}
