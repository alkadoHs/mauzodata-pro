<?php

namespace App\Http\Controllers\Logistics;

use App\Models\Logistics\Driver;
use App\Models\Logistics\Trip;
use App\Models\Logistics\TripClient;
use App\Models\Logistics\Truck;
use App\Support\Logistics\ProfitReport;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The front door of the haulage business.
 *
 * Answers three questions in the order they get asked: how are we doing this
 * month, what is out on the road right now, and who still owes us money.
 *
 * Until there is a trip on record it shows the way in instead — a dashboard
 * of zeroes on day one tells a new user nothing except that the system is
 * empty, which they already know.
 */
class HomeController extends LogisticsController
{
    /** How far back the trend goes. Six months fits a year's shape onto a card. */
    private const TREND_MONTHS = 6;

    public function index(): Response
    {
        $this->authorizeLogistics();

        $companyId = $this->companyId();

        if (! Trip::where('company_id', $companyId)->exists()) {
            return Inertia::render('Logistics/Home', [
                'started' => false,
                'fleet' => $this->fleet($companyId),
            ]);
        }

        $trend = $this->trend($companyId);
        // The last entry IS this month, so it is read off the trend rather
        // than computed a second time and risking a different answer.
        $thisMonth = $trend[count($trend) - 1];

        return Inertia::render('Logistics/Home', [
            'started' => true,
            'month' => $thisMonth,
            'trend' => $trend,
            'fleet' => $this->fleet($companyId),
            'onRoad' => $this->onRoad($companyId),
            'recent' => $this->recent($companyId),
            'owed' => $this->owedOverall($companyId),
        ]);
    }

    /**
     * Net profit month by month.
     *
     * Deliberately built from ProfitReport rather than its own queries: the
     * overview and the report must never be able to disagree about what a
     * month made, and the only way to guarantee that is one piece of
     * arithmetic. Six small reports on a dataset this size is cheap next to
     * the cost of two screens quoting different profits.
     */
    private function trend(int $companyId): array
    {
        $out = [];

        for ($i = self::TREND_MONTHS - 1; $i >= 0; $i--) {
            $month = Carbon::now()->startOfMonth()->subMonths($i);
            $totals = (new ProfitReport(
                $companyId,
                $month->copy()->startOfMonth(),
                $month->copy()->endOfMonth(),
            ))->build()['totals'];

            $out[] = [
                'key' => $month->format('Y-m'),
                'label' => $month->format('M'),
                'from' => $month->copy()->startOfMonth()->toDateString(),
                'to' => $month->copy()->endOfMonth()->toDateString(),
                'trips' => $totals['trips'],
                'freight' => $totals['freight'],
                'trip_expenses' => $totals['trip_expenses'],
                'trip_margin' => $totals['trip_margin'],
                'running_costs' => $totals['running_costs'],
                'net_profit' => $totals['net_profit'],
                'cash_in' => $totals['cash_in'],
            ];
        }

        return $out;
    }

    /** What is out there now — the operational view, not the financial one. */
    private function onRoad(int $companyId): array
    {
        return Trip::query()
            ->where('company_id', $companyId)
            ->where('status', Trip::IN_TRANSIT)
            ->with(['truck:id,plate_number', 'client:id,name', 'driver:id,name'])
            ->orderBy('dispatched_at')
            ->limit(8)
            ->get()
            ->map(fn (Trip $trip) => [
                'id' => $trip->id,
                'reference' => $trip->reference(),
                'origin' => $trip->origin,
                'destination' => $trip->destination,
                'truck' => $trip->truck?->plate_number,
                'driver' => $trip->driver?->name,
                'client' => $trip->client?->name,
                'dispatched_at' => $trip->dispatched_at?->toDateString(),
                // Whole days since it left, so "3 days out" is checkable
                // against a calendar rather than being a rounded guess.
                'days_out' => $trip->dispatched_at
                    ? $trip->dispatched_at->startOfDay()->diffInDays(Carbon::now()->startOfDay())
                    : null,
            ])
            ->all();
    }

    /** The last few journeys and what each one made. */
    private function recent(int $companyId): array
    {
        return Trip::query()
            ->where('company_id', $companyId)
            ->with(['truck:id,plate_number', 'client:id,name'])
            ->withSum('expenses as expenses_total', 'amount')
            ->orderByDesc('dispatched_at')
            ->orderByDesc('sequence')
            ->limit(6)
            ->get()
            ->map(function (Trip $trip) {
                $freight = $trip->status === Trip::CANCELLED ? 0.0 : (float) $trip->freight_amount;
                $expenses = (float) ($trip->expenses_total ?? 0);

                return [
                    'id' => $trip->id,
                    'reference' => $trip->reference(),
                    'origin' => $trip->origin,
                    'destination' => $trip->destination,
                    'client' => $trip->client?->name,
                    'truck' => $trip->truck?->plate_number,
                    'status' => $trip->status,
                    'dispatched_at' => $trip->dispatched_at?->toDateString(),
                    'margin' => round($freight - $expenses, 2),
                ];
            })
            ->all();
    }

    /**
     * Everything still unpaid, across every trip ever run — not just this
     * month's. Chasing money is not a calendar question.
     */
    private function owedOverall(int $companyId): array
    {
        $trips = Trip::query()
            ->where('company_id', $companyId)
            ->earning()
            ->withSum('payments as paid_total', 'amount')
            ->get(['id', 'freight_amount']);

        $owing = $trips
            ->map(fn (Trip $t) => max((float) $t->freight_amount - (float) ($t->paid_total ?? 0), 0))
            ->filter(fn (float $due) => $due > 0);

        return [
            'total' => round($owing->sum(), 2),
            'trips' => $owing->count(),
        ];
    }

    /** @return array<string,int> */
    private function fleet(int $companyId): array
    {
        $trucks = Truck::where('company_id', $companyId)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'trucks_active' => (int) ($trucks[Truck::ACTIVE] ?? 0),
            'trucks_in_repair' => (int) ($trucks[Truck::IN_REPAIR] ?? 0),
            'trucks_total' => (int) $trucks->sum(),
            'drivers' => Driver::where('company_id', $companyId)->active()->count(),
            'clients' => TripClient::where('company_id', $companyId)->count(),
        ];
    }
}
