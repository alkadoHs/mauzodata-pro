<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A kind of spending — Chakula, Mafuta, and so on.
 *
 * Company-wide, and switched off rather than deleted once it has been used, so
 * that a category retiring doesn't rewrite what past expenses were filed under.
 */
class ExpenseCategory extends Model
{
    use HasFactory;

    protected $fillable = ['company_id', 'name', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** The ones staff should still be offered. */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
