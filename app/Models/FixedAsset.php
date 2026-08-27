<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One physical thing the company owns and would have to replace if it
 * disappeared — a computer, a printer, a Pikipiki, a Guta. Recorded
 * individually rather than as a type-and-quantity, because two of the same
 * model can be worth two different amounts.
 *
 * branch_id is nullable on purpose: null means company-wide (shared kit, or
 * simply not any one branch's), not "unknown" or "deleted branch" — see the
 * migration.
 */
class FixedAsset extends Model
{
    use HasFactory;

    public const ACTIVE = 'active';

    public const BROKEN = 'broken';

    protected $fillable = [
        'company_id',
        'branch_id',
        'name',
        'value',
        'status',
        'notes',
        'acquired_at',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'acquired_at' => 'date',
        ];
    }

    /** Still counted toward what the company owns. */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', self::ACTIVE);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** Who recorded it — shown for context, not enforced as an owner. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
