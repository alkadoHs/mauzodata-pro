<?php

namespace App\Models;

use App\Models\Scopes\BranchScope;
use App\Observers\ProductObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Lacodix\LaravelModelFilter\Traits\IsSearchable;

#[ObservedBy(ProductObserver::class)]
#[ScopedBy(BranchScope::class)]
class Product extends Model
{
    use HasFactory, IsSearchable;

    protected $fillable = [
        'branch_id',
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

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function newStocks(): HasMany
    {
        return $this->hasMany(NewStock::class);
    }

    public function stockTransfers(): HasMany
    {
        return $this->hasMany(StockTransfer::class);
    }

    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

}
