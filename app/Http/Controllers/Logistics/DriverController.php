<?php

namespace App\Http\Controllers\Logistics;

use App\Models\Logistics\Driver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Who drives the trucks.
 *
 * The everyday way to retire someone is the switch, not the bin: a driver who
 * has left still drove the trips he drove.
 */
class DriverController extends LogisticsController
{
    public function index(): Response
    {
        $this->authorizeLogistics();

        return Inertia::render('Logistics/Drivers', [
            'drivers' => Driver::where('company_id', $this->companyId())
                // Working drivers first, then alphabetical.
                ->withCount('trips')
                ->orderByDesc('is_active')
                ->orderBy('name')
                ->get(['id', 'name', 'phone', 'license_number', 'is_active', 'notes']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeLogistics();

        Driver::create([
            ...$this->validated($request),
            'company_id' => $this->companyId(),
            'is_active' => true,
        ]);

        return back()->with('success', 'Driver added.');
    }

    /**
     * Add a driver from inside the trip form — see ClientController::quickStore
     * for why this answers with the record instead of a redirect.
     */
    public function quickStore(Request $request): JsonResponse
    {
        $this->authorizeLogistics();

        $driver = Driver::create([
            ...$this->validated($request),
            'company_id' => $this->companyId(),
            'is_active' => true,
        ]);

        return response()->json([
            'driver' => ['id' => $driver->id, 'name' => $driver->name],
        ], 201);
    }

    public function update(Request $request, Driver $driver): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwns($driver);

        $driver->update($this->validated($request));

        return back()->with('success', 'Driver updated.');
    }

    /** The switch on the list — retire or bring back. */
    public function toggle(Driver $driver): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwns($driver);

        $driver->update(['is_active' => ! $driver->is_active]);

        return back()->with(
            'success',
            $driver->is_active ? 'Driver is back on the list.' : 'Driver retired.'
        );
    }

    public function destroy(Driver $driver): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwns($driver);

        $trips = $driver->trips()->count();
        if ($trips > 0) {
            return back()->withErrors(['driver' => "This driver has {$trips} trip(s) recorded, so they can't be deleted. Retire them instead — that keeps their name on the journeys they drove."]);
        }

        $driver->delete();

        return back()->with('success', 'Driver removed.');
    }

    /** @return array<string,mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:80'],
            'phone' => ['nullable', 'string', 'max:20'],
            'license_number' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string', 'max:500'],
        ], [], ['license_number' => 'licence number']);
    }

    private function authorizeOwns(Driver $driver): void
    {
        abort_unless($driver->company_id === $this->companyId(), 403);
    }
}
