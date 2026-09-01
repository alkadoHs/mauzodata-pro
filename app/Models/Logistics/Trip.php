<?php

namespace App\Models\Logistics;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

/**
 * One journey: a truck, a client's load, a route and a price.
 *
 * Everything the business earns and spends is attached to one of these, which
 * is why the profit report is just sums over trips rather than a separate
 * accounting system.
 */
class Trip extends Model
{
    use HasFactory;

    public const IN_TRANSIT = 'in_transit';

    public const DELIVERED = 'delivered';

    public const CANCELLED = 'cancelled';

    public const STATUSES = [self::IN_TRANSIT, self::DELIVERED, self::CANCELLED];

    protected $fillable = [
        'company_id',
        'truck_id',
        'trip_client_id',
        'driver_id',
        'sequence',
        'origin',
        'destination',
        'cargo',
        'weight_tons',
        'freight_amount',
        'status',
        'dispatched_at',
        'delivered_at',
        'notes',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'weight_tons' => 'decimal:2',
            'freight_amount' => 'decimal:2',
            'dispatched_at' => 'date',
            'delivered_at' => 'date',
        ];
    }

    /**
     * Trips that count as business done.
     *
     * A cancelled journey earns nothing — but any money already spent on it
     * was still spent, which is why this filters income, not expenses.
     */
    public function scopeEarning(Builder $query): void
    {
        $query->where('status', '!=', self::CANCELLED);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(TripClient::class, 'trip_client_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(TripExpense::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(TripPayment::class);
    }

    /** What people call it out loud: "safari namba 45". */
    public function reference(): string
    {
        return 'TRP-'.str_pad((string) $this->sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * The next reference number for a company.
     *
     * Locked while it reads: two trips recorded at the same moment must not
     * both come back with the same number, and the unique index would reject
     * the second if they did. Call inside a transaction.
     */
    public static function nextSequence(int $companyId): int
    {
        $max = DB::table('trips')
            ->where('company_id', $companyId)
            ->lockForUpdate()
            ->max('sequence');

        return (int) $max + 1;
    }
}
