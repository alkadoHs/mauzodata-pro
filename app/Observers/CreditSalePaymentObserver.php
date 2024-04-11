<?php

namespace App\Observers;
use App\Models\CreditSalePayment;

class CreditSalePaymentObserver
{
    public function creating(CreditSalePayment $creditSalePayment): void
    {
        if (auth()->check()) {
            $creditSalePayment->user_id = auth()->user()->id;
        }
    }
}
