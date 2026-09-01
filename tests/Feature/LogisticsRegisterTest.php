<?php

use App\Models\Branch;
use App\Models\Company;
use App\Models\Logistics\Driver;
use App\Models\Logistics\TripClient;
use App\Models\Logistics\Truck;
use App\Models\User;

/**
 * Trucks, drivers and clients.
 *
 * These models carry no global scope, so route-model binding will happily
 * resolve another company's truck. Every mutating action therefore checks
 * ownership by hand — and that is what most of this file is about.
 */
function registerCompany(): array
{
    $company = Company::create(['name' => 'Haulier '.uniqid()]);
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

    return [$company, $admin];
}

// ---------------------------------------------------------------------------
// Trucks
// ---------------------------------------------------------------------------

it('records a truck against the admin own company', function () {
    [$company, $admin] = registerCompany();

    $this->actingAs($admin)->post('/logistics/trucks', [
        'plate_number' => 'T 123 ABC',
        'name' => 'Mzee',
        'make' => 'FAW',
        'capacity_tons' => '30',
        'status' => 'active',
    ])->assertRedirect();

    $truck = Truck::firstWhere('plate_number', 'T 123 ABC');

    expect($truck->company_id)->toBe($company->id)
        ->and($truck->status)->toBe(Truck::ACTIVE)
        ->and((float) $truck->capacity_tons)->toBe(30.0);
});

it('accepts a capacity typed with thousand separators', function () {
    [, $admin] = registerCompany();

    // RemoveCommaFromInput is on the route because the form uses NumericFormat.
    $this->actingAs($admin)->post('/logistics/trucks', [
        'plate_number' => 'T 999 ZZZ',
        'capacity_tons' => '1,250',
        'status' => 'active',
    ])->assertRedirect();

    expect((float) Truck::firstWhere('plate_number', 'T 999 ZZZ')->capacity_tons)
        ->toBe(1250.0);
});

it('refuses two trucks on the same plate in one company', function () {
    [, $admin] = registerCompany();

    $this->actingAs($admin)->post('/logistics/trucks', [
        'plate_number' => 'T 111 AAA', 'status' => 'active',
    ]);

    $this->actingAs($admin)->post('/logistics/trucks', [
        'plate_number' => 'T 111 AAA', 'status' => 'active',
    ])->assertSessionHasErrors('plate_number');

    expect(Truck::where('plate_number', 'T 111 AAA')->count())->toBe(1);
});

it('lets two companies use the same plate', function () {
    [, $adminA] = registerCompany();
    [, $adminB] = registerCompany();

    $this->actingAs($adminA)->post('/logistics/trucks', [
        'plate_number' => 'T 222 BBB', 'status' => 'active',
    ])->assertSessionHasNoErrors();

    $this->actingAs($adminB)->post('/logistics/trucks', [
        'plate_number' => 'T 222 BBB', 'status' => 'active',
    ])->assertSessionHasNoErrors();

    expect(Truck::where('plate_number', 'T 222 BBB')->count())->toBe(2);
});

it('refuses a status that is not a real one', function () {
    [, $admin] = registerCompany();

    $this->actingAs($admin)->post('/logistics/trucks', [
        'plate_number' => 'T 333 CCC', 'status' => 'exploded',
    ])->assertSessionHasErrors('status');
});

it('shows only the admin own trucks', function () {
    [, $adminA] = registerCompany();
    [, $adminB] = registerCompany();

    $this->actingAs($adminA)->post('/logistics/trucks', [
        'plate_number' => 'MINE 1', 'status' => 'active',
    ]);
    $this->actingAs($adminB)->post('/logistics/trucks', [
        'plate_number' => 'THEIRS 1', 'status' => 'active',
    ]);

    $this->actingAs($adminA)
        ->get('/logistics/trucks')
        ->assertInertia(fn ($page) => $page
            ->has('trucks', 1)
            ->where('trucks.0.plate_number', 'MINE 1'));
});

// ---------------------------------------------------------------------------
// The company boundary — these models have no global scope to lean on
// ---------------------------------------------------------------------------

it('refuses to touch another company truck', function () {
    [, $adminA] = registerCompany();
    [$companyB, $adminB] = registerCompany();

    $this->actingAs($adminB)->post('/logistics/trucks', [
        'plate_number' => 'NOT YOURS', 'status' => 'active',
    ]);
    $theirs = Truck::firstWhere('plate_number', 'NOT YOURS');

    $this->actingAs($adminA)
        ->patch("/logistics/trucks/{$theirs->id}", [
            'plate_number' => 'HIJACKED', 'status' => 'sold',
        ])->assertForbidden();

    $this->actingAs($adminA)
        ->delete("/logistics/trucks/{$theirs->id}")
        ->assertForbidden();

    $theirs->refresh();
    expect($theirs->plate_number)->toBe('NOT YOURS')
        ->and($theirs->company_id)->toBe($companyB->id);
});

it('refuses to touch another company driver or client', function () {
    [, $adminA] = registerCompany();
    [$companyB, $adminB] = registerCompany();

    $driver = Driver::create(['company_id' => $companyB->id, 'name' => 'Theirs']);
    $client = TripClient::create(['company_id' => $companyB->id, 'name' => 'Theirs']);

    $this->actingAs($adminA)->patch("/logistics/drivers/{$driver->id}", ['name' => 'X'])
        ->assertForbidden();
    $this->actingAs($adminA)->patch("/logistics/drivers/{$driver->id}/toggle")
        ->assertForbidden();
    $this->actingAs($adminA)->delete("/logistics/drivers/{$driver->id}")
        ->assertForbidden();

    $this->actingAs($adminA)->patch("/logistics/clients/{$client->id}", ['name' => 'X'])
        ->assertForbidden();
    $this->actingAs($adminA)->delete("/logistics/clients/{$client->id}")
        ->assertForbidden();

    expect($driver->fresh()->name)->toBe('Theirs')
        ->and($client->fresh()->name)->toBe('Theirs')
        ->and($driver->fresh()->is_active)->toBeTrue();
});

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

it('adds a driver active, and retires rather than deletes', function () {
    [$company, $admin] = registerCompany();

    $this->actingAs($admin)->post('/logistics/drivers', [
        'name' => 'Juma Hamisi',
        'phone' => '0712345678',
        'license_number' => 'DL-99',
    ])->assertRedirect();

    $driver = Driver::firstWhere('name', 'Juma Hamisi');
    expect($driver->is_active)->toBeTrue()
        ->and($driver->company_id)->toBe($company->id);

    $this->actingAs($admin)->patch("/logistics/drivers/{$driver->id}/toggle");
    expect($driver->fresh()->is_active)->toBeFalse();

    // And back again.
    $this->actingAs($admin)->patch("/logistics/drivers/{$driver->id}/toggle");
    expect($driver->fresh()->is_active)->toBeTrue();
});

it('cannot flip a driver active flag through the edit form', function () {
    [$company, $admin] = registerCompany();
    $driver = Driver::create([
        'company_id' => $company->id, 'name' => 'Retired', 'is_active' => false,
    ]);

    // is_active is not part of the update rules, so a hand-rolled request
    // carrying it must not revive a retired driver.
    $this->actingAs($admin)->patch("/logistics/drivers/{$driver->id}", [
        'name' => 'Retired', 'is_active' => true,
    ])->assertRedirect();

    expect($driver->fresh()->is_active)->toBeFalse();
});

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

it('keeps haulage clients out of the shop customers', function () {
    [$company, $admin] = registerCompany();

    $this->actingAs($admin)->post('/logistics/clients', [
        'name' => 'Mama Neema', 'phone' => '0755000111',
    ])->assertRedirect();

    expect(TripClient::where('company_id', $company->id)->count())->toBe(1)
        // The shop's own customers table is untouched by any of this.
        ->and(\App\Models\Customer::withoutGlobalScopes()->where('name', 'Mama Neema')->count())
        ->toBe(0);
});

it('requires a name for a client', function () {
    [, $admin] = registerCompany();

    $this->actingAs($admin)->post('/logistics/clients', ['phone' => '0755000111'])
        ->assertSessionHasErrors('name');
});

// ---------------------------------------------------------------------------
// Quick-create from inside the trip form
// ---------------------------------------------------------------------------

it('adds a client from the trip form and hands back the record', function () {
    [$company, $admin] = registerCompany();

    $response = $this->actingAs($admin)
        ->postJson('/logistics/clients/quick', ['name' => 'Mama Neema'])
        ->assertCreated();

    $client = TripClient::firstWhere('name', 'Mama Neema');

    // The caller needs the id back to select it — a redirect would be useless
    // to a dialog holding a half-filled trip.
    expect($response->json('client.id'))->toBe($client->id)
        ->and($response->json('client.name'))->toBe('Mama Neema')
        ->and($client->company_id)->toBe($company->id);
});

it('adds a driver from the trip form, active and ready to pick', function () {
    [$company, $admin] = registerCompany();

    $response = $this->actingAs($admin)
        ->postJson('/logistics/drivers/quick', ['name' => 'Juma Hamisi'])
        ->assertCreated();

    $driver = Driver::firstWhere('name', 'Juma Hamisi');

    expect($response->json('driver.id'))->toBe($driver->id)
        ->and($driver->is_active)->toBeTrue()
        ->and($driver->company_id)->toBe($company->id);
});

it('validates a quick-created name the same as the full form', function () {
    [, $admin] = registerCompany();

    $this->actingAs($admin)->postJson('/logistics/clients/quick', ['name' => 'A'])
        ->assertStatus(422);
    $this->actingAs($admin)->postJson('/logistics/drivers/quick', ['name' => ''])
        ->assertStatus(422);

    expect(TripClient::count())->toBe(0)->and(Driver::count())->toBe(0);
});

it('keeps quick-create admin-only', function (string $role) {
    [$company, $admin] = registerCompany();
    $other = User::create([
        'company_id' => $company->id,
        'branch_id' => $admin->branch_id,
        'name' => ucfirst($role),
        'email' => $role.'-'.uniqid().'@example.com',
        'phone' => '070'.random_int(1000000, 9999999),
        'role' => $role,
        'isActive' => true,
        'password' => 'password',
    ]);

    $this->actingAs($other)->postJson('/logistics/clients/quick', ['name' => 'Nope'])
        ->assertForbidden();
    $this->actingAs($other)->postJson('/logistics/drivers/quick', ['name' => 'Nope'])
        ->assertForbidden();

    expect(TripClient::count())->toBe(0)->and(Driver::count())->toBe(0);
})->with(['manager', 'seller']);

// ---------------------------------------------------------------------------
// Non-admins
// ---------------------------------------------------------------------------

it('keeps every register admin-only', function (string $role) {
    [$company, $admin] = registerCompany();
    $other = User::create([
        'company_id' => $company->id,
        'branch_id' => $admin->branch_id,
        'name' => ucfirst($role),
        'email' => $role.'-'.uniqid().'@example.com',
        'phone' => '070'.random_int(1000000, 9999999),
        'role' => $role,
        'isActive' => true,
        'password' => 'password',
    ]);

    foreach (['trucks', 'drivers', 'clients'] as $register) {
        $this->actingAs($other)->get("/logistics/{$register}")->assertForbidden();
        $this->actingAs($other)->post("/logistics/{$register}", ['name' => 'X'])
            ->assertForbidden();
    }
})->with(['manager', 'seller']);
