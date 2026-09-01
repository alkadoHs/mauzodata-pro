<?php

namespace App\Models\Logistics;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Somebody whose mizigo the trucks carry.
 *
 * Not App\Models\Customer: that is the shop's, and putting haulage clients in
 * it would drop them into the shop's customer list and credit reports.
 */
class TripClient extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'name',
        'phone',
        'notes',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class, 'trip_client_id');
    }
}
