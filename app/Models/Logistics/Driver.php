<?php

namespace App\Models\Logistics;

use App\Models\Company;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Somebody who drives for the business.
 *
 * Retired with the switch rather than deleted once they have trips behind
 * them, so a past journey keeps the name of who actually drove it.
 */
class Driver extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'name',
        'phone',
        'license_number',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** The ones who should still be offered when sending a truck out. */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
