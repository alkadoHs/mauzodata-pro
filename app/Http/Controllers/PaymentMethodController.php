<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    public function index(): Response
    {
        $companyId = auth()->user()->company_id;

        return Inertia::render('PaymentMethods/Index', [
            // Scoped to the company — this used to be PaymentMethod::all().
            'paymentMethods' => PaymentMethod::where('company_id', $companyId)
                // Orders keep their history when a method is deleted (FK is SET NULL),
                // but we still show how many are using it before removing it.
                ->withCount(['orders' => fn ($query) => $query->withoutGlobalScopes()])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required', 'string', 'min:3', 'max:50',
                Rule::unique('payment_methods', 'name')
                    ->where('company_id', auth()->user()->company_id),
            ],
        ]);

        PaymentMethod::create([
            ...$validated,
            'company_id' => auth()->user()->company_id,
        ]);

        return back()->with('success', 'Payment method created.');
    }

    public function update(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $this->authorizeCompany($paymentMethod);

        $validated = $request->validate([
            'name' => [
                'required', 'string', 'min:3', 'max:50',
                Rule::unique('payment_methods', 'name')
                    ->where('company_id', auth()->user()->company_id)
                    ->ignore($paymentMethod->id),
            ],
        ]);

        $paymentMethod->update($validated);

        return back()->with('success', 'Payment method updated.');
    }

    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        $this->authorizeCompany($paymentMethod);

        // Non-destructive: orders.payment_method_id is ON DELETE SET NULL, so the
        // orders survive and simply lose their reference to this method.
        $paymentMethod->delete();

        return back()->with('success', 'Payment method deleted.');
    }

    private function authorizeCompany(PaymentMethod $paymentMethod): void
    {
        abort_unless($paymentMethod->company_id === auth()->user()->company_id, 403);
    }
}
