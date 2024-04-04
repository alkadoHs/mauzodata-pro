<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Lacodix\LaravelModelFilter\Traits\IsSearchable;

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
}
