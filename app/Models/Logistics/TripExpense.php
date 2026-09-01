<?php

namespace App\Models\Logistics;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A shilling spent getting one load from A to B. */
class TripExpense extends Model
{
    use HasFactory;

    /**
     * The costs that actually come up on the road, in the order someone would
     * think of them. Kept as a fixed list rather than a table the user keeps:
     * a haulage trip's costs are the same every time, and a setup screen for
     * them would be one more thing to fill in before recording anything.
     */
    public const CATEGORIES = [
        'fuel' => 'Mafuta (fuel)',
        'loading' => 'Kupakia (loading)',
        'unloading' => 'Kushusha (unloading)',
        'allowance' => 'Posho (driver allowance)',
        'tolls' => 'Tolls & road fees',
        'weighbridge' => 'Mizani (weighbridge)',
        'repairs' => 'Matengenezo (repairs)',
        'food' => 'Chakula (food)',
        'other' => 'Other',
    ];

    protected $fillable = [
        'trip_id',
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

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
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
