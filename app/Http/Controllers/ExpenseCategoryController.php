<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use App\Support\CurrentBranch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The company's list of expense categories.
 *
 * Admins and managers keep it; everyone else only ever picks from it. A
 * category is two things — a name and whether staff should still be offered it
 * — and nothing more, on purpose.
 */
class ExpenseCategoryController extends Controller
{
    public function index(): Response
    {
        $this->authorizeManager();

        return Inertia::render('ExpenseCategories/Index', [
            'categories' => ExpenseCategory::where('company_id', $this->companyId())
                // Active first, then alphabetical: the working list on top.
                ->orderByDesc('is_active')
                ->orderBy('name')
                ->get(['id', 'name', 'is_active']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeManager();

        $validated = $request->validate([
            'name' => $this->nameRules(),
            'is_active' => ['boolean'],
        ]);

        ExpenseCategory::create([
            'company_id' => $this->companyId(),
            'name' => $validated['name'],
            // New categories are for using, so on unless said otherwise.
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return back()->with('success', 'Category added.');
    }

    public function update(Request $request, ExpenseCategory $expenseCategory): RedirectResponse
    {
        $this->authorizeManager();
        $this->authorizeCompany($expenseCategory);

        $validated = $request->validate([
            'name' => $this->nameRules($expenseCategory->id),
            'is_active' => ['boolean'],
        ]);

        $expenseCategory->update([
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? $expenseCategory->is_active,
        ]);

        return back()->with('success', 'Category updated.');
    }

    /** The switch on the list — the everyday way to retire or revive one. */
    public function toggle(ExpenseCategory $expenseCategory): RedirectResponse
    {
        $this->authorizeManager();
        $this->authorizeCompany($expenseCategory);

        $expenseCategory->update(['is_active' => ! $expenseCategory->is_active]);

        return back();
    }

    public function destroy(ExpenseCategory $expenseCategory): RedirectResponse
    {
        $this->authorizeManager();
        $this->authorizeCompany($expenseCategory);

        $expenseCategory->delete();

        return back()->with('success', 'Category deleted.');
    }

    /** @return array<int,mixed> */
    private function nameRules(?int $ignore = null): array
    {
        return [
            'required', 'string', 'min:2', 'max:50',
            Rule::unique('expense_categories', 'name')
                ->where('company_id', $this->companyId())
                ->ignore($ignore),
        ];
    }

    private function companyId(): int
    {
        return auth()->user()->company_id;
    }

    private function authorizeManager(): void
    {
        // Same bar as the rest of Setup: admins and managers.
        abort_unless(app(CurrentBranch::class)->canSwitch(), 403);
    }

    private function authorizeCompany(ExpenseCategory $category): void
    {
        abort_unless($category->company_id === $this->companyId(), 403);
    }
}
