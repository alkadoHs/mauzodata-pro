<?php

namespace App\Models;

use App\Models\Scopes\BranchScope;
use App\Models\Scopes\ProductBranchScope;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ScopedBy(ProductBranchScope::class)]
class NewStock extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'stock', 'new_stock'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withoutGlobalScope(BranchScope::class);
    }
}
