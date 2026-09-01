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
use Illuminate\Support\Carbon;

/**
 * The overview.
 *
 * Its figures come from the same ProfitReport the report page uses, and the
 * test that matters most is the one proving the two agree — a dashboard
 * quoting a different profit from the report it links to would be worse than
 * having no dashboard.
 */
function overviewCo(): array
{
    $company = Company::create(['name' => 'O '.uniqid()]);
    $branch = Branch::create(['company_id' => $company->id, 'name' => 'b-'.uniqid()]);
    $admin = User::create([
        'company_id' => $company->id,
        'branch_id' => $branch->id,
        'name' => 'Admin',
        'email' => 'o-'.uniqid().'@example.com',
        'phone' => '070'.random_int(1000000, 9999999),
        'role' => 'admin',
        'isActive' => true,
        'password' => 'password',
    ]);
    $truck = Truck::create(['company_id' => $company->id, 'plate_number' => 'T 500 OVR']);
    $client = TripClient::create(['company_id' => $company->id, 'name' => 'Mama Neema']);
    $driver = Driver::create(['company_id' => $company->id, 'name' => 'Juma']);

    return compact('company', 'admin', 'truck', 'client', 'driver');
}

function overviewTrip(array $ctx, float $freight, string $date, array $extra = []): Trip
{
    return Trip::create([
        'company_id' => $ctx['company']->id,
        'truck_id' => $ctx['truck']->id,
        'trip_client_id' => $ctx['client']->id,
        'driver_id' => $ctx['driver']->id,
        'sequence' => Trip::nextSequence($ctx['company']->id),
        'origin' => 'Dar', 'destination' => 'Mbeya',
        'freight_amount' => $freight,
        'status' => $extra['status'] ?? Trip::IN_TRANSIT,
        'dispatched_at' => $date,
    ]);
}

function near(float $expected): Closure
{
    return fn ($value) => abs((float) $value - $expected) < 0.001;
}

// ---------------------------------------------------------------------------
// Before there is anything to show
// ---------------------------------------------------------------------------

it('shows the way in rather than a wall of zeroes', function () {
    $ctx = overviewCo();

    $this->actingAs($ctx['admin'])
        ->get('/logistics')
        ->assertInertia(fn ($page) => $page
            ->where('started', false)
            // A truck and a client exist already, so those steps read as done.
            ->where('fleet.trucks_total', 1)
            ->where('fleet.clients', 1)
            ->where('fleet.drivers', 1)
            ->missing('trend'));
});

it('switches to the dashboard once a trip exists', function () {
    $ctx = overviewCo();
    overviewTrip($ctx, 1000000, Carbon::now()->toDateString());

    $this->actingAs($ctx['admin'])
        ->get('/logistics')
        ->assertInertia(fn ($page) => $page
            ->where('started', true)
            ->has('trend', 6)
            ->has('month')
            ->has('onRoad')
            ->has('recent'));
});

// ---------------------------------------------------------------------------
// It must agree with the report it links to
// ---------------------------------------------------------------------------

it('quotes the same month figures as the profit report', function () {
    $ctx = overviewCo();
    $today = Carbon::now();

    $a = overviewTrip($ctx, 8000000, $today->toDateString());
    TripExpense::create(['trip_id' => $a->id, 'category' => 'fuel', 'amount' => 3000000, 'spent_at' => $today->toDateString()]);
    $b = overviewTrip($ctx, 4400000, $today->toDateString());
    TripExpense::create(['trip_id' => $b->id, 'category' => 'fuel', 'amount' => 1600000, 'spent_at' => $today->toDateString()]);
    RunningCost::create(['company_id' => $ctx['company']->id, 'category' => 'insurance', 'amount' => 1800000, 'spent_at' => $today->toDateString()]);

    // 12,400,000 − 4,600,000 = 7,800,000 margin; − 1,800,000 = 6,000,000 net.
    $overview = $this->actingAs($ctx['admin'])->get('/logistics');
    $report = $this->actingAs($ctx['admin'])->get('/logistics/profit?from_date='
        .$today->copy()->startOfMonth()->toDateString().'&to_date='
        .$today->copy()->endOfMonth()->toDateString());

    $o = $overview->viewData('page')['props']['month'];
    $r = $report->viewData('page')['props']['totals'];

    expect((float) $o['net_profit'])->toBe((float) $r['net_profit'])
        ->and((float) $o['freight'])->toBe((float) $r['freight'])
        ->and((float) $o['trip_expenses'])->toBe((float) $r['trip_expenses'])
        ->and((float) $o['running_costs'])->toBe((float) $r['running_costs'])
        ->and((float) $o['net_profit'])->toBe(6000000.0);
});

it('ends the trend on the current month', function () {
    $ctx = overviewCo();
    overviewTrip($ctx, 1000000, Carbon::now()->toDateString());

    $this->actingAs($ctx['admin'])
        ->get('/logistics')
        ->assertInertia(fn ($page) => $page
            ->where('trend.5.key', Carbon::now()->format('Y-m'))
            ->where('trend.0.key', Carbon::now()->copy()->subMonths(5)->format('Y-m')));
});

it('keeps an older month in its own column', function () {
    $ctx = overviewCo();
    $lastMonth = Carbon::now()->subMonthNoOverflow()->startOfMonth()->addDays(3);

    overviewTrip($ctx, 2000000, $lastMonth->toDateString());
    overviewTrip($ctx, 500000, Carbon::now()->toDateString());

    $this->actingAs($ctx['admin'])
        ->get('/logistics')
        ->assertInertia(fn ($page) => $page
            ->where('trend.4.freight', near(2000000))
            ->where('trend.5.freight', near(500000))
            ->where('month.freight', near(500000)));
});

// ---------------------------------------------------------------------------
// Operational panels
// ---------------------------------------------------------------------------

it('lists what is on the road with whole days out', function () {
    $ctx = overviewCo();
    $out = overviewTrip($ctx, 1000000, Carbon::now()->copy()->subDays(3)->toDateString());
    $delivered = overviewTrip($ctx, 1000000, Carbon::now()->toDateString(), ['status' => Trip::DELIVERED]);

    $this->actingAs($ctx['admin'])
        ->get('/logistics')
        ->assertInertia(fn ($page) => $page
            ->has('onRoad', 1)
            ->where('onRoad.0.id', $out->id)
            ->where('onRoad.0.days_out', 3));
});

it('counts everything still unpaid, not just this month', function () {
    $ctx = overviewCo();

    // An old debt and a new one; both should be chased.
    $old = overviewTrip($ctx, 3000000, Carbon::now()->copy()->subMonths(4)->toDateString());
    $old->payments()->create(['amount' => 1000000, 'paid_at' => Carbon::now()->toDateString()]);
    overviewTrip($ctx, 500000, Carbon::now()->toDateString());

    // A cancelled trip is owed nothing.
    overviewTrip($ctx, 9000000, Carbon::now()->toDateString(), ['status' => Trip::CANCELLED]);

    $this->actingAs($ctx['admin'])
        ->get('/logistics')
        ->assertInertia(fn ($page) => $page
            ->where('owed.total', near(2500000))
            ->where('owed.trips', 2));
});

it('shows a cancelled recent trip as its loss', function () {
    $ctx = overviewCo();
    $t = overviewTrip($ctx, 3000000, Carbon::now()->toDateString(), ['status' => Trip::CANCELLED]);
    TripExpense::create(['trip_id' => $t->id, 'category' => 'fuel', 'amount' => 200000, 'spent_at' => Carbon::now()->toDateString()]);

    $this->actingAs($ctx['admin'])
        ->get('/logistics')
        ->assertInertia(fn ($page) => $page
            ->where('recent.0.status', 'cancelled')
            ->where('recent.0.margin', near(-200000)));
});

// ---------------------------------------------------------------------------
// Boundaries
// ---------------------------------------------------------------------------

it('never shows another company work on the overview', function () {
    $mine = overviewCo();
    $theirs = overviewCo();

    overviewTrip($mine, 1000000, Carbon::now()->toDateString());
    overviewTrip($theirs, 9000000, Carbon::now()->toDateString());

    $this->actingAs($mine['admin'])
        ->get('/logistics')
        ->assertInertia(fn ($page) => $page
            ->where('month.freight', near(1000000))
            ->has('onRoad', 1)
            ->has('recent', 1)
            ->where('fleet.trucks_total', 1));
});

it('keeps the overview admin-only', function (string $role) {
    $ctx = overviewCo();
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

    $this->actingAs($other)->get('/logistics')->assertForbidden();
})->with(['manager', 'seller']);
