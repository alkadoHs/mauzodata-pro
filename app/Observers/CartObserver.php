<?php

namespace App\Observers;
use App\Models\Cart;

class CartObserver
{
    public function creating(Cart $product): void
    {
        if (auth()->check()) {
            $product->user_id = auth()->user()->id;
        }
    }
}
