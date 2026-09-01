<?php

use App\Models\Branch;
use App\Models\Company;
use App\Models\Logistics\Driver;
use App\Models\Logistics\RunningCost;
use App\Models\Logistics\Trip;
use App\Models\Logistics\TripClient;
use App\Models\Logistics\TripExpense;
use App\Models\Logistics\Truck;
use App\Models\User;

/**
 * The profit report.
 *
 * This is the number the client will run his business on, so every figure
 * here is checked against one worked out by hand. The two-level statement is
 * the point: trip margin flatters the business by every shilling of
 * insurance, licence and salary, and net profit is what is actually left.
 */
function profitCo(): array
{
    $company = Company::create(['name' => 'P '.uniqid()]);
    $branch = Branch::create(['company_id' => $company->id, 'name' => 'b-'.uniqid()]);
    $admin = User::create([
        'company_id' => $company->id,
        'branch_id' => $branch->id,
        'name' => 'Admin',
        'email' => 'p-'.uniqid().'@example.com',
        'phone' => '070'.random_int(1000000, 9999999),
        'role' => 'admin',
        'isActive' => true,
        'password' => 'password',
    ]);
    $truck = Truck::create(['company_id' => $company->id, 'plate_number' => 'T 100 AAA']);
    $other = Truck::create(['company_id' => $company->id, 'plate_number' => 'T 200 BBB']);
    $client = TripClient::create(['company_id' => $company->id, 'name' => 'Mama Neema']);
    $driver = Driver::create(['company_id' => $company->id, 'name' => 'Juma']);

    return compact('company', 'admin', 'truck', 'other', 'client', 'driver');
}

function trip(array $ctx, float $freight, string $date, array $extra = []): Trip
{
    return Trip::create([
        'company_id' => $ctx['company']->id,
        'truck_id' => $extra['truck_id'] ?? $ctx['truck']->id,
        'trip_client_id' => $ctx['client']->id,
        'driver_id' => $ctx['driver']->id,
        'sequence' => Trip::nextSequence($ctx['company']->id),
        'origin' => 'Dar', 'destination' => 'Mbeya',
        'freight_amount' => $freight,
        'status' => $extra['status'] ?? Trip::IN_TRANSIT,
        'dispatched_at' => $date,
    ]);
}

function spend(Trip $trip, string $category, float $amount, ?string $date = null): void
{
    TripExpense::create([
        'trip_id' => $trip->id, 'category' => $category, 'amount' => $amount,
        'spent_at' => $date ?? $trip->dispatched_at->toDateString(),
    ]);
}

function amount(float $expected): Closure
{
    return fn ($value) => abs((float) $value - $expected) < 0.001;
}

// ---------------------------------------------------------------------------
// The statement
// ---------------------------------------------------------------------------

it('takes running costs off the trip margin to reach net profit', function () {
    $ctx = profitCo();

    // Two trips: 8,000,000 + 4,400,000 freight, 6,050,000 of costs between them.
    $a = trip($ctx, 8000000, '2026-08-05');
    spend($a, 'fuel', 3000000);
    spend($a, 'allowance', 500000);
    spend($a, 'loading', 550000);

    $b = trip($ctx, 4400000, '2026-08-20');
    spend($b, 'fuel', 1600000);
    spend($b, 'unloading', 400000);

    // 1,800,000 of running costs in the same month.
    RunningCost::create(['company_id' => $ctx['company']->id, 'category' => 'insurance', 'amount' => 1200000, 'spent_at' => '2026-08-01']);
    RunningCost::create(['company_id' => $ctx['company']->id, 'category' => 'salary', 'amount' => 600000, 'spent_at' => '2026-08-28']);

    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(fn ($page) => $page
            ->where('totals.freight', amount(12400000))
            ->where('totals.trip_expenses', amount(6050000))
            ->where('totals.trip_margin', amount(6350000))
            ->where('totals.running_costs', amount(1800000))
            // 6,350,000 − 1,800,000
            ->where('totals.net_profit', amount(4550000)));
});

it('can be profitable on trips and lossmaking overall', function () {
    $ctx = profitCo();

    $t = trip($ctx, 1000000, '2026-08-05');
    spend($t, 'fuel', 400000);
    // Margin is +600,000; a 900,000 insurance bill turns the month negative.
    RunningCost::create(['company_id' => $ctx['company']->id, 'category' => 'insurance', 'amount' => 900000, 'spent_at' => '2026-08-10']);

    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(fn ($page) => $page
            ->where('totals.trip_margin', amount(600000))
            ->where('totals.net_profit', amount(-300000)));
});

it('counts a trip costs in the trip period even when the receipt is later', function () {
    $ctx = profitCo();

    // Dispatched on the 31st; the fuel receipt is written on the 1st.
    $t = trip($ctx, 1000000, '2026-08-31');
    spend($t, 'fuel', 400000, '2026-09-01');

    // August keeps both, so its margin is real.
    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(fn ($page) => $page
            ->where('totals.freight', amount(1000000))
            ->where('totals.trip_expenses', amount(400000))
            ->where('totals.trip_margin', amount(600000)));

    // And September does not inherit an orphan cost.
    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-09-01&to_date=2026-09-30')
        ->assertInertia(fn ($page) => $page
            ->where('totals.trip_expenses', amount(0))
            ->where('totals.net_profit', amount(0)));
});

it('leaves trips outside the period alone', function () {
    $ctx = profitCo();
    trip($ctx, 5000000, '2026-07-15');
    $august = trip($ctx, 1000000, '2026-08-15');
    spend($august, 'fuel', 200000);

    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(fn ($page) => $page
            ->where('totals.trips', 1)
            ->where('totals.freight', amount(1000000)));
});

it('earns nothing on a cancelled trip but keeps what it cost', function () {
    $ctx = profitCo();
    $t = trip($ctx, 3000000, '2026-08-05', ['status' => Trip::CANCELLED]);
    spend($t, 'fuel', 250000);

    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(fn ($page) => $page
            ->where('totals.freight', amount(0))
            ->where('totals.trip_expenses', amount(250000))
            ->where('totals.net_profit', amount(-250000))
            ->where('totals.cancelled', 1));
});

// ---------------------------------------------------------------------------
// Earned versus received
// ---------------------------------------------------------------------------

it('reports cash received apart from what was earned', function () {
    $ctx = profitCo();
    $t = trip($ctx, 2000000, '2026-08-05');
    $t->payments()->create(['amount' => 800000, 'paid_at' => '2026-08-06']);
    // The balance arrives the following month.
    $t->payments()->create(['amount' => 1200000, 'paid_at' => '2026-09-03']);

    // August earned the lot; only 800,000 of it arrived inside August.
    //
    // Outstanding is deliberately as-of-today rather than as-at-31-August:
    // the question it answers is "who do I still need to chase", and this
    // debt has since been settled. It reads 0 for that reason, and matches
    // what the trips list and the per-client column say — two screens
    // disagreeing about who owes money would be worse than either answer.
    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(fn ($page) => $page
            ->where('totals.freight', amount(2000000))
            ->where('totals.cash_in', amount(800000))
            ->where('totals.outstanding', amount(0)));

    // September: no trips run, but the balance still turned up.
    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-09-01&to_date=2026-09-30')
        ->assertInertia(fn ($page) => $page
            ->where('totals.freight', amount(0))
            ->where('totals.cash_in', amount(1200000)));
});

it('counts work still unpaid today as outstanding', function () {
    $ctx = profitCo();
    $t = trip($ctx, 2000000, '2026-08-05');
    $t->payments()->create(['amount' => 750000, 'paid_at' => '2026-08-06']);

    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(fn ($page) => $page
            ->where('totals.cash_in', amount(750000))
            ->where('totals.outstanding', amount(1250000)));
});

it('does not let an overpayment on one trip hide a debt on another', function () {
    $ctx = profitCo();

    $paid = trip($ctx, 1000000, '2026-08-05');
    $paid->payments()->create(['amount' => 1200000, 'paid_at' => '2026-08-06']);

    $unpaid = trip($ctx, 1000000, '2026-08-07');

    // Netting would report 800,000; the real debt is the whole 1,000,000.
    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(fn ($page) => $page->where('totals.outstanding', amount(1000000)));
});

// ---------------------------------------------------------------------------
// Breakdowns
// ---------------------------------------------------------------------------

it('breaks both kinds of cost down by category, biggest first', function () {
    $ctx = profitCo();
    $t = trip($ctx, 5000000, '2026-08-05');
    spend($t, 'fuel', 900000);
    spend($t, 'fuel', 100000);
    spend($t, 'allowance', 300000);

    RunningCost::create(['company_id' => $ctx['company']->id, 'category' => 'salary', 'amount' => 700000, 'spent_at' => '2026-08-02']);
    RunningCost::create(['company_id' => $ctx['company']->id, 'category' => 'parking', 'amount' => 50000, 'spent_at' => '2026-08-03']);

    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(fn ($page) => $page
            ->where('tripExpenseCategories.0.category', 'fuel')
            ->where('tripExpenseCategories.0.total', amount(1000000))
            ->where('tripExpenseCategories.1.category', 'allowance')
            ->where('runningCostCategories.0.category', 'salary')
            ->where('runningCostCategories.0.total', amount(700000)));
});

it('charges a lorry its own running costs and no one else', function () {
    $ctx = profitCo();

    $a = trip($ctx, 3000000, '2026-08-05');
    spend($a, 'fuel', 1000000);
    $b = trip($ctx, 2000000, '2026-08-06', ['truck_id' => $ctx['other']->id]);
    spend($b, 'fuel', 500000);

    // One lorry's service, and a salary belonging to nobody in particular.
    RunningCost::create([
        'company_id' => $ctx['company']->id, 'truck_id' => $ctx['truck']->id,
        'category' => 'servicing', 'amount' => 400000, 'spent_at' => '2026-08-10',
    ]);
    RunningCost::create([
        'company_id' => $ctx['company']->id, 'category' => 'salary',
        'amount' => 600000, 'spent_at' => '2026-08-11',
    ]);

    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(function ($page) {
            // Sorted by net: T 200 BBB nets 1,500,000, T 100 AAA nets 1,600,000.
            $page->where('byTruck.0.truck', 'T 100 AAA')
                ->where('byTruck.0.margin', amount(2000000))
                ->where('byTruck.0.running_costs', amount(400000))
                ->where('byTruck.0.net', amount(1600000))
                ->where('byTruck.1.truck', 'T 200 BBB')
                ->where('byTruck.1.running_costs', amount(0))
                ->where('byTruck.1.net', amount(1500000))
                // The salary is in net profit but not spread across the fleet.
                ->where('unattributedRunning', amount(600000));
        });
});

it('still shows a lorry that only cost money this period', function () {
    $ctx = profitCo();
    // No trips at all — just a service while it was off the road.
    RunningCost::create([
        'company_id' => $ctx['company']->id, 'truck_id' => $ctx['truck']->id,
        'category' => 'garage', 'amount' => 750000, 'spent_at' => '2026-08-10',
    ]);

    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(fn ($page) => $page
            ->has('byTruck', 1)
            ->where('byTruck.0.truck', 'T 100 AAA')
            ->where('byTruck.0.trips', 0)
            ->where('byTruck.0.net', amount(-750000))
            ->where('totals.net_profit', amount(-750000)));
});

it('shows what each client brought in and still owes', function () {
    $ctx = profitCo();
    $t = trip($ctx, 4000000, '2026-08-05');
    $t->payments()->create(['amount' => 1500000, 'paid_at' => '2026-08-06']);

    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(fn ($page) => $page
            ->where('byClient.0.client', 'Mama Neema')
            ->where('byClient.0.freight', amount(4000000))
            ->where('byClient.0.paid', amount(1500000))
            ->where('byClient.0.owed', amount(2500000)));
});

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

it('reads a backwards date range the way it was meant', function () {
    $ctx = profitCo();
    trip($ctx, 1000000, '2026-08-15');

    // Swapped rather than silently reporting a business that did nothing.
    $this->actingAs($ctx['admin'])
        ->get('/logistics/profit?from_date=2026-08-31&to_date=2026-08-01')
        ->assertInertia(fn ($page) => $page
            ->where('filters.from_date', '2026-08-01')
            ->where('filters.to_date', '2026-08-31')
            ->where('totals.freight', amount(1000000)));
});

it('never mixes one company figures into another', function () {
    $mine = profitCo();
    $theirs = profitCo();

    trip($mine, 1000000, '2026-08-05');
    $t = trip($theirs, 9000000, '2026-08-05');
    spend($t, 'fuel', 3000000);
    RunningCost::create(['company_id' => $theirs['company']->id, 'category' => 'salary', 'amount' => 500000, 'spent_at' => '2026-08-05']);

    $this->actingAs($mine['admin'])
        ->get('/logistics/profit?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(fn ($page) => $page
            ->where('totals.freight', amount(1000000))
            ->where('totals.trip_expenses', amount(0))
            ->where('totals.running_costs', amount(0)));
});

it('keeps the report and running costs admin-only', function (string $role) {
    $ctx = profitCo();
    $other = User::create([
        'company_id' => $ctx['company']->id,
        'branch_id' => $ctx['admin']->branch_id,
        'name' => ucfirst($role),
        'email' => $role.'-'.uniqid().'@example.com',
        'phone' => '070'.random_int(1000000, 9999999),
        'role' => $role,
        'isActive' => true,
        'password' => 'password',
    ]);

    $this->actingAs($other)->get('/logistics/profit')->assertForbidden();
    $this->actingAs($other)->get('/logistics/running-costs')->assertForbidden();
    $this->actingAs($other)->post('/logistics/running-costs', [
        'category' => 'salary', 'amount' => 1, 'spent_at' => '2026-08-01',
    ])->assertForbidden();
})->with(['manager', 'seller']);

it('refuses a running cost pinned to another company truck', function () {
    $mine = profitCo();
    $theirs = profitCo();

    $this->actingAs($mine['admin'])->post('/logistics/running-costs', [
        'category' => 'servicing', 'amount' => 100000,
        'spent_at' => '2026-08-01', 'truck_id' => $theirs['truck']->id,
    ])->assertSessionHasErrors('truck_id');

    expect(RunningCost::where('company_id', $mine['company']->id)->count())->toBe(0);
});
