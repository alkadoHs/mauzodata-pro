<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'released_by',
        'confirmed_by',
        'product_id',
        'buy_price',
        'sale_price',
        'stock',
        'sold',
        'status'
    ];


    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function releasedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'released_by');
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
