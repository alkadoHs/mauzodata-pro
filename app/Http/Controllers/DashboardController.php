<?php

namespace App\Http\Controllers;

use App\Models\CreditSale;
use App\Models\ExpenseItem;
use App\Models\Product;
use App\Models\OrderItem;
use App\Models\User;
use App\Support\CurrentBranch;
use Illuminate\Database\Eloquent\Builder;
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
        $branch = app(CurrentBranch::class);

        // Admins and managers get the management view (branch KPIs, chart, date filter).
        // Branch scoping is automatic via the models' global scopes, so a specific
        // active branch shows that branch and "All" aggregates across the company.
        $isAdmin = $branch->canSwitch();

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        // Non-admins always see "Today". Admins/managers can use the filter.
        $startDate = ($isAdmin && $request->start_date)
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::today()->startOfDay();
        $endDate = ($isAdmin && $request->end_date)
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::today()->endOfDay();

        // The immediately-preceding window of the same length, for trend deltas.
        $days = max($startDate->diffInDays($endDate) + 1, 1);
        $prevEnd = (clone $startDate)->subSecond();
        $prevStart = (clone $startDate)->subDays($days)->startOfDay();

        $kpis = [
            'mySales' => $this->mySales($user, $startDate, $endDate),
            'myProfit' => 0,
            'myExpenses' => $this->myExpenses($user, $startDate, $endDate),
            'myCreditReceived' => (float) $user->creditSalePayments()
                ->whereBetween('created_at', [$startDate, $endDate])->sum('amount'),
            'myOutstandingDebt' => $this->outstandingDebt(
                fn (Builder $q) => $q->where('user_id', $user->id)
            ),
            'branchSales' => 0,
            'branchProfit' => 0,
            'branchExpenses' => 0,
            'totalDebt' => 0,
            'totalCapital' => 0,
        ];

        $trends = [];
        $salesChartData = [];
        $alerts = ['lowStock' => 0, 'outOfStock' => 0];

        if ($isAdmin) {
            $kpis['myProfit'] = (float) $this->myItems($user, $startDate, $endDate)->sum('profit');

            $kpis['branchSales'] = (float) $this->items($startDate, $endDate)->sum('total');
            $kpis['branchProfit'] = (float) $this->items($startDate, $endDate)->sum('profit');
            $kpis['branchExpenses'] = $this->expenses($startDate, $endDate);
            $kpis['totalDebt'] = $this->outstandingDebt();
            $kpis['totalCapital'] = (float) (Product::query()
                ->selectRaw('SUM(stock * buy_price) as value')->value('value') ?? 0);

            // Compare with the previous window of equal length.
            $trends = [
                'sales' => $this->delta(
                    $kpis['branchSales'],
                    (float) $this->items($prevStart, $prevEnd)->sum('total')
                ),
                'profit' => $this->delta(
                    $kpis['branchProfit'],
                    (float) $this->items($prevStart, $prevEnd)->sum('profit')
                ),
                'expenses' => $this->delta(
                    $kpis['branchExpenses'],
                    $this->expenses($prevStart, $prevEnd)
                ),
            ];

            // Actionable stock signals for the active branch.
            $alerts = [
                'lowStock' => Product::whereColumn('stock', '<', 'stock_alert')
                    ->where('stock', '>', 0)->count(),
                'outOfStock' => Product::where('stock', '<', 1)->count(),
            ];

            $salesChartData = $this->items($startDate, $endDate)
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(total) as total_sales'),
                    DB::raw('SUM(profit) as total_profit')
                )
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(fn ($row) => [
                    'date' => Carbon::parse($row->date)->format('M j'),
                    'sales' => (int) $row->total_sales,
                    'profit' => (int) $row->total_profit,
                ]);
        }

        return Inertia::render('Dashboard', [
            'kpis' => $kpis,
            'trends' => $trends,
            'alerts' => $alerts,
            'salesChartData' => $salesChartData,
            'filters' => $request->only(['start_date', 'end_date']),
            // So the page can say which branch these numbers describe.
            'branchLabel' => $branch->isAll() ? 'All branches' : ($branch->branch()?->name ?? '—'),
            'isManager' => $isAdmin,
        ]);
    }

    /** Order items in the active branch (OrderBranchScope) within a window. */
    private function items(Carbon $from, Carbon $to): Builder
    {
        return OrderItem::query()->whereBetween('created_at', [$from, $to]);
    }

    private function myItems(User $user, Carbon $from, Carbon $to): Builder
    {
        return $this->items($from, $to)->whereRelation('order', 'user_id', $user->id);
    }

    private function mySales(User $user, Carbon $from, Carbon $to): float
    {
        return (float) $this->myItems($user, $from, $to)->sum('total');
    }

    private function myExpenses(User $user, Carbon $from, Carbon $to): float
    {
        return (float) $user->expenseItems()
            ->whereBetween('expense_items.created_at', [$from, $to])->sum('cost');
    }

    /** ExpenseItem has no branch_id; scope it through its (branch-scoped) expense. */
    private function expenses(Carbon $from, Carbon $to): float
    {
        return (float) ExpenseItem::whereHas('expense')
            ->whereBetween('expense_items.created_at', [$from, $to])->sum('cost');
    }

    /**
     * Outstanding debt = billed minus paid across in-progress credit sales.
     *
     * Uses aggregate subqueries rather than looping the collection — the previous
     * version ran ~3 queries per credit sale.
     */
    private function outstandingDebt(?callable $constrain = null): float
    {
        $query = CreditSale::query()
            ->where('status', 'onprogresss')
            ->withSum('creditSalePayments as paid_total', 'amount')
            ->with(['order' => fn ($q) => $q->withSum('orderItems as billed_total', 'total')]);

        if ($constrain) {
            $constrain($query);
        }

        return (float) $query->get()->sum(
            fn ($cs) => (float) ($cs->order->billed_total ?? 0) - (float) ($cs->paid_total ?? 0)
        );
    }

    /** Percent change vs the previous window; null when there's no baseline. */
    private function delta(float $current, float $previous): ?array
    {
        if ($previous <= 0.0) {
            return null;
        }

        return [
            'percent' => round((($current - $previous) / $previous) * 100, 1),
            'previous' => $previous,
        ];
    }
}
