<?php

namespace App\Models;

use App\Models\Scopes\BranchScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductTransferItem extends Model
{
    protected $fillable = [
        'product_transfer_id',
        'product_id',
        'stock',
        'previous_stock',
        'stock_after',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withoutGlobalScope(BranchScope::class);
    }

    public function productTransfer(): BelongsTo
    {
        return $this->belongsTo(ProductTransfer::class);
    }

}
