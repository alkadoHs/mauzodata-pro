<?php

namespace App\Observers;
use App\Models\CreditSale;

class CreditSaleObserver
{
    public function creating(CreditSale $creditSale): void
    {
        if (auth()->check()) {
            $creditSale->user_id = auth()->user()->id;
        }
    }
}
