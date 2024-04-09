<?php

namespace App\Models;

use App\Models\Scopes\CartScope;
use App\Observers\CartObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ScopedBy(CartScope::class)]
#[ObservedBy(CartObserver::class)]
class Cart extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'customer_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }


    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }
}
