<?php

namespace App\Observers;
use App\Models\Order;
use App\Support\CurrentBranch;

class OrderObserver
{
    public function creating(Order $order): void
    {
        if (auth()->check()) {
            // $order->user_id = auth()->user()->id;
            $order->branch_id = app(CurrentBranch::class)->writeBranchId();
            $order->invoice_number = auth()->id() . date('dHmi');
        }
    }
}
