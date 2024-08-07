<?php

namespace App\Http\Controllers;

use App\Models\CreditSale;
use App\Models\Order;
use Illuminate\Http\Request;

class CreditSalePaymentController extends Controller
{
    public function add_payment(Request $request, CreditSale $creditSale)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|max:99999999999',
        ]);
        $order = Order::find($creditSale->order_id);
        $totalPayments = $creditSale->creditSalePayments()->sum('amount');
        $totalPrice = $order->orderItems()->sum('total');

        $totalDept = $totalPrice - $totalPayments;

        if($totalDept > 0 && $validated['amount'] > $totalDept) {
            $validated['amount'] = $totalDept;
        } elseif($totalDept <= 0) {
            return back()->with('error', "Deni limelipwa tayari");
        }

        $creditSale->creditSalePayments()->create($validated);

        return back();
    }
}
