<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    public function index(): Response
    {
        return Inertia::render("PaymentMethods/Index", [
            "paymentMethods"=> PaymentMethod::all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50|min:3'
        ]);

        $validated['company_id'] = auth()->user()->company_id;
        $paymentMethod = PaymentMethod::create($validated);

        return redirect()->back();
    }

    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        $paymentMethod->delete();

        return redirect()->back();
    }
}
