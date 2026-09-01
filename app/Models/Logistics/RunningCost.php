<?php

namespace App\Models\Logistics;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A cost of being in business rather than of any one journey.
 *
 * Dated by when it was spent, not by a trip — it belongs to a month, not to
 * a route.
 */
class RunningCost extends Model
{
    use HasFactory;

    public const CATEGORIES = [
        'insurance' => 'Insurance',
        'license' => 'Road licence',
        'servicing' => 'Servicing',
        'garage' => 'Garage & repairs',
        'salary' => 'Salaries',
        'parking' => 'Parking',
        'office' => 'Office & admin',
        'other' => 'Other',
    ];

    protected $fillable = [
        'company_id',
        'truck_id',
        'category',
        'amount',
        'description',
        'spent_at',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'spent_at' => 'date',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** Null when the cost belongs to the business rather than one lorry. */
    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function categoryLabel(): string
    {
        return self::CATEGORIES[$this->category] ?? $this->category;
    }
}
