<?php

namespace App\Http\Controllers;

use App\Models\ExpenseItem;
use App\Support\CurrentBranch;
use Illuminate\Http\RedirectResponse;

class ExpenseItemController extends Controller
{
    /**
     * Remove a single expense line. Previously there was no way at all to undo a
     * mistyped expense.
     *
     * Guards: the line must belong to an expense in the active branch, and to
     * your own sheet unless you're an admin/manager.
     */
    public function destroy(ExpenseItem $expenseItem): RedirectResponse
    {
        $expense = $expenseItem->expense;

        // Expense is branch-scoped, so a line from another branch won't resolve.
        if (! $expense) {
            abort(404);
        }

        $canManageOthers = app(CurrentBranch::class)->canSwitch();

        abort_unless(
            $canManageOthers || $expense->user_id === auth()->id(),
            403,
            'You can only remove your own expenses.'
        );

        $expenseItem->delete();

        return back()->with('success', 'Expense removed.');
    }
}
