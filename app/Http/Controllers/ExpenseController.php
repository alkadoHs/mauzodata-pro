<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'expenses' => ['required', 'array', 'min:1'],
            'expenses.*.item' => ['required', 'string', 'max:255'],
            // min:0 matters — cost was entirely unvalidated, so negatives were accepted.
            'expenses.*.cost' => ['required', 'numeric', 'min:0'],
        ], [
            'expenses.required' => 'Add at least one expense line.',
        ]);

        // Always your own sheet. Expenses used to be loggable against another
        // user, but the sheet was looked up by auth()->id() while being created
        // with the request-supplied user_id — so those items landed on whoever
        // happened to be logged in.
        $userId = auth()->id();

        DB::transaction(function () use ($validated, $userId) {
            $expense = Expense::where('user_id', $userId)
                ->whereDate('created_at', today())
                ->first()
                ?? Expense::create(['user_id' => $userId]);

            $expense->expenseItems()->createMany(
                collect($validated['expenses'])
                    ->map(fn ($e) => ['item' => $e['item'], 'cost' => $e['cost']])
                    ->all()
            );
        });

        return back()->with('success', 'Expenses recorded.');
    }
}
