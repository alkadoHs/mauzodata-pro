<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\FixedAsset;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The company's register of fixed assets — computers, printers, vehicles,
 * carts — kept so an admin can answer "what is this business actually
 * worth", not just "what's in the till today".
 *
 * Admin-only: this is a valuation record, and mis-entering or deleting one
 * quietly changes that answer. Every product-scoping decision here mirrors
 * ExpenseCategoryController/PaymentMethodController — company-wide by
 * default, with an optional branch — except FixedAsset does not use the
 * global BranchScope, because "company-wide" (branch_id null) has to stay
 * visible no matter which branch is active, which BranchScope's hard filter
 * would hide.
 */
class FixedAssetController extends Controller
{
    private const BRANCH_ALL = 'all';

    private const BRANCH_COMPANY = 'company';

    public function index(Request $request): Response
    {
        $this->authorizeAdmin();

        $companyId = $this->companyId();
        $branchFilter = (string) $request->query('branch', self::BRANCH_ALL);
        $search = trim((string) $request->query('search', ''));

        $assets = FixedAsset::query()
            ->where('company_id', $companyId)
            ->with('branch:id,name')
            ->when($branchFilter === self::BRANCH_COMPANY, fn (Builder $q) => $q->whereNull('branch_id'))
            ->when(
                $branchFilter !== self::BRANCH_ALL && $branchFilter !== self::BRANCH_COMPANY,
                fn (Builder $q) => $q->where('branch_id', (int) $branchFilter)
            )
            ->when($search !== '', fn (Builder $q) => $q->where(function (Builder $inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            }))
            ->orderByDesc('created_at')
            ->get();

        // Company net worth is computed over every asset, not the filtered
        // list — typing into search or picking a branch is for finding one
        // item, and shouldn't make the headline valuation figure move too.
        $all = FixedAsset::where('company_id', $companyId)->get(['value', 'status']);

        return Inertia::render('FixedAssets/Index', [
            'assets' => $assets->map(fn (FixedAsset $asset) => [
                'id' => $asset->id,
                'name' => $asset->name,
                'value' => (float) $asset->value,
                'status' => $asset->status,
                'notes' => $asset->notes,
                'acquired_at' => $asset->acquired_at?->toDateString(),
                'branch' => $asset->branch ? [
                    'id' => $asset->branch->id,
                    'name' => $asset->branch->name,
                ] : null,
            ]),
            'branches' => Branch::where('company_id', $companyId)->orderBy('name')->get(['id', 'name']),
            'totals' => [
                'active_value' => (float) $all->where('status', FixedAsset::ACTIVE)->sum('value'),
                'active_count' => $all->where('status', FixedAsset::ACTIVE)->count(),
                'broken_value' => (float) $all->where('status', FixedAsset::BROKEN)->sum('value'),
                'broken_count' => $all->where('status', FixedAsset::BROKEN)->count(),
            ],
            'filters' => ['branch' => $branchFilter, 'search' => $search],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAdmin();

        FixedAsset::create([
            ...$this->validated($request),
            'company_id' => $this->companyId(),
            'status' => FixedAsset::ACTIVE,
            'user_id' => auth()->id(),
        ]);

        return back()->with('success', 'Asset recorded.');
    }

    public function update(Request $request, FixedAsset $fixedAsset): RedirectResponse
    {
        $this->authorizeAdmin();
        $this->authorizeCompany($fixedAsset);

        $fixedAsset->update($this->validated($request));

        return back()->with('success', 'Asset updated.');
    }

    /** The everyday way to flag one down without losing its record or value. */
    public function updateStatus(Request $request, FixedAsset $fixedAsset): RedirectResponse
    {
        $this->authorizeAdmin();
        $this->authorizeCompany($fixedAsset);

        $validated = $request->validate([
            'status' => ['required', Rule::in([FixedAsset::ACTIVE, FixedAsset::BROKEN])],
        ]);

        $fixedAsset->update(['status' => $validated['status']]);

        return back()->with(
            'success',
            $validated['status'] === FixedAsset::BROKEN ? 'Marked as broken.' : 'Marked as active.'
        );
    }

    public function destroy(FixedAsset $fixedAsset): RedirectResponse
    {
        $this->authorizeAdmin();
        $this->authorizeCompany($fixedAsset);

        $fixedAsset->delete();

        return back()->with('success', 'Asset removed.');
    }

    /** @return array<string,mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'value' => ['required', 'numeric', 'min:0', 'max:999999999999.99'],
            'branch_id' => [
                'nullable',
                Rule::exists('branches', 'id')->where('company_id', $this->companyId()),
            ],
            'notes' => ['nullable', 'string', 'max:500'],
            'acquired_at' => ['nullable', 'date'],
        ]);
    }

    private function companyId(): int
    {
        return auth()->user()->company_id;
    }

    private function authorizeAdmin(): void
    {
        abort_unless(auth()->check() && auth()->user()->role === 'admin', 403);
    }

    private function authorizeCompany(FixedAsset $fixedAsset): void
    {
        abort_unless($fixedAsset->company_id === $this->companyId(), 403);
    }
}
