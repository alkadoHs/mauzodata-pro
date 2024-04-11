<?php

namespace App\Observers;
use App\Models\Expense;

class ExpenseObserver
{
    public function creating(Expense $expense): void
    {
        if (auth()->check()) {
            $expense->user_id = auth()->user()->id;
            $expense->branch_id = auth()->user()->branch_id;
        }
    }
}
