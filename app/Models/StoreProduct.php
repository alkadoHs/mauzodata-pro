<?php

namespace App\Models;

use App\Models\Scopes\StoreScope;
use App\Observers\StoreProductObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Lacodix\LaravelModelFilter\Traits\IsSearchable;

#[ScopedBy(StoreScope::class)]
#[ObservedBy(StoreProductObserver::class)]
class StoreProduct extends Model
{
    use HasFactory, IsSearchable;

     protected $fillable = [
        'store_id',
        'name',
        'unit',
        'buy_price',
        'sale_price',
        'stock',
        'stock_alert',
        'whole_sale',
        'whole_price',
        'expire_date',
        'barcode',
    ];

    protected array $searchable = [
        'name',
    ];

    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn (string $name): string => Str::title($name),
            set: fn (string $name): string => strtolower($name),
        );
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
