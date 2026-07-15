<?php

namespace App\Http\Controllers;

use App\Models\CreditSale;
use App\Models\ExpenseItem;
use App\Models\Product;
use App\Models\OrderItem;
use App\Support\CurrentBranch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        // Admins and managers get the management view (branch KPIs, chart, date filter).
        // Branch scoping is automatic via the models' global scopes, so a specific
        // active branch shows that branch and "All" aggregates across the company.
        $isAdmin = app(CurrentBranch::class)->canSwitch();

        // --- Date Filtering ---
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        // Non-admins always see "Today". Admins can use the filter.
        $startDate = $isAdmin && $request->start_date ? Carbon::parse($request->start_date) : Carbon::today();
        $endDate = $isAdmin && $request->end_date ? Carbon::parse($request->end_date) : Carbon::today();

        // --- Initialize all KPI variables to prevent scope issues ---
        $kpis = [
            'mySales' => 0,
            'myProfit' => 0,
            'myExpenses' => 0,
            'myCreditReceived' => 0,
            'myOutstandingDebt' => 0,
            'branchSales' => 0,
            'branchProfit' => 0,
            'branchExpenses' => 0,
            'totalDebt' => 0,
            'totalCapital' => 0,
        ];
        
        $salesChartData = [];

        // --- Calculate KPIs for the currently logged-in user ---
        $kpis['mySales'] = OrderItem::whereRelation('order', 'user_id', $user->id)
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->sum('total');

        $kpis['myCreditReceived'] = $user->creditSalePayments()
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->sum('amount');
        
        $kpis['myOutstandingDebt'] = CreditSale::where('user_id', $user->id)
            ->where('status', 'onprogresss')
            ->get()
            ->sum(fn($cs) => $cs->order->orderItems()->sum('total') - $cs->creditSalePayments()->sum('amount'));
            
        $kpis['myExpenses'] = $user->expenseItems()
            ->whereBetween('expense_items.created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->sum('cost');

        // --- Branch KPIs for admins/managers ---
        // These models are branch-scoped globally, so they already reflect the
        // active branch (or the whole company when "All branches" is selected).
        if ($isAdmin) {
            $kpis['branchSales'] = OrderItem::query()
                ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
                ->sum('total');

            $kpis['branchProfit'] = OrderItem::query()
                ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
                ->sum('profit');

            // ExpenseItem has no branch_id; scope it through its (branch-scoped) expense.
            $kpis['branchExpenses'] = ExpenseItem::whereHas('expense')
                ->whereBetween('expense_items.created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
                ->sum('cost');

            $kpis['totalDebt'] = CreditSale::where('status', 'onprogresss')
                ->get()
                ->sum(fn($cs) => $cs->order->orderItems()->sum('total') - $cs->creditSalePayments()->sum('amount'));

            $kpis['totalCapital'] = Product::query()
                ->selectRaw('SUM(stock * buy_price) as value')
                ->first()
                ->value ?? 0;

            // The logged-in admin's/manager's own profit.
            $kpis['myProfit'] = OrderItem::whereRelation('order', 'user_id', $user->id)
                ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
                ->sum('profit');

            $salesChartData = OrderItem::query()
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(total) as total_sales'),
                    DB::raw('SUM(profit) as total_profit')
                )
                ->where('created_at', '>=', $startDate->startOfDay())
                ->where('created_at', '<=', $endDate->endOfDay())
                ->groupBy('date')
                ->orderBy('date', 'ASC')
                ->get()
                ->map(fn ($row) => [
                    'date' => Carbon::parse($row->date)->format('M j'),
                    'sales' => (int)$row->total_sales,
                    'profit' => (int)$row->total_profit,
            ]);
        }

        return Inertia::render('Dashboard', [
            'kpis' => $kpis,
            'salesChartData' => $salesChartData,
            'filters' => $request->only(['start_date', 'end_date']),
        ]);
    }
}