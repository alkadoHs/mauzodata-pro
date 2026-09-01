<?php

namespace App\Support\Logistics;

use App\Models\Logistics\RunningCost;
use App\Models\Logistics\Trip;
use App\Models\Logistics\TripExpense;
use App\Models\Logistics\TripPayment;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * What the haulage business actually made over a period.
 *
 * Two levels, kept apart on purpose:
 *
 *   freight earned − trip expenses            = trip margin
 *   trip margin    − running costs            = NET PROFIT
 *
 * Trip margin on its own flatters the business by every shilling of
 * insurance, licence, servicing and salary, which is exactly the number
 * someone would otherwise call "profit" and make decisions on.
 *
 * A trip's expenses count in the period the TRIP falls in, not the period
 * each receipt happens to be dated. A journey dispatched on the 31st whose
 * fuel receipt is written on the 1st still cost what it cost: splitting the
 * two would leave one month's margin too high and the next month's too low,
 * and neither would be real. Running costs, belonging to no journey, are
 * dated by when they were spent.
 *
 * Money earned and money received are different questions and get different
 * lines: the profit figures are what the business earned, and cash received
 * and still-owed sit beside them, because a haulier can be profitable and
 * still short of money.
 */
class ProfitReport
{
    public function __construct(
        private readonly int $companyId,
        private readonly CarbonInterface $from,
        private readonly CarbonInterface $to,
    ) {}

    /** @return array<string,mixed> */
    public function build(): array
    {
        $trips = $this->trips();
        $runningCosts = $this->runningCosts();

        // A cancelled journey earns nothing, but whatever was already spent on
        // it was still spent — so it leaves the income and keeps the costs.
        $earning = $trips->where('status', '!=', Trip::CANCELLED);

        $freight = $this->round($earning->sum(fn (Trip $t) => (float) $t->freight_amount));
        $tripExpenses = $this->round($trips->sum(fn (Trip $t) => (float) ($t->expenses_total ?? 0)));
        $tripMargin = $this->round($freight - $tripExpenses);
        $running = $this->round($runningCosts->sum(fn (RunningCost $c) => (float) $c->amount));

        return [
            'totals' => [
                'trips' => $trips->count(),
                'cancelled' => $trips->where('status', Trip::CANCELLED)->count(),
                'freight' => $freight,
                'trip_expenses' => $tripExpenses,
                'trip_margin' => $tripMargin,
                'running_costs' => $running,
                'net_profit' => $this->round($tripMargin - $running),
                // Cash, not earnings — a different question, kept apart.
                'cash_in' => $this->cashReceived(),
                'outstanding' => $this->outstanding($earning),
            ],
            'tripExpenseCategories' => $this->tripExpensesByCategory(),
            'runningCostCategories' => $this->groupCosts($runningCosts),
            'byTruck' => $this->byTruck($trips, $runningCosts),
            'byClient' => $this->byClient($earning),
            'unattributedRunning' => $this->round(
                $runningCosts->whereNull('truck_id')->sum(fn (RunningCost $c) => (float) $c->amount)
            ),
        ];
    }

    /** @return Collection<int,Trip> */
    private function trips(): Collection
    {
        return Trip::query()
            ->where('company_id', $this->companyId)
            ->whereBetween('dispatched_at', [$this->from->toDateString(), $this->to->toDateString()])
            ->with(['truck:id,plate_number,name', 'client:id,name'])
            ->withSum('expenses as expenses_total', 'amount')
            ->withSum('payments as paid_total', 'amount')
            ->get();
    }

    /** @return Collection<int,RunningCost> */
    private function runningCosts(): Collection
    {
        return RunningCost::query()
            ->where('company_id', $this->companyId)
            ->whereBetween('spent_at', [$this->from->toDateString(), $this->to->toDateString()])
            ->get();
    }

    /** Money that actually came in during the period, whenever it was earned. */
    private function cashReceived(): float
    {
        return $this->round((float) TripPayment::query()
            ->join('trips', 'trips.id', '=', 'trip_payments.trip_id')
            ->where('trips.company_id', $this->companyId)
            ->whereBetween('trip_payments.paid_at', [$this->from->toDateString(), $this->to->toDateString()])
            ->sum('trip_payments.amount'));
    }

    /**
     * Earned in this period and not yet received.
     *
     * Floored per trip: an overpayment on one journey is not change owed back
     * on another, and letting it net off would hide a real debt.
     *
     * @param  Collection<int,Trip>  $earning
     */
    private function outstanding(Collection $earning): float
    {
        return $this->round($earning->sum(function (Trip $trip) {
            $due = (float) $trip->freight_amount - (float) ($trip->paid_total ?? 0);

            return max($due, 0);
        }));
    }

    /** @return array<int,array<string,mixed>> */
    private function tripExpensesByCategory(): array
    {
        $rows = TripExpense::query()
            ->join('trips', 'trips.id', '=', 'trip_expenses.trip_id')
            ->where('trips.company_id', $this->companyId)
            ->whereBetween('trips.dispatched_at', [$this->from->toDateString(), $this->to->toDateString()])
            ->groupBy('trip_expenses.category')
            ->selectRaw('trip_expenses.category as category, SUM(trip_expenses.amount) as total')
            ->pluck('total', 'category');

        return $rows
            ->map(fn ($total, $category) => [
                'category' => $category,
                'label' => TripExpense::CATEGORIES[$category] ?? $category,
                'total' => $this->round((float) $total),
            ])
            ->sortByDesc('total')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int,RunningCost>  $costs
     * @return array<int,array<string,mixed>>
     */
    private function groupCosts(Collection $costs): array
    {
        return $costs
            ->groupBy('category')
            ->map(fn (Collection $rows, string $category) => [
                'category' => $category,
                'label' => RunningCost::CATEGORIES[$category] ?? $category,
                'total' => $this->round($rows->sum(fn (RunningCost $c) => (float) $c->amount)),
            ])
            ->sortByDesc('total')
            ->values()
            ->all();
    }

    /**
     * Which lorry actually makes money.
     *
     * Its own running costs — its insurance, its service — come off its
     * margin. Costs belonging to the business rather than a lorry are
     * reported separately instead of being spread across the fleet by a
     * formula nobody asked for.
     *
     * @param  Collection<int,Trip>  $trips
     * @param  Collection<int,RunningCost>  $costs
     * @return array<int,array<string,mixed>>
     */
    private function byTruck(Collection $trips, Collection $costs): array
    {
        $runningByTruck = $costs
            ->whereNotNull('truck_id')
            ->groupBy('truck_id')
            ->map(fn (Collection $rows) => $rows->sum(fn (RunningCost $c) => (float) $c->amount));

        $rows = $trips
            ->groupBy('truck_id')
            ->map(function (Collection $group, $truckId) use ($runningByTruck) {
                $truck = $group->first()->truck;
                $freight = $group
                    ->where('status', '!=', Trip::CANCELLED)
                    ->sum(fn (Trip $t) => (float) $t->freight_amount);
                $expenses = $group->sum(fn (Trip $t) => (float) ($t->expenses_total ?? 0));
                $running = (float) ($runningByTruck[$truckId] ?? 0);

                return [
                    'truck_id' => (int) $truckId,
                    'truck' => $truck?->plate_number ?? 'Unknown',
                    'name' => $truck?->name,
                    'trips' => $group->count(),
                    'freight' => $this->round($freight),
                    'trip_expenses' => $this->round($expenses),
                    'margin' => $this->round($freight - $expenses),
                    'running_costs' => $this->round($running),
                    'net' => $this->round($freight - $expenses - $running),
                ];
            })
            ->values();

        // A lorry can carry running costs in a period it ran no trips — a
        // service while it was off the road. Dropping it would quietly lose
        // that money from the per-truck picture.
        $seen = $rows->pluck('truck_id')->all();
        foreach ($runningByTruck as $truckId => $amount) {
            if (in_array((int) $truckId, $seen, true)) {
                continue;
            }

            $truck = \App\Models\Logistics\Truck::find($truckId);
            $rows->push([
                'truck_id' => (int) $truckId,
                'truck' => $truck?->plate_number ?? 'Unknown',
                'name' => $truck?->name,
                'trips' => 0,
                'freight' => 0.0,
                'trip_expenses' => 0.0,
                'margin' => 0.0,
                'running_costs' => $this->round((float) $amount),
                'net' => $this->round(-(float) $amount),
            ]);
        }

        return $rows->sortByDesc('net')->values()->all();
    }

    /**
     * @param  Collection<int,Trip>  $earning
     * @return array<int,array<string,mixed>>
     */
    private function byClient(Collection $earning): array
    {
        return $earning
            ->groupBy('trip_client_id')
            ->map(function (Collection $group) {
                $freight = $group->sum(fn (Trip $t) => (float) $t->freight_amount);
                $paid = $group->sum(fn (Trip $t) => (float) ($t->paid_total ?? 0));

                return [
                    'client' => $group->first()->client?->name ?? 'Unknown',
                    'trips' => $group->count(),
                    'freight' => $this->round($freight),
                    'paid' => $this->round($paid),
                    'owed' => $this->round($group->sum(
                        fn (Trip $t) => max((float) $t->freight_amount - (float) ($t->paid_total ?? 0), 0)
                    )),
                ];
            })
            ->sortByDesc('freight')
            ->values()
            ->all();
    }

    private function round(float $value): float
    {
        return round($value, 2);
    }
}
