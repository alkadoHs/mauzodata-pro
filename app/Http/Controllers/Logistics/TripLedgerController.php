<?php

namespace App\Http\Controllers\Logistics;

use App\Models\Logistics\Trip;
use App\Models\Logistics\TripExpense;
use App\Models\Logistics\TripPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * What a trip cost and what the client paid.
 *
 * Both live on the trip's own page and are added there, so they share a
 * controller: they are the same gesture — recording something that happened
 * on this journey — pointing in opposite directions.
 */
class TripLedgerController extends LogisticsController
{
    public function storeExpense(Request $request, Trip $trip): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwnsTrip($trip);

        $validated = $request->validate([
            'category' => ['required', Rule::in(array_keys(TripExpense::CATEGORIES))],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999'],
            'description' => ['nullable', 'string', 'max:160'],
            'spent_at' => ['required', 'date'],
        ], [], ['spent_at' => 'date']);

        $trip->expenses()->create([
            ...$validated,
            'user_id' => auth()->id(),
        ]);

        return back()->with('success', 'Expense added.');
    }

    public function destroyExpense(TripExpense $expense): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwnsTrip($expense->trip);

        $expense->delete();

        return back()->with('success', 'Expense removed.');
    }

    public function storePayment(Request $request, Trip $trip): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwnsTrip($trip);

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999'],
            'paid_at' => ['required', 'date'],
            'method' => ['nullable', 'string', 'max:40'],
            'note' => ['nullable', 'string', 'max:160'],
        ], [], ['paid_at' => 'date']);

        $trip->payments()->create([
            ...$validated,
            'user_id' => auth()->id(),
        ]);

        return back()->with('success', 'Payment recorded.');
    }

    public function destroyPayment(TripPayment $payment): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwnsTrip($payment->trip);

        $payment->delete();

        return back()->with('success', 'Payment removed.');
    }

    /**
     * A line is only reachable through its trip, so that is what gets checked
     * — and a line whose trip has somehow gone is not this company's to touch.
     */
    private function authorizeOwnsTrip(?Trip $trip): void
    {
        abort_unless($trip !== null && $trip->company_id === $this->companyId(), 403);
    }
}
