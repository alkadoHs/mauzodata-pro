<?php

namespace App\Models;

use App\Models\Filters\CreatedABetweenFilter;
use App\Observers\OrderObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;
use Lacodix\LaravelModelFilter\Traits\HasFilters;
use Lacodix\LaravelModelFilter\Traits\IsSearchable;

#[ObservedBy(OrderObserver::class)]
class Order extends Model
{
    use HasFactory, IsSearchable, HasFilters;

    protected $fillable = ['user_id', 'branch_id', 'customer_id', 'paid', 'print_invoice', 'invoice_number'];

    protected array $filters = [
        CreatedABetweenFilter::class,
    ];
    
    protected array $searchable = ['id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function creditSale(): HasOne
    {
        return $this->hasOne(CreditSale::class);
    }


}
