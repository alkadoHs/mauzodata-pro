<?php

namespace App\Http\Controllers\Logistics;

use App\Models\Logistics\Truck;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The fleet register.
 *
 * A truck is retired by marking it sold or in for repair rather than deleted,
 * so the trips it already ran keep the lorry that ran them.
 */
class TruckController extends LogisticsController
{
    public function index(): Response
    {
        $this->authorizeLogistics();

        return Inertia::render('Logistics/Trucks', [
            'trucks' => Truck::where('company_id', $this->companyId())
                ->withCount('trips')
                // Working trucks first, then the ones that can't take a load.
                ->orderByRaw("FIELD(status, 'active', 'in_repair', 'sold')")
                ->orderBy('plate_number')
                ->get()
                ->map(fn (Truck $truck) => [
                    'id' => $truck->id,
                    'plate_number' => $truck->plate_number,
                    'name' => $truck->name,
                    'make' => $truck->make,
                    'capacity_tons' => $truck->capacity_tons !== null ? (float) $truck->capacity_tons : null,
                    'status' => $truck->status,
                    'notes' => $truck->notes,
                    'trips_count' => $truck->trips_count,
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeLogistics();

        Truck::create([
            ...$this->validated($request),
            'company_id' => $this->companyId(),
        ]);

        return back()->with('success', 'Truck added.');
    }

    public function update(Request $request, Truck $truck): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwns($truck);

        $truck->update($this->validated($request, $truck->id));

        return back()->with('success', 'Truck updated.');
    }

    public function destroy(Truck $truck): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwns($truck);

        // The foreign key would refuse this anyway; saying why, and what to do
        // instead, is the difference between a usable app and a SQL error.
        $trips = $truck->trips()->count();
        if ($trips > 0) {
            return back()->withErrors(['truck' => "This truck has {$trips} trip(s) recorded against it, so it can't be deleted. Mark it sold or in repair instead — that keeps its journeys intact."]);
        }

        $truck->delete();

        return back()->with('success', 'Truck removed.');
    }

    /** @return array<string,mixed> */
    private function validated(Request $request, ?int $ignore = null): array
    {
        return $request->validate([
            'plate_number' => [
                'required', 'string', 'min:3', 'max:20',
                Rule::unique('trucks', 'plate_number')
                    ->where('company_id', $this->companyId())
                    ->ignore($ignore),
            ],
            'name' => ['nullable', 'string', 'max:60'],
            'make' => ['nullable', 'string', 'max:60'],
            'capacity_tons' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'status' => ['required', Rule::in(Truck::STATUSES)],
            'notes' => ['nullable', 'string', 'max:500'],
        ], [], ['plate_number' => 'plate number', 'capacity_tons' => 'capacity']);
    }

    /**
     * Route-model binding reaches any truck in the database — these models
     * carry no global scope — so ownership is checked here, every time.
     */
    private function authorizeOwns(Truck $truck): void
    {
        abort_unless($truck->company_id === $this->companyId(), 403);
    }
}
