<?php

namespace App\Http\Controllers;

use App\Models\CreditSale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CreditSalePaymentController extends Controller
{
    public function add_payment(Request $request, CreditSale $creditSale): RedirectResponse
    {
        $validated = $request->validate([
            // min:0.01 matters — without it a negative amount was accepted and
            // silently *increased* the customer's debt.
            'amount' => 'required|numeric|min:0.01|max:99999999999',
        ]);

        // Branch isolation comes from CreditSale's OrderBranchScope on route-model
        // binding; use the relation rather than a branch-scoped Order::find().
        $order = $creditSale->order;

        if (! $order) {
            return back()->withErrors(['amount' => 'This credit sale has no order attached.']);
        }

        $settled = false;

        DB::transaction(function () use ($creditSale, $order, $validated, &$settled) {
            // Lock so two people taking a payment at once can't both overpay.
            $paid = (float) $creditSale->creditSalePayments()->lockForUpdate()->sum('amount');
            $billed = (float) $order->orderItems()->sum('total');
            $outstanding = $billed - $paid;

            if ($outstanding <= 0) {
                $creditSale->update(['status' => 'paid']);
                $settled = true;

                return;
            }

            // Never take more than what's owed — clamp, then settle if cleared.
            $amount = min((float) $validated['amount'], $outstanding);
            $creditSale->creditSalePayments()->create(['amount' => $amount]);

            if ($amount >= $outstanding) {
                $creditSale->update(['status' => 'paid']);
            }
        });

        if ($settled) {
            return back()->withErrors(['amount' => 'This debt has already been paid off.']);
        }

        return back()->with('success', 'Payment recorded.');
    }
}
