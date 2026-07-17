<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBranchRequest;
use App\Http\Requests\UpdateBranchRequest;
use App\Models\Branch;
use App\Support\CurrentBranch;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    /**
     * Relations counted for the table and the delete-impact preview.
     *
     * Every one of these models is branch-scoped globally, so the counts MUST
     * bypass global scopes — otherwise each subquery would also filter by the
     * *active* branch and report 0 for every other branch.
     */
    private const IMPACT_RELATIONS = [
        'users', 'products', 'orders', 'customers',
        'expenses', 'purchaseOrders', 'stockTransfers', 'productTransfers',
    ];

    public function index(): Response
    {
        $counts = [];
        foreach (self::IMPACT_RELATIONS as $relation) {
            $counts[$relation] = fn ($query) => $query->withoutGlobalScopes();
        }

        return Inertia::render('Branches/Index', [
            'branches' => Branch::where('company_id', auth()->user()->company_id)
                ->withCount($counts)
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Also reached during onboarding (register → create company → create branch).
     */
    public function create(): Response
    {
        return Inertia::render('Auth/CreateBranch');
    }

    public function store(StoreBranchRequest $request): RedirectResponse
    {
        $branch = Branch::create([
            'company_id' => auth()->user()->company_id,
            ...$request->validated(),
        ]);

        // Only adopt the new branch when the user doesn't have one yet — that's the
        // onboarding case (a freshly registered admin has no branch). An established
        // admin adding another branch should stay put and use the branch switcher.
        $user = auth()->user();
        if ($user->branch_id === null) {
            $user->branch_id = $branch->id;
            $user->save();
        }

        return back()->with('success', 'Branch created.');
    }

    public function update(UpdateBranchRequest $request, Branch $branch): RedirectResponse
    {
        $this->authorizeCompany($branch);

        $branch->update($request->validated());

        return back()->with('success', 'Branch updated.');
    }

    /**
     * Destructive: orders, products, customers, expenses and purchase orders all
     * CASCADE from branches. Guarded by an exact typed name, a last-branch check,
     * and a transaction that surfaces RESTRICT failures as a friendly error.
     */
    public function destroy(Request $request, Branch $branch): RedirectResponse
    {
        $this->authorizeCompany($branch);

        $companyId = auth()->user()->company_id;

        if (Branch::where('company_id', $companyId)->count() <= 1) {
            return back()->withErrors([
                'confirm_name' => 'You cannot delete the only branch of your company.',
            ]);
        }

        // Re-check the typed confirmation server-side; never trust the dialog alone.
        $typed = trim((string) $request->input('confirm_name'));
        if (strcasecmp($typed, (string) $branch->name) !== 0) {
            return back()->withErrors([
                'confirm_name' => 'The branch name you typed does not match.',
            ]);
        }

        try {
            DB::transaction(fn () => $branch->delete());
        } catch (QueryException $e) {
            return back()->withErrors([
                'confirm_name' => 'This branch still has stock transfers attached and cannot be deleted.',
            ]);
        }

        // Don't leave the session pointing at a branch that no longer exists.
        if ((int) session(CurrentBranch::SESSION_KEY) === $branch->id) {
            session()->forget(CurrentBranch::SESSION_KEY);
        }

        return back()->with('success', 'Branch deleted.');
    }

    private function authorizeCompany(Branch $branch): void
    {
        abort_unless($branch->company_id === auth()->user()->company_id, 403);
    }
}
