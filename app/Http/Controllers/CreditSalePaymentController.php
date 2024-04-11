<?php

namespace App\Http\Controllers;

use App\Models\CreditSale;
use Illuminate\Http\Request;

class CreditSalePaymentController extends Controller
{
    public function add_payment(Request $request, CreditSale $creditSale)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|max:99999999999',
        ]);
        $creditSale->creditSalePayments()->create($validated);

        return back();
    }
}
