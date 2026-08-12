<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\NewStock;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductTransfer;
use App\Models\StockTransfer;
use App\Models\User;
use App\Support\CurrentBranch;
use Carbon\Carbon;
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

        // Limit the seller list to the active branch (all branches when "All" is selected).
        $branchId = app(CurrentBranch::class)->id();

        $users = User::when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->with([
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
            'products' => Product::whereColumn('stock', '<', 'stock_alert')->paginate(25),
        ]);
    }


    public function empty_stock(): Response
    {
        return Inertia::render('Reports/EmptyStock', [
            'products' => Product::where('stock', '<', 1)->paginate(25),
        ]);
    }


    public function credit_sales(): Response
    {
        return Inertia::render('Reports/OutStock', [
            'products' => Product::whereColumn('stock', '<', 'stock_alert')->get(),
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

    /**
     * What moved between branches, and what actually arrived.
     *
     * The point of this report is the gap: a transfer can be sent in full and
     * counted in short, and the difference goes back to the sender. Showing
     * sent, received and returned side by side is what lets a manager see
     * where stock is going missing.
     */
    public function stock_transfers(Request $request): Response
    {
        $request->validate([
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
        ]);

        $from = $request->from_date ? Carbon::parse($request->from_date)->startOfDay() : null;
        $to = $request->to_date ? Carbon::parse($request->to_date)->endOfDay() : null;

        // No dates means the last month, not everything ever.
        if (! $from && ! $to) {
            $from = Carbon::now()->subMonth()->startOfDay();
        }

        $branchId = app(CurrentBranch::class)->id();
        $companyId = auth()->user()->company_id;

        $transfers = ProductTransfer::query()
            // ProductTransfer has no branch scope of its own.
            ->whereHas('branch', fn ($q) => $q->where('company_id', $companyId))
            // Either side of the move is this branch's business.
            ->when($branchId, fn ($q) => $q->where(
                fn ($inner) => $inner->where('branch_id', $branchId)->orWhere('from_branch_id', $branchId)
            ))
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('created_at', '<=', $to))
            ->with([
                'branch:id,name',
                'fromBranch:id,name',
                'user:id,name',
                'receivedBy:id,name',
                'productTransferItems.product:id,name,unit',
                'productTransferItems.receivedBy:id,name',
            ])
            ->orderByDesc('created_at')
            ->limit(200)
            ->get()
            ->map(fn (ProductTransfer $t) => $this->transferRow($t));

        return Inertia::render('Reports/StockTransfers', [
            'transfers' => $transfers,
            'totals' => [
                'transfers' => $transfers->count(),
                'sent' => round($transfers->sum('sent'), 2),
                'received' => round($transfers->sum('received'), 2),
                'returned' => round($transfers->sum('returned'), 2),
                'awaiting' => round($transfers->sum('awaiting'), 2),
            ],
            'filters' => [
                'from_date' => $from?->toDateString(),
                'to_date' => $to?->toDateString(),
            ],
            'branchLabel' => app(CurrentBranch::class)->isAll()
                ? 'All branches'
                : (app(CurrentBranch::class)->branch()?->name ?? '—'),
        ]);
    }

    /** One transfer flattened into its quantities, with the lines under it. */
    private function transferRow(ProductTransfer $transfer): array
    {
        $lines = $transfer->productTransferItems->map(function ($item) {
            $sent = (float) $item->stock;
            $received = $item->received_at ? (float) $item->received_stock : 0.0;
            $returned = $item->received_at ? (float) $item->returned_stock : 0.0;

            return [
                'id' => $item->id,
                'product' => $item->product?->name ?? '—',
                'unit' => $item->product?->unit,
                'sent' => $sent,
                'received' => $received,
                'returned' => $returned,
                // Still in transit: sent, but nobody has counted it yet.
                'awaiting' => $item->received_at ? 0.0 : $sent,
                'received_at' => optional($item->received_at)->format('Y-m-d H:i'),
                'received_by' => $item->receivedBy?->name,
            ];
        });

        return [
            'id' => $transfer->id,
            'date' => optional($transfer->created_at)->format('Y-m-d H:i'),
            'from' => $transfer->fromBranch?->name ?? '—',
            'to' => $transfer->branch?->name ?? '—',
            'sent_by' => $transfer->user?->name,
            'received_by' => $transfer->receivedBy?->name,
            'received_at' => optional($transfer->received_at)->format('Y-m-d H:i'),
            'status' => $transfer->status,
            'sent' => round($lines->sum('sent'), 2),
            'received' => round($lines->sum('received'), 2),
            'returned' => round($lines->sum('returned'), 2),
            'awaiting' => round($lines->sum('awaiting'), 2),
            'lines' => $lines,
        ];
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

    public function inventory(Request $request)
    {
        $request->validate([
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
            'search' => 'nullable|string',
        ]);

        $search = $request->search;
        $fromDate = $request->from_date ? Carbon::parse($request->from_date)->startOfDay() : null;
        $toDate = $request->to_date ? Carbon::parse($request->to_date)->endOfDay() : null;

        // Product's BranchScope limits these to the active branch (all branches under "All").
        $products = Product::query()
            ->when($search, fn($q) => $q->where('name', 'like', "%{$search}%"))
            ->withCount([
                'orderItems as stock_out' => function ($query) use ($fromDate, $toDate) {
                    $query->select(DB::raw('SUM(quantity)'))
                          ->when($fromDate, fn($q) => $q->where('created_at', '>=', $fromDate))
                          ->when($toDate, fn($q) => $q->where('created_at', '<=', $toDate));
                },
                'newStocks as stock_in_new' => function ($query) use ($fromDate, $toDate) {
                    $query->select(DB::raw('SUM(new_stock)'))
                          ->when($fromDate, fn($q) => $q->where('created_at', '>=', $fromDate))
                          ->when($toDate, fn($q) => $q->where('created_at', '<=', $toDate));
                },
                'purchaseOrderItems as stock_in_purchase' => function ($query) use ($fromDate, $toDate) {
                    $query->select(DB::raw('SUM(quantity)'))
                          ->whereHas('purchaseOrder', fn($q) => $q->where('status', 'received'))
                          ->when($fromDate, fn($q) => $q->where('updated_at', '>=', $fromDate)) // Use updated_at for received date
                          ->when($toDate, fn($q) => $q->where('updated_at', '<=', $toDate));
                },
            ])
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Reports/Inventory', [
            'products' => $products,
            'filters' => $request->only(['from_date', 'to_date', 'search']),
        ]);
    }

    // In app/Http/Controllers/ReportController.php

    public function productLedger(Product $product, Request $request)
    {
        $request->validate([
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
        ]);
        
        // Branch isolation enforced by Product's BranchScope on route-model binding.
        $fromDate = $request->from_date ? Carbon::parse($request->from_date)->startOfDay() : Carbon::now()->startOfMonth();
        $toDate = $request->to_date ? Carbon::parse($request->to_date)->endOfDay() : Carbon::now()->endOfDay();

        // 1. Calculate Opening Stock
        // Stock IN movements since the start date
        $stockInSinceFromDate = DB::table('new_stocks')
            ->where('product_id', $product->id)
            ->where('created_at', '>=', $fromDate)
            ->sum('new_stock');
            
        $purchasesInSinceFromDate = DB::table('purchase_order_items')
            ->join('purchase_orders', 'purchase_order_items.purchase_order_id', '=', 'purchase_orders.id')
            ->where('purchase_order_items.product_id', $product->id)
            ->where('purchase_orders.status', 'received')
            ->where('purchase_order_items.updated_at', '>=', $fromDate)
            ->sum('purchase_order_items.quantity');
            
        // Stock OUT movements since the start date
        $stockOutSinceFromDate = DB::table('order_items')
            ->where('product_id', $product->id)
            ->where('created_at', '>=', $fromDate)
            ->sum('quantity');

        // Calculate opening stock: Current Stock - (INs) + (OUTs)
        $openingStock = $product->stock - ($stockInSinceFromDate + $purchasesInSinceFromDate) + $stockOutSinceFromDate;


        // 2. Union all movements within the date range
        $sales = DB::table('order_items')
            ->where('product_id', $product->id)
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->select('created_at', 'quantity as stock_out', DB::raw("NULL as stock_in, 'Sale' as type, id"));
            
        $newStock = DB::table('new_stocks')
            ->where('product_id', $product->id)
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->select('created_at', DB::raw("NULL as stock_out"), 'new_stock as stock_in', DB::raw("'New Stock' as type, id"));
            
        $purchases = DB::table('purchase_order_items')
            ->join('purchase_orders', 'purchase_order_items.purchase_order_id', '=', 'purchase_orders.id')
            ->where('purchase_order_items.product_id', $product->id)
            ->where('purchase_orders.status', 'received')
            ->whereBetween('purchase_order_items.updated_at', [$fromDate, $toDate])
            ->select('purchase_order_items.updated_at as created_at', DB::raw("NULL as stock_out"), 'purchase_order_items.quantity as stock_in', DB::raw("'Purchase' as type, purchase_order_items.id"));

        // Combine all movements and order them by date
        $ledger = $purchases
                    ->union($newStock)
                    ->union($sales)
                    ->orderBy('created_at')
                    ->get();

        return Inertia::render('Reports/ProductLedger', [
            'product' => $product,
            'ledger' => $ledger,
            'openingStock' => $openingStock,
            'filters' => $request->only(['from_date', 'to_date']),
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
