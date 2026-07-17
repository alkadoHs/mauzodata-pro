<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ExpenseController extends Controller
{
    /**
     * Who an expense may be logged against: yourself, or one of your company's
     * vendors. Company-scoped — this used to be a bare orWhere('role', 'vendor'),
     * which would pull in other companies' vendors.
     */
    public static function loggableUsers()
    {
        return User::where('company_id', auth()->user()->company_id)
            ->where(fn ($q) => $q->where('id', auth()->id())->orWhere('role', 'vendor'))
            ->orderBy('name')
            ->get(['id', 'name', 'role']);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            // Must be yourself or a vendor in your own company.
            'user_id' => ['required', Rule::in(self::loggableUsers()->pluck('id')->all())],
            'expenses' => ['required', 'array', 'min:1'],
            'expenses.*.item' => ['required', 'string', 'max:255'],
            // min:0 matters — cost was entirely unvalidated, so negatives were accepted.
            'expenses.*.cost' => ['required', 'numeric', 'min:0'],
        ], [
            'user_id.in' => 'You can only log expenses for yourself or one of your vendors.',
            'expenses.required' => 'Add at least one expense line.',
        ]);

        DB::transaction(function () use ($validated) {
            // Find (or start) the day's sheet for the user we're attributing to.
            // This used to look up by auth()->id() but create with $request->user_id,
            // so a vendor's items were appended to whoever was logged in.
            $expense = Expense::where('user_id', $validated['user_id'])
                ->whereDate('created_at', today())
                ->first()
                ?? Expense::create(['user_id' => $validated['user_id']]);

            $expense->expenseItems()->createMany(
                collect($validated['expenses'])
                    ->map(fn ($e) => ['item' => $e['item'], 'cost' => $e['cost']])
                    ->all()
            );
        });

        return back()->with('success', 'Expenses recorded.');
    }
}
