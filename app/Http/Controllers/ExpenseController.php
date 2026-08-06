<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ExpenseController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $companyId = auth()->user()->company_id;

        $validated = $request->validate([
            'expenses' => ['required', 'array', 'min:1'],
            // Categories are the company's own, and only ones still in use.
            'expenses.*.expense_category_id' => [
                'required', 'integer',
                Rule::exists('expense_categories', 'id')
                    ->where('company_id', $companyId)
                    ->where('is_active', true),
            ],
            // min:0 matters — cost was entirely unvalidated, so negatives were accepted.
            'expenses.*.cost' => ['required', 'numeric', 'min:0'],
        ], [
            'expenses.required' => 'Add at least one expense line.',
            'expenses.*.expense_category_id.required' => 'Choose what the money was spent on.',
            'expenses.*.expense_category_id.exists' => 'That category is no longer available.',
        ]);

        $categories = ExpenseCategory::where('company_id', $companyId)
            ->active()
            ->get()
            ->keyBy('id');

        // Always your own sheet. Expenses used to be loggable against another
        // user, but the sheet was looked up by auth()->id() while being created
        // with the request-supplied user_id — so those items landed on whoever
        // happened to be logged in.
        $userId = auth()->id();

        DB::transaction(function () use ($validated, $userId, $categories) {
            $expense = Expense::where('user_id', $userId)
                ->whereDate('created_at', today())
                ->first()
                ?? Expense::create(['user_id' => $userId]);

            $expense->expenseItems()->createMany(
                collect($validated['expenses'])
                    ->map(fn ($e) => [
                        'expense_category_id' => $e['expense_category_id'],
                        // The label is copied, not looked up later: renaming a
                        // category must not rewrite what past expenses say, and
                        // every existing report reads this column.
                        'item' => $categories[$e['expense_category_id']]->name,
                        'cost' => $e['cost'],
                    ])
                    ->all()
            );
        });

        return back()->with('success', 'Expenses recorded.');
    }
}
