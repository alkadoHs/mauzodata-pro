<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\NewStock;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductTransfer;
use App\Models\StockTransfer;
use App\Models\User;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function user_sales(): Response
    {
        $from_date = request()->startDate ?? null;
        $to_date = request()->endDate ?? null;

        // dd([$startDate, $to_date]);

        $users = User::with([
                'orders' => fn (Builder $query) => $query
                                                    ->when(!$from_date && !$to_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->where('orders.status', 'paid')->whereDate('orders.created_at', today());
                                                     })
                                                     ->when($from_date && $to_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->where('orders.status', 'paid')->whereDate('orders.created_at', '>=', $from_date)->whereDate('orders.created_at', '<=', $to_date);
                                                     })
                                                     ->when($from_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->where('orders.status', 'paid')->whereDate('orders.created_at', '>=', $from_date);
                                                     })
                                                     ->when($to_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->where('orders.status', 'paid')->whereDate('orders.created_at', '<=', $to_date);
                                                     })
                ,
                'orderItems' => fn (Builder $query) => $query->with('product')
                                                    ->when(!$from_date && !$to_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->whereRelation('order', 'status', 'paid')->whereDate('order_items.created_at', today());
                                                     })
                                                      ->when($from_date && $to_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->whereRelation('order', 'status', 'paid')->whereDate('order_items.created_at', '>=', $from_date)->whereDate('order_items.created_at', '<=', $to_date);
                                                     })
                                                     ->when($from_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->whereRelation('order', 'status', 'paid')->whereDate('order_items.created_at', '>=', $from_date);
                                                     })
                                                     ->when($to_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->whereRelation('order', 'status', 'paid')->whereDate('order_items.created_at', '<=', $to_date);
                                                     }),
                'expenseItems' => fn (Builder $query) => $query
                                                    ->when(!$from_date && !$to_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->whereDate('expense_items.created_at', today());
                                                     })
                                                     ->when($from_date && $to_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->whereDate('expense_items.created_at', '>=', $from_date)->whereDate('expense_items.created_at', '<=', $to_date);
                                                     })
                                                     ->when($from_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->whereDate('expense_items.created_at', '>=', $from_date);
                                                     })
                                                     ->when($to_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->whereDate('expense_items.created_at', '<=', $to_date);
                                                     }),
                'creditSalePayments' => fn (Builder $query) => $query
                                                    ->when(!$from_date && !$to_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->whereDate('credit_sale_payments.created_at', today());
                                                     })
                                                     ->when($from_date && $to_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->whereDate('credit_sale_payments.created_at', '>=', $from_date)->whereDate('credit_sale_payments.created_at', '<=', $to_date);
                                                     })
                                                     ->when($from_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->whereDate('credit_sale_payments.created_at', '>=', $from_date);
                                                     })
                                                     ->when($to_date, function (Builder $query) use($from_date, $to_date) { 
                                                        return $query->whereDate('credit_sale_payments.created_at', '<=', $to_date);
                                                     }),
            ])->get();
                    
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
        return Inertia::render('Reports/EmptyStock', [
            'products' => Product::where('branch_id', auth()->user()->branch_id)->where('stock', '<', 1)->paginate(25),
        ]);
    }


    public function credit_sales(): Response
    {
        return Inertia::render('Reports/OutStock', [
            'products' => Product::where('branch_id', auth()->user()->branch_id)->whereColumn('stock', '<', 'stock_alert')->get(),
        ]);
    }

    public function expenses(): Response
    {
      $dateFilter = request()->date ?? null;

      $expenses = $dateFilter ? Expense::withSum('expenseItems', 'cost')->with('user')->whereDate('created_at', $dateFilter)->get() : 
                                Expense::withSum('expenseItems', 'cost')->with('user')->whereDate('created_at', now())->get();

      return Inertia::render('Reports/Expenses', [
         'expenses' => $expenses
      ]);
    }

    public function expense_items(Request $request, Expense $expense): Response
    {
      return Inertia::render('Reports/ExpenseItems', [
         'expenseItems' => $expense->expenseItems()->with('expense.user')->get(),
      ]);
    }

    public function stock_transfers(): Response
    {
      $dateFilter = request()->date ?? null; 

      $stockTransfers = ProductTransfer::withCount('productTransferItems')->with(['branch', 'user'])->when($dateFilter, function (Builder $query) use($dateFilter) {
         return $query->whereDate('created_at', $dateFilter);
      })->orderByDesc('created_at')->limit(25)->get();

      return Inertia::render('Reports/StockTransfers', [
         'stockTransfers' => $stockTransfers
      ]);
    }

    public function legacy_stock_transfer(): Response
    {
        $dateFilter = request()->date ?? null; 

      $stockTransfers = $dateFilter ? StockTransfer::with(['product', 'branch'])->whereDate('created_at', $dateFilter)->orderBy('branch_id')->get()
                                    : StockTransfer::with(['product', 'branch'])->whereDate('created_at', now())->orderBy('branch_id')->get();

      return Inertia::render('Reports/LegacyStockTransfers', [
         'stockTransfers' => $stockTransfers
      ]);
    }

    public function new_stocks(): Response
    {
      $dateFilter = request()->date ?? null; 

      $newStocks = $dateFilter ? NewStock::with(['product'])->whereDate('created_at', $dateFilter)->get()
                                    : NewStock::with(['product'])->whereDate('created_at', now())->get();

      return Inertia::render('Reports/NewStocks', [
         'newStocks' => $newStocks,
      ]);
    }

    public function inventory()
    {
      $search = request()->search ?? null;
      $from_date = request()->fromDate ?? null;
      $to_date = request()->toDate ?? null;

      $products = Product::when($search, function (Builder $query) use($search) {
                            $query->where('name', 'LIKE', "%{$search}%");
                        })
                        ->withCount(['orderItems' => function (Builder $query) use($from_date, $to_date) {
                            $query->when($from_date && !$to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date);
                                })
                                ->when(!$from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '<=', $to_date);
                                })
                                ->when($from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date)
                                          ->whereDate('created_at', '<=', $to_date);
                                });
                        }])
                        ->withSum(['stockTransfers' => function (Builder $query) use($from_date, $to_date) {
                            $query->when($from_date && !$to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date);
                                })
                                ->when(!$from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '<=', $to_date);
                                })
                                ->when($from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date)
                                          ->whereDate('created_at', '<=', $to_date);
                                });
                        }], 'stock')
                        ->withSum(['newStocks' => function (Builder $query) use($from_date, $to_date) {
                            $query->when($from_date && !$to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date);
                                })
                                ->when(!$from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '<=', $to_date);
                                })
                                ->when($from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date)
                                          ->whereDate('created_at', '<=', $to_date);
                                });
                        }], 'stock')
                        ->withSum(['orderItems' => function (Builder $query) use($from_date, $to_date) {
                            $query->when($from_date && !$to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date);
                                })
                                ->when(!$from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '<=', $to_date);
                                })
                                ->when($from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date)
                                          ->whereDate('created_at', '<=', $to_date);
                                });
                        }], 'quantity')
                        ->withSum(['orderItems' => function (Builder $query) use($from_date, $to_date) {
                            $query->when($from_date && !$to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date);
                                })
                                ->when(!$from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '<=', $to_date);
                                })
                                ->when($from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date)
                                          ->whereDate('created_at', '<=', $to_date);
                                });
                        }], 'total')
                       
                        ->withSum(['orderItems' => function (Builder $query) use($from_date, $to_date) {
                            $query->when($from_date && !$to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date);
                                })
                                ->when(!$from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '<=', $to_date);
                                })
                                ->when($from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date)
                                          ->whereDate('created_at', '<=', $to_date);
                                });
                        }], 'profit')
                        ->withAvg(['orderItems' => function (Builder $query) use($from_date, $to_date) {
                            $query->when($from_date && !$to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date);
                                })
                                ->when(!$from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '<=', $to_date);
                                })
                                ->when($from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date)
                                          ->whereDate('created_at', '<=', $to_date);
                                });
                        }], 'total')
                        ->withAvg(['orderItems' => function (Builder $query) use($from_date, $to_date) {
                            $query->when($from_date && !$to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date);
                                })
                                ->when(!$from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '<=', $to_date);
                                })
                                ->when($from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date)
                                          ->whereDate('created_at', '<=', $to_date);
                                });
                        }], 'profit')
                        ->withAvg(['orderItems' => function (Builder $query) use($from_date, $to_date) {
                            $query->when($from_date && !$to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date);
                                })
                                ->when(!$from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '<=', $to_date);
                                })
                                ->when($from_date && $to_date, function (Builder $query) use($from_date, $to_date) {
                                    $query->whereDate('created_at', '>=', $from_date)
                                          ->whereDate('created_at', '<=', $to_date);
                                });
                        }], 'quantity')
                        ->paginate(25);

      return Inertia::render('Reports/Inventory', [
         'products' => $products
      ]);
    }


    public function topProductsChart(Request $request)
    {
        $query = OrderItem::with('product')
            ->select('product_id', DB::raw('SUM(quantity) as total_quantity'))
            ->groupBy('product_id')
            ->orderBy('total_quantity', 'desc')
            ->limit(5); // Top 5 products

        // You can add date filtering here later if needed
        // $query->when($request->start_date, fn($q) => $q->whereDate('created_at', '>=', $request->start_date));
        // $query->when($request->end_date, fn($q) => $q->whereDate('created_at', '<=', $request->end_date));

        $data = $query->get()->map(fn($item) => [
            'name' => $item->product->name,
            'quantity' => (int) $item->total_quantity,
            'fill' => 'hsl(var(--chart-' . (($item->product_id % 5) + 1) . '))'
        ]);

        return response()->json($data);
    }

    public function supplierPurchasesChart(Request $request)
    {
        $query = \App\Models\PurchaseOrder::with('supplier')
            ->join('purchase_order_items', 'purchase_orders.id', '=', 'purchase_order_items.purchase_order_id')
            ->select(
                'supplier_id',
                DB::raw('SUM(purchase_order_items.quantity * purchase_order_items.cost) as total_cost')
            )
            ->groupBy('supplier_id')
            ->orderBy('total_cost', 'desc')
            ->limit(5); // Top 5 suppliers

        $data = $query->get()->map(fn($item) => [
            'name' => $item->supplier->name,
            'total' => (int) $item->total_cost
        ]);

        return response()->json($data);
    }

}
