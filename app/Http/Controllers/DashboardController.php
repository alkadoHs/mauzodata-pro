<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $today = Carbon::today();

        // KPIs for the currently logged-in user
        $myTodaysSales = OrderItem::whereRelation('order', 'user_id', $user->id)
            ->whereDate('created_at', $today)
            ->sum('total');

        $myTodaysProfit = OrderItem::whereRelation('order', 'user_id', $user->id)
            ->whereDate('created_at', $today)
            ->sum('profit');

        $myTodaysExpenses = $user->expenseItems()
            ->whereDate('expense_items.created_at', $today)
            ->sum('cost');

        // KPIs for the entire branch (Admin View)
        $branchTodaysSales = 0;
        $totalCapital = 0;
        $salesChartData = [];

        if ($user->role === 'admin') {
            $branchTodaysSales = OrderItem::whereRelation('order.branch', 'id', $user->branch_id)
                ->whereDate('created_at', $today)
                ->sum('total');
            
            $totalCapital = Product::where('branch_id', $user->branch_id)
                ->selectRaw('SUM(stock * buy_price) as value')
                ->first()
                ->value ?? 0;

            // Data for the last 7 days sales chart
            $salesChartData = OrderItem::whereRelation('order.branch', 'id', $user->branch_id)
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(total) as total_sales')
                )
                ->where('created_at', '>=', Carbon::now()->subDays(6))
                ->groupBy('date')
                ->orderBy('date', 'ASC')
                ->get()
                ->map(fn ($row) => [
                    'date' => Carbon::parse($row->date)->format('D, M j'),
                    'sales' => (int)$row->total_sales,
                ]);
        }

        return Inertia::render('Dashboard', [
            'kpis' => [
                'myTodaysSales' => $myTodaysSales,
                'myTodaysProfit' => $myTodaysProfit,
                'myTodaysExpenses' => $myTodaysExpenses,
                'branchTodaysSales' => $branchTodaysSales,
                'totalCapital' => $totalCapital,
            ],
            'salesChartData' => $salesChartData,
        ]);
    }
}