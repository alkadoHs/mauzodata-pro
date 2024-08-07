<?php

namespace App\Observers;
use App\Models\Order;

class OrderObserver
{
    public function creating(Order $order): void
    {
        if (auth()->check()) {
            // $order->user_id = auth()->user()->id;
            $order->branch_id = auth()->user()->branch_id;
            $order->invoice_number = auth()->id() . date('dHmi');
        }
    }
}
