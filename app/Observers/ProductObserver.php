<?php

namespace App\Observers;
use App\Models\Product;
use App\Support\CurrentBranch;

class ProductObserver
{
    public function creating(Product $product): void
        {
            if (auth()->check()) {
                $product->branch_id = app(CurrentBranch::class)->writeBranchId();
            }
        }
}
