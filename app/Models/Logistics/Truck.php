<?php

namespace App\Models\Logistics;

use App\Models\Company;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One lorry in the fleet.
 *
 * Under App\Models\Logistics on purpose: the haulage business keeps its own
 * models as it keeps its own tables, so it is obvious at a glance which
 * system a class belongs to.
 */
class Truck extends Model
{
    use HasFactory;

    public const ACTIVE = 'active';

    public const IN_REPAIR = 'in_repair';

    public const SOLD = 'sold';

    public const STATUSES = [self::ACTIVE, self::IN_REPAIR, self::SOLD];

    protected $fillable = [
        'company_id',
        'plate_number',
        'name',
        'make',
        'capacity_tons',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return ['capacity_tons' => 'decimal:2'];
    }

    /** The ones that can actually take a load out today. */
    public function scopeAvailable(Builder $query): void
    {
        $query->where('status', self::ACTIVE);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    /** Plate first, since that is what a document or a weighbridge shows. */
    public function label(): string
    {
        return $this->name
            ? "{$this->plate_number} ({$this->name})"
            : $this->plate_number;
    }
}
