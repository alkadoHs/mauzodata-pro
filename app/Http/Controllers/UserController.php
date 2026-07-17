<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Relations that make an employee un-deletable (all RESTRICT at the DB level).
     * Counted without global scopes so the active branch doesn't skew the check.
     */
    private const HISTORY_RELATIONS = ['orders', 'expenses', 'purchaseOrders'];

    public function index(): Response
    {
        $companyId = auth()->user()->company_id;

        $counts = [];
        foreach (self::HISTORY_RELATIONS as $relation) {
            $counts[$relation] = fn ($query) => $query->withoutGlobalScopes();
        }

        return Inertia::render('Users/Index', [
            // Scoped to the company — this used to be User::get().
            'users' => User::where('company_id', $companyId)
                ->with('branch:id,name')
                ->withCount($counts)
                ->orderBy('name')
                ->get(),
            'branches' => Branch::where('company_id', $companyId)->orderBy('name')->get(),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::create([
            ...$validated,
            'company_id' => auth()->user()->company_id,
            'password' => Hash::make($validated['password']),
        ]);

        event(new Registered($user));

        return back()->with('success', 'Employee created.');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->authorizeCompany($user);
        $this->authorizeTarget($user);

        $validated = $request->validated();

        // Never demote the last admin — that would leave the company with nobody
        // able to manage authorization keys or other admins.
        if ($user->isAdmin() && $validated['role'] !== 'admin' && $this->adminCount() <= 1) {
            return back()->withErrors([
                'role' => 'This is the only admin. Promote someone else to admin first.',
            ]);
        }

        // Only change the password when one was actually entered.
        if (blank($validated['password'] ?? null)) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return back()->with('success', 'Employee updated.');
    }

    /**
     * Activate / deactivate. A deactivated employee cannot sign in (see LoginRequest).
     */
    public function toggleActive(User $user): RedirectResponse
    {
        $this->authorizeCompany($user);
        $this->authorizeTarget($user);

        if ($user->id === auth()->id()) {
            return back()->withErrors(['isActive' => 'You cannot deactivate your own account.']);
        }

        $user->update(['isActive' => ! $user->isActive]);

        return back()->with('success', $user->isActive ? 'Employee activated.' : 'Employee deactivated.');
    }

    /**
     * Hard delete is only allowed for employees with no trading history — orders,
     * expenses and purchase orders are RESTRICT, and credit sales would CASCADE.
     * Anyone with history should be deactivated instead.
     */
    public function destroy(User $user): RedirectResponse
    {
        $this->authorizeCompany($user);
        $this->authorizeTarget($user);

        if ($user->id === auth()->id()) {
            return back()->withErrors(['delete' => 'You cannot delete your own account.']);
        }

        $user->loadCount(array_combine(
            self::HISTORY_RELATIONS,
            array_map(fn () => fn ($query) => $query->withoutGlobalScopes(), self::HISTORY_RELATIONS)
        ));

        $history = collect(self::HISTORY_RELATIONS)
            ->sum(fn (string $relation) => $user->{$relation.'_count'});

        if ($history > 0) {
            return back()->withErrors([
                'delete' => "{$user->name} has trading history and cannot be deleted. Deactivate them instead.",
            ]);
        }

        $user->delete();

        return back()->with('success', 'Employee deleted.');
    }

    private function authorizeCompany(User $user): void
    {
        abort_unless($user->company_id === auth()->user()->company_id, 403);
    }

    /**
     * Only an admin may act on an admin. Without this a manager could edit the
     * admin's email/password and simply take the account over — a full
     * escalation past their own level.
     */
    private function authorizeTarget(User $user): void
    {
        abort_if($user->isAdmin() && ! auth()->user()->isAdmin(), 403);
    }

    private function adminCount(): int
    {
        return User::where('company_id', auth()->user()->company_id)
            ->where('role', 'admin')
            ->count();
    }
}
