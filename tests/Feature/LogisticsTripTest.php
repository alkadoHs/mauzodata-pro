<?php

use App\Models\Branch;
use App\Models\Company;
use App\Models\Logistics\Driver;
use App\Models\Logistics\Trip;
use App\Models\Logistics\TripClient;
use App\Models\Logistics\TripExpense;
use App\Models\Logistics\Truck;
use App\Models\User;

/**
 * Trips: the arithmetic the client will actually make decisions on.
 *
 * A wrong margin here is worse than a crash — a crash gets reported, a
 * quietly wrong number gets believed. So most of this file checks sums
 * against figures worked out by hand.
 */
function haulier(): array
{
    $company = Company::create(['name' => 'H '.uniqid()]);
    $branch = Branch::create(['company_id' => $company->id, 'name' => 'b-'.uniqid()]);
    $admin = User::create([
        'company_id' => $company->id,
        'branch_id' => $branch->id,
        'name' => 'Admin',
        'email' => 'a-'.uniqid().'@example.com',
        'phone' => '070'.random_int(1000000, 9999999),
        'role' => 'admin',
        'isActive' => true,
        'password' => 'password',
    ]);
    $truck = Truck::create([
        'company_id' => $company->id, 'plate_number' => 'T '.random_int(100, 999).' ABC',
    ]);
    $client = TripClient::create(['company_id' => $company->id, 'name' => 'Mama Neema']);
    $driver = Driver::create(['company_id' => $company->id, 'name' => 'Juma']);

    return compact('company', 'admin', 'truck', 'client', 'driver');
}

function recordTrip(array $ctx, array $overrides = []): Trip
{
    return Trip::create([
        'company_id' => $ctx['company']->id,
        'truck_id' => $ctx['truck']->id,
        'trip_client_id' => $ctx['client']->id,
        'driver_id' => $ctx['driver']->id,
        'sequence' => Trip::nextSequence($ctx['company']->id),
        'origin' => 'Dar es Salaam',
        'destination' => 'Mbeya',
        'cargo' => 'mahindi',
        'freight_amount' => 2500000,
        'status' => Trip::IN_TRANSIT,
        'dispatched_at' => '2026-08-01',
        ...$overrides,
    ]);
}

/**
 * JSON has a single number type, so a whole-shilling float comes back over
 * the wire as an int. Money is compared by value, not by identity, rather
 * than pinning the tests to that quirk.
 */
function money(float $expected): Closure
{
    return fn ($value) => abs((float) $value - $expected) < 0.001;
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

it('records a trip and lands on its own page', function () {
    $ctx = haulier();

    $this->actingAs($ctx['admin'])->post('/logistics/trips', [
        'truck_id' => $ctx['truck']->id,
        'trip_client_id' => $ctx['client']->id,
        'driver_id' => $ctx['driver']->id,
        'origin' => 'Dar es Salaam',
        'destination' => 'Mbeya',
        'cargo' => 'mahindi',
        'weight_tons' => '30',
        'freight_amount' => '2,500,000',
        'dispatched_at' => '2026-08-01',
    ])->assertRedirect();

    $trip = Trip::firstWhere('company_id', $ctx['company']->id);

    expect((float) $trip->freight_amount)->toBe(2500000.0)
        ->and($trip->status)->toBe(Trip::IN_TRANSIT)
        ->and($trip->sequence)->toBe(1)
        ->and($trip->reference())->toBe('TRP-0001')
        ->and($trip->user_id)->toBe($ctx['admin']->id);
});

it('numbers trips per company, not globally', function () {
    $a = haulier();
    $b = haulier();

    recordTrip($a);
    recordTrip($b);
    $secondForA = recordTrip($a);

    expect($secondForA->reference())->toBe('TRP-0002')
        ->and(Trip::where('company_id', $b['company']->id)->first()->reference())
        ->toBe('TRP-0001');
});

it('refuses a truck or client belonging to another company', function () {
    $mine = haulier();
    $theirs = haulier();

    $this->actingAs($mine['admin'])->post('/logistics/trips', [
        'truck_id' => $theirs['truck']->id,
        'trip_client_id' => $theirs['client']->id,
        'driver_id' => $theirs['driver']->id,
        'origin' => 'A', 'destination' => 'B',
        'freight_amount' => '1000', 'dispatched_at' => '2026-08-01',
    ])->assertSessionHasErrors(['truck_id', 'trip_client_id', 'driver_id']);

    expect(Trip::where('company_id', $mine['company']->id)->count())->toBe(0);
});

// ---------------------------------------------------------------------------
// The arithmetic
// ---------------------------------------------------------------------------

it('works out a trip margin and balance from its own lines', function () {
    $ctx = haulier();
    $trip = recordTrip($ctx, ['freight_amount' => 2500000]);

    // 800,000 + 100,000 + 80,000 + 150,000 + 60,000 = 1,190,000
    foreach ([
        ['fuel', 800000], ['loading', 100000], ['unloading', 80000],
        ['allowance', 150000], ['tolls', 60000],
    ] as [$category, $amount]) {
        $this->actingAs($ctx['admin'])->post("/logistics/trips/{$trip->id}/expenses", [
            'category' => $category, 'amount' => $amount, 'spent_at' => '2026-08-01',
        ])->assertSessionHasNoErrors();
    }

    // An advance, then part of the balance.
    foreach ([1000000, 500000] as $amount) {
        $this->actingAs($ctx['admin'])->post("/logistics/trips/{$trip->id}/payments", [
            'amount' => $amount, 'paid_at' => '2026-08-02',
        ])->assertSessionHasNoErrors();
    }

    $this->actingAs($ctx['admin'])
        ->get("/logistics/trips/{$trip->id}")
        ->assertInertia(fn ($page) => $page
            ->where('figures.freight', money(2500000))
            ->where('figures.expenses', money(1190000))
            ->where('figures.margin', money(1310000))
            ->where('figures.paid', money(1500000))
            ->where('figures.balance', money(1000000)));
});

it('groups a trip expenses by kind, biggest first', function () {
    $ctx = haulier();
    $trip = recordTrip($ctx);

    foreach ([['fuel', 300000], ['fuel', 500000], ['loading', 100000]] as [$c, $a]) {
        TripExpense::create([
            'trip_id' => $trip->id, 'category' => $c, 'amount' => $a,
            'spent_at' => '2026-08-01',
        ]);
    }

    $this->actingAs($ctx['admin'])
        ->get("/logistics/trips/{$trip->id}")
        ->assertInertia(fn ($page) => $page
            ->where('byCategory.0.category', 'fuel')
            ->where('byCategory.0.total', money(800000))
            ->where('byCategory.1.category', 'loading')
            ->where('byCategory.1.total', money(100000)));
});

it('totals the trips list to the same figures', function () {
    $ctx = haulier();

    $one = recordTrip($ctx, ['freight_amount' => 2000000]);
    $two = recordTrip($ctx, ['freight_amount' => 1000000]);

    TripExpense::create(['trip_id' => $one->id, 'category' => 'fuel', 'amount' => 500000, 'spent_at' => '2026-08-01']);
    TripExpense::create(['trip_id' => $two->id, 'category' => 'fuel', 'amount' => 300000, 'spent_at' => '2026-08-01']);
    $one->payments()->create(['amount' => 2000000, 'paid_at' => '2026-08-02']);

    $this->actingAs($ctx['admin'])
        ->get('/logistics/trips')
        ->assertInertia(fn ($page) => $page
            ->where('totals.trips', 2)
            ->where('totals.freight', money(3000000))
            ->where('totals.expenses', money(800000))
            ->where('totals.margin', money(2200000))
            // 3,000,000 earned, 2,000,000 received.
            ->where('totals.outstanding', money(1000000)));
});

it('earns nothing on a cancelled trip but still counts what it cost', function () {
    $ctx = haulier();
    $trip = recordTrip($ctx, ['freight_amount' => 2000000]);
    TripExpense::create(['trip_id' => $trip->id, 'category' => 'fuel', 'amount' => 400000, 'spent_at' => '2026-08-01']);

    $this->actingAs($ctx['admin'])
        ->patch("/logistics/trips/{$trip->id}/status", ['status' => 'cancelled']);

    // The lorry still burned the fuel, so the margin is a real loss.
    $this->actingAs($ctx['admin'])
        ->get('/logistics/trips')
        ->assertInertia(fn ($page) => $page
            ->where('totals.freight', money(0))
            ->where('totals.expenses', money(400000))
            ->where('totals.margin', money(-400000))
            ->where('totals.outstanding', money(0)));
});

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

it('stamps and clears the delivery date with the status', function () {
    $ctx = haulier();
    $trip = recordTrip($ctx);

    $this->actingAs($ctx['admin'])
        ->patch("/logistics/trips/{$trip->id}/status", [
            'status' => 'delivered', 'delivered_at' => '2026-08-03',
        ]);
    expect($trip->fresh()->delivered_at->toDateString())->toBe('2026-08-03');

    // Back on the road: a journey still running cannot have arrived.
    $this->actingAs($ctx['admin'])
        ->patch("/logistics/trips/{$trip->id}/status", ['status' => 'in_transit']);
    expect($trip->fresh()->delivered_at)->toBeNull();
});

it('refuses a delivery date before the trip left', function () {
    $ctx = haulier();
    $trip = recordTrip($ctx, ['dispatched_at' => '2026-08-10']);

    $this->actingAs($ctx['admin'])
        ->patch("/logistics/trips/{$trip->id}/status", [
            'status' => 'delivered', 'delivered_at' => '2026-08-01',
        ])->assertSessionHasErrors('delivered_at');
});

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

it('filters trips by date, status and search', function () {
    $ctx = haulier();
    recordTrip($ctx, ['dispatched_at' => '2026-07-01', 'destination' => 'Arusha']);
    $august = recordTrip($ctx, ['dispatched_at' => '2026-08-15', 'destination' => 'Mbeya']);

    $this->actingAs($ctx['admin'])
        ->get('/logistics/trips?from_date=2026-08-01&to_date=2026-08-31')
        ->assertInertia(fn ($page) => $page
            ->has('trips', 1)
            ->where('trips.0.id', $august->id));

    $this->actingAs($ctx['admin'])
        ->get('/logistics/trips?search=Arusha')
        ->assertInertia(fn ($page) => $page->has('trips', 1)
            ->where('trips.0.destination', 'Arusha'));

    $this->actingAs($ctx['admin'])
        ->get('/logistics/trips?status=delivered')
        ->assertInertia(fn ($page) => $page->has('trips', 0));
});

// ---------------------------------------------------------------------------
// Boundaries
// ---------------------------------------------------------------------------

it('refuses to open or touch another company trip', function () {
    $mine = haulier();
    $theirs = haulier();
    $trip = recordTrip($theirs);

    $this->actingAs($mine['admin'])->get("/logistics/trips/{$trip->id}")->assertForbidden();
    $this->actingAs($mine['admin'])->delete("/logistics/trips/{$trip->id}")->assertForbidden();
    $this->actingAs($mine['admin'])
        ->patch("/logistics/trips/{$trip->id}/status", ['status' => 'cancelled'])
        ->assertForbidden();
    $this->actingAs($mine['admin'])
        ->post("/logistics/trips/{$trip->id}/expenses", [
            'category' => 'fuel', 'amount' => 1, 'spent_at' => '2026-08-01',
        ])->assertForbidden();

    expect($trip->fresh()->status)->toBe(Trip::IN_TRANSIT)
        ->and($trip->expenses()->count())->toBe(0);
});

it('refuses to delete another company expense line', function () {
    $mine = haulier();
    $theirs = haulier();
    $trip = recordTrip($theirs);
    $expense = TripExpense::create([
        'trip_id' => $trip->id, 'category' => 'fuel', 'amount' => 5000, 'spent_at' => '2026-08-01',
    ]);

    $this->actingAs($mine['admin'])
        ->delete("/logistics/trip-expenses/{$expense->id}")
        ->assertForbidden();

    expect(TripExpense::find($expense->id))->not->toBeNull();
});

it('takes a trip expenses and payments down with it', function () {
    $ctx = haulier();
    $trip = recordTrip($ctx);
    TripExpense::create(['trip_id' => $trip->id, 'category' => 'fuel', 'amount' => 1000, 'spent_at' => '2026-08-01']);
    $trip->payments()->create(['amount' => 500, 'paid_at' => '2026-08-01']);

    $this->actingAs($ctx['admin'])->delete("/logistics/trips/{$trip->id}")->assertRedirect();

    expect(Trip::find($trip->id))->toBeNull()
        ->and(TripExpense::where('trip_id', $trip->id)->count())->toBe(0)
        ->and(\App\Models\Logistics\TripPayment::where('trip_id', $trip->id)->count())->toBe(0);
});

// ---------------------------------------------------------------------------
// Registers protect their history
// ---------------------------------------------------------------------------

it('will not delete a truck, driver or client that has trips', function () {
    $ctx = haulier();
    recordTrip($ctx);

    $this->actingAs($ctx['admin'])
        ->delete("/logistics/trucks/{$ctx['truck']->id}")
        ->assertSessionHasErrors('truck');
    $this->actingAs($ctx['admin'])
        ->delete("/logistics/drivers/{$ctx['driver']->id}")
        ->assertSessionHasErrors('driver');
    $this->actingAs($ctx['admin'])
        ->delete("/logistics/clients/{$ctx['client']->id}")
        ->assertSessionHasErrors('client');

    expect(Truck::find($ctx['truck']->id))->not->toBeNull()
        ->and(Driver::find($ctx['driver']->id))->not->toBeNull()
        ->and(TripClient::find($ctx['client']->id))->not->toBeNull();
});

it('reports how many trips each register entry has', function () {
    $ctx = haulier();
    recordTrip($ctx);
    recordTrip($ctx);

    // withCount() alongside get([columns]) is exactly the combination that
    // silently drops a column, so this checks the number actually arrives.
    $this->actingAs($ctx['admin'])->get('/logistics/trucks')
        ->assertInertia(fn ($page) => $page->where('trucks.0.trips_count', 2));

    $this->actingAs($ctx['admin'])->get('/logistics/drivers')
        ->assertInertia(fn ($page) => $page->where('drivers.0.trips_count', 2));

    $this->actingAs($ctx['admin'])->get('/logistics/clients')
        ->assertInertia(fn ($page) => $page->where('clients.0.trips_count', 2));
});

it('keeps trips admin-only', function (string $role) {
    $ctx = haulier();
    $trip = recordTrip($ctx);
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

    $this->actingAs($other)->get('/logistics/trips')->assertForbidden();
    $this->actingAs($other)->get("/logistics/trips/{$trip->id}")->assertForbidden();
})->with(['manager', 'seller']);
