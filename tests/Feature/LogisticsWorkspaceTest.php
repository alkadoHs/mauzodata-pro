<?php

use App\Models\Branch;
use App\Models\Company;
use App\Models\User;
use App\Support\CurrentBranch;
use App\Support\CurrentWorkspace;

/**
 * The logistics workspace bolts a second system onto a live shop.
 *
 * The point these tests defend is separation: the haulage business shares a
 * login and a company with the shop and nothing else. In particular it does
 * not live inside a shop branch, so no amount of branch switching on the shop
 * side can move, hide or split the trucks' records.
 */
function makeCompany(): array
{
    $company = Company::create(['name' => 'Test Co '.uniqid()]);

    $branch = Branch::create([
        'company_id' => $company->id,
        'name' => 'branch-'.uniqid(),
    ]);

    return [$company, $branch];
}

function makeUser(Company $company, Branch $branch, string $role): User
{
    return User::create([
        'company_id' => $company->id,
        'branch_id' => $branch->id,
        'name' => ucfirst($role),
        'email' => $role.'-'.uniqid().'@example.com',
        'phone' => '070'.random_int(1000000, 9999999),
        'role' => $role,
        'isActive' => true,
        'password' => 'password',
    ]);
}

// ---------------------------------------------------------------------------
// Who can reach it
// ---------------------------------------------------------------------------

it('is admin-only', function (string $role) {
    [$company, $branch] = makeCompany();
    $user = makeUser($company, $branch, $role);

    $this->actingAs($user);

    expect(app(CurrentWorkspace::class)->isAvailable())->toBeFalse()
        ->and(app(CurrentWorkspace::class)->mustChoose())->toBeFalse()
        ->and(app(CurrentWorkspace::class)->current())->toBe(CurrentWorkspace::SHOP);

    $this->get('/logistics')->assertForbidden();
    $this->post('/workspace/switch', ['workspace' => 'logistics'])->assertForbidden();
})->with(['manager', 'seller']);

it('never interrupts a non-admin request', function () {
    [$company, $branch] = makeCompany();
    $seller = makeUser($company, $branch, 'seller');

    // Straight through to their own page, no chooser they cannot answer.
    $this->actingAs($seller)->get('/cart/sales')->assertOk();
});

it('tells a non-admin frontend there is nothing to switch to', function () {
    [$company, $branch] = makeCompany();
    $seller = makeUser($company, $branch, 'seller');

    $this->actingAs($seller)
        ->get('/cart/sales')
        ->assertInertia(fn ($page) => $page
            ->where('auth.hasLogistics', false)
            ->where('auth.workspace', 'shop'));
});

// ---------------------------------------------------------------------------
// Choosing and switching
// ---------------------------------------------------------------------------

it('asks the admin which system they are opening, once', function () {
    [$company, $branch] = makeCompany();
    $admin = makeUser($company, $branch, 'admin');

    $this->actingAs($admin)
        ->get('/dashboard')
        ->assertRedirect(route('workspace.choose', absolute: false));

    // Answering it stops the asking.
    $this->actingAs($admin)
        ->post('/workspace/switch', ['workspace' => 'shop'])
        ->assertRedirect(route('dashboard', absolute: false));

    $this->actingAs($admin)->get('/dashboard')->assertOk();
});

it('opens the system that was actually chosen', function () {
    [$company, $branch] = makeCompany();
    $admin = makeUser($company, $branch, 'admin');

    // The interrupted request was heading for the shop; choosing logistics
    // must not quietly honour that and land him back on the dashboard.
    $this->actingAs($admin)->get('/dashboard')
        ->assertRedirect(route('workspace.choose', absolute: false));

    $this->actingAs($admin)
        ->post('/workspace/switch', ['workspace' => 'logistics'])
        ->assertRedirect(route('logistics.home', absolute: false));
});

it('lets the admin move between the two systems', function () {
    [$company, $branch] = makeCompany();
    $admin = makeUser($company, $branch, 'admin');

    $this->actingAs($admin)->post('/workspace/switch', ['workspace' => 'logistics']);
    $this->actingAs($admin)->get('/logistics')->assertOk();

    $this->actingAs($admin)
        ->post('/workspace/switch', ['workspace' => 'shop'])
        ->assertRedirect(route('dashboard', absolute: false));
});

it('refuses a workspace that does not exist', function () {
    [$company, $branch] = makeCompany();
    $admin = makeUser($company, $branch, 'admin');

    $this->actingAs($admin)
        ->post('/workspace/switch', ['workspace' => 'accounts'])
        ->assertSessionHasErrors('workspace');
});

// ---------------------------------------------------------------------------
// The two systems stay separate
// ---------------------------------------------------------------------------

it('shows the logistics menu on a logistics page even when the session says shop', function () {
    [$company, $branch] = makeCompany();
    $admin = makeUser($company, $branch, 'admin');

    $this->actingAs($admin)->post('/workspace/switch', ['workspace' => 'shop']);

    // A bookmarked trip must not open wrapped in the shop's sidebar.
    $this->actingAs($admin)
        ->get('/logistics')
        ->assertInertia(fn ($page) => $page->where('auth.workspace', 'logistics'));
});

it('is unmoved by the shop branch switcher', function () {
    [$company, $branch] = makeCompany();
    $otherBranch = Branch::create([
        'company_id' => $company->id,
        'name' => 'other-'.uniqid(),
    ]);
    $admin = makeUser($company, $branch, 'admin');

    // Branch first, then workspace — the order the two choosers actually run
    // in for a multi-branch admin. Switching workspace beforehand would be
    // swallowed by the branch chooser, which is the intended precedence.
    session([CurrentBranch::SESSION_KEY => $branch->id]);
    $this->actingAs($admin)->post('/workspace/switch', ['workspace' => 'logistics']);

    // Point the shop at another branch, then at every branch at once. The
    // haulage business is not inside a branch, so neither changes a thing.
    foreach ([$otherBranch->id, CurrentBranch::ALL] as $target) {
        session([CurrentBranch::SESSION_KEY => $target]);

        $this->actingAs($admin)->get('/logistics')->assertOk();

        expect(app(CurrentWorkspace::class)->companyId())->toBe($company->id)
            ->and(session(CurrentWorkspace::SESSION_KEY))->toBe(CurrentWorkspace::LOGISTICS);
    }
});

it('scopes logistics to the admin own company', function () {
    [$companyA, $branchA] = makeCompany();
    [$companyB, $branchB] = makeCompany();
    $adminA = makeUser($companyA, $branchA, 'admin');
    $adminB = makeUser($companyB, $branchB, 'admin');

    $this->actingAs($adminA);
    expect(app(CurrentWorkspace::class)->companyId())->toBe($companyA->id);

    app()->forgetInstance(CurrentWorkspace::class);

    $this->actingAs($adminB);
    expect(app(CurrentWorkspace::class)->companyId())->toBe($companyB->id)
        ->and(app(CurrentWorkspace::class)->companyId())->not->toBe($companyA->id);
});
