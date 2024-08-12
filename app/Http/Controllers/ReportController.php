<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
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
        $startDate = request()->startDate ?? null;
        $endDate = request()->endDate ?? null;

        // dd([$startDate, $endDate]);

        $users = User::with([
                'orders' => fn (Builder $query) => $query
                                                    ->when(!$startDate && !$endDate, function (Builder $query) { 
                                                        return $query->where('orders.status', 'paid')->whereDate('orders.created_at', today());
                                                     })
                                                     ->when($startDate && $endDate, function (Builder $query) { 
                                                        return $query->where('orders.status', 'paid')->whereDate('orders.created_at', '>=', request()->startDate)->whereDate('orders.created_at', '<=', request()->endDate);
                                                     })
                                                     ->when($startDate, function (Builder $query) { 
                                                        return $query->where('orders.status', 'paid')->whereDate('orders.created_at', '>=', request()->startDate);
                                                     })
                                                     ->when($endDate, function (Builder $query) { 
                                                        return $query->where('orders.status', 'paid')->whereDate('orders.created_at', '<=', request()->endDate);
                                                     })
                ,
                'orderItems' => fn (Builder $query) => $query->with('product')
                                                    ->when(!$startDate && !$endDate, function (Builder $query) { 
                                                        return $query->whereRelation('order', 'status', 'paid')->whereDate('order_items.created_at', today());
                                                     })
                                                      ->when($startDate && $endDate, function (Builder $query) { 
                                                        return $query->whereRelation('order', 'status', 'paid')->whereDate('order_items.created_at', '>=', request()->startDate)->whereDate('order_items.created_at', '<=', request()->endDate);
                                                     })
                                                     ->when($startDate, function (Builder $query) { 
                                                        return $query->whereRelation('order', 'status', 'paid')->whereDate('order_items.created_at', '>=', request()->startDate);
                                                     })
                                                     ->when($endDate, function (Builder $query) { 
                                                        return $query->whereRelation('order', 'status', 'paid')->whereDate('order_items.created_at', '<=', request()->endDate);
                                                     }),
                'expenseItems' => fn (Builder $query) => $query
                                                    ->when(!$startDate && !$endDate, function (Builder $query) { 
                                                        return $query->whereDate('expense_items.created_at', today());
                                                     })
                                                     ->when($startDate && $endDate, function (Builder $query) { 
                                                        return $query->whereDate('expense_items.created_at', '>=', request()->startDate)->whereDate('expense_items.created_at', '<=', request()->endDate);
                                                     })
                                                     ->when($startDate, function (Builder $query) { 
                                                        return $query->whereDate('expense_items.created_at', '>=', request()->startDate);
                                                     })
                                                     ->when($endDate, function (Builder $query) { 
                                                        return $query->whereDate('expense_items.created_at', '<=', request()->endDate);
                                                     }),
                'creditSalePayments' => fn (Builder $query) => $query
                                                    ->when(!$startDate && !$endDate, function (Builder $query) { 
                                                        return $query->whereDate('credit_sale_payments.created_at', today());
                                                     })
                                                     ->when($startDate && $endDate, function (Builder $query) { 
                                                        return $query->whereDate('credit_sale_payments.created_at', '>=', request()->startDate)->whereDate('credit_sale_payments.created_at', '<=', request()->endDate);
                                                     })
                                                     ->when($startDate, function (Builder $query) { 
                                                        return $query->whereDate('credit_sale_payments.created_at', '>=', request()->startDate);
                                                     })
                                                     ->when($endDate, function (Builder $query) { 
                                                        return $query->whereDate('credit_sale_payments.created_at', '<=', request()->endDate);
                                                     }),
            ])->where('company_id', auth()->user()->company_id)->get();
                    
        return Inertia::render('Reports/UserSales', [
            'users' => $users,
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
