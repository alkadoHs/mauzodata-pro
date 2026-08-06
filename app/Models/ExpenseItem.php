<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpenseItem extends Model
{
    use HasFactory;


    protected $fillable = [
        'expense_id',
        'expense_category_id',
        'item',
        'cost',
    ];


    public function expense():BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }

    /**
     * What this was spent on. Null on everything recorded before categories
     * existed — `item` still carries the label either way.
     */
    public function expenseCategory(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class);
    }
}
