<?php

namespace App\Models;

use App\Observers\CreditSaleObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy(CreditSaleObserver::class)]
class CreditSale extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id', 'user_id'
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function creditSalePayments(): HasMany
    {
        return $this->hasMany(CreditSalePayment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
