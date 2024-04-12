<?php

namespace App\Observers;
use App\Models\StoreProduct;

class StoreProductObserver
{
     public function creating(StoreProduct $product): void
        {
            if (auth()->check()) {
                $product->store_id = auth()->user()->store_id;
            }
        }
}
