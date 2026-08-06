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
        'to_product_id',
        'stock',
        'received_stock',
        'previous_stock',
        'stock_after',
        'to_stock_after',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withoutGlobalScope(BranchScope::class);
    }

    /**
     * The row in the receiving branch this line lands on.
     *
     * Unscoped for the same reason as product(): it belongs to a branch other
     * than the one the viewer is working in, by definition.
     */
    public function toProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'to_product_id')
            ->withoutGlobalScope(BranchScope::class);
    }

    public function productTransfer(): BelongsTo
    {
        return $this->belongsTo(ProductTransfer::class);
    }

}
