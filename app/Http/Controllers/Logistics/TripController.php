<?php

namespace App\Http\Controllers\Logistics;

use App\Models\Logistics\Driver;
use App\Models\Logistics\Trip;
use App\Models\Logistics\TripClient;
use App\Models\Logistics\TripExpense;
use App\Models\Logistics\Truck;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Trips — the journeys the business actually runs, and what each one made.
 *
 * A trip's margin is its freight minus its own expenses. That is not the
 * whole net profit (running costs sit outside any one journey) and the
 * screens say so, rather than letting a good-looking margin be mistaken for
 * money in hand.
 */
class TripController extends LogisticsController
{
    public function index(Request $request): Response
    {
        $this->authorizeLogistics();

        $filters = $request->validate([
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(Trip::STATUSES)],
            'truck_id' => ['nullable', 'integer'],
            'search' => ['nullable', 'string', 'max:80'],
        ]);

        $query = $this->filtered($filters);

        $trips = (clone $query)
            ->with(['truck:id,plate_number,name', 'client:id,name', 'driver:id,name'])
            ->withSum('expenses as expenses_total', 'amount')
            ->withSum('payments as paid_total', 'amount')
            ->orderByDesc('dispatched_at')
            ->orderByDesc('sequence')
            ->get()
            ->map(function (Trip $trip) {
                $freight = (float) $trip->freight_amount;
                $expenses = (float) ($trip->expenses_total ?? 0);
                $paid = (float) ($trip->paid_total ?? 0);
                $earning = $trip->status !== Trip::CANCELLED;

                return [
                    'id' => $trip->id,
                    'reference' => $trip->reference(),
                    'dispatched_at' => $trip->dispatched_at?->toDateString(),
                    'delivered_at' => $trip->delivered_at?->toDateString(),
                    'origin' => $trip->origin,
                    'destination' => $trip->destination,
                    'cargo' => $trip->cargo,
                    'client' => $trip->client?->name,
                    'truck' => $trip->truck?->plate_number,
                    'driver' => $trip->driver?->name,
                    'status' => $trip->status,
                    // A cancelled journey earns nothing, but anything already
                    // spent on it was still spent — so it keeps its expenses.
                    'freight' => $earning ? $freight : 0.0,
                    'expenses' => $expenses,
                    'margin' => ($earning ? $freight : 0.0) - $expenses,
                    'paid' => $paid,
                    'balance' => ($earning ? $freight : 0.0) - $paid,
                ];
            });

        return Inertia::render('Logistics/Trips', [
            'trips' => $trips,
            'totals' => [
                'trips' => $trips->count(),
                'freight' => round($trips->sum('freight'), 2),
                'expenses' => round($trips->sum('expenses'), 2),
                'margin' => round($trips->sum('margin'), 2),
                'outstanding' => round($trips->sum('balance'), 2),
            ],
            'trucks' => Truck::where('company_id', $this->companyId())
                ->orderBy('plate_number')->get(['id', 'plate_number', 'name', 'status']),
            'drivers' => Driver::where('company_id', $this->companyId())
                ->active()->orderBy('name')->get(['id', 'name']),
            'clients' => TripClient::where('company_id', $this->companyId())
                ->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'from_date' => $filters['from_date'] ?? null,
                'to_date' => $filters['to_date'] ?? null,
                'status' => $filters['status'] ?? null,
                'truck_id' => $filters['truck_id'] ?? null,
                'search' => $filters['search'] ?? null,
            ],
        ]);
    }

    public function show(Trip $trip): Response
    {
        $this->authorizeLogistics();
        $this->authorizeOwns($trip);

        $trip->load([
            'truck:id,plate_number,name',
            'client:id,name,phone',
            'driver:id,name,phone',
            'expenses' => fn ($q) => $q->orderByDesc('spent_at')->orderByDesc('id'),
            'payments' => fn ($q) => $q->orderByDesc('paid_at')->orderByDesc('id'),
        ]);

        $freight = $trip->status === Trip::CANCELLED ? 0.0 : (float) $trip->freight_amount;
        $expenses = (float) $trip->expenses->sum('amount');
        $paid = (float) $trip->payments->sum('amount');

        return Inertia::render('Logistics/Trip', [
            'trip' => [
                'id' => $trip->id,
                'reference' => $trip->reference(),
                'origin' => $trip->origin,
                'destination' => $trip->destination,
                'cargo' => $trip->cargo,
                'weight_tons' => $trip->weight_tons !== null ? (float) $trip->weight_tons : null,
                'freight_amount' => (float) $trip->freight_amount,
                'status' => $trip->status,
                'dispatched_at' => $trip->dispatched_at?->toDateString(),
                'delivered_at' => $trip->delivered_at?->toDateString(),
                'notes' => $trip->notes,
                'truck' => $trip->truck ? [
                    'id' => $trip->truck->id,
                    'label' => $trip->truck->label(),
                ] : null,
                'client' => $trip->client ? [
                    'id' => $trip->client->id,
                    'name' => $trip->client->name,
                    'phone' => $trip->client->phone,
                ] : null,
                'driver' => $trip->driver ? [
                    'id' => $trip->driver->id,
                    'name' => $trip->driver->name,
                    'phone' => $trip->driver->phone,
                ] : null,
                'truck_id' => $trip->truck_id,
                'trip_client_id' => $trip->trip_client_id,
                'driver_id' => $trip->driver_id,
            ],
            'figures' => [
                'freight' => $freight,
                'expenses' => $expenses,
                'margin' => $freight - $expenses,
                'paid' => $paid,
                'balance' => $freight - $paid,
            ],
            'expenses' => $trip->expenses->map(fn (TripExpense $e) => [
                'id' => $e->id,
                'category' => $e->category,
                'category_label' => $e->categoryLabel(),
                'amount' => (float) $e->amount,
                'description' => $e->description,
                'spent_at' => $e->spent_at?->toDateString(),
            ]),
            'payments' => $trip->payments->map(fn ($p) => [
                'id' => $p->id,
                'amount' => (float) $p->amount,
                'paid_at' => $p->paid_at?->toDateString(),
                'method' => $p->method,
                'note' => $p->note,
            ]),
            // What each kind of cost came to on this journey, biggest first —
            // the quickest answer to "where did the money go".
            'byCategory' => $trip->expenses
                ->groupBy('category')
                ->map(fn ($rows, $category) => [
                    'category' => $category,
                    'label' => TripExpense::CATEGORIES[$category] ?? $category,
                    'total' => round((float) $rows->sum('amount'), 2),
                ])
                ->sortByDesc('total')
                ->values(),
            'categories' => TripExpense::CATEGORIES,
            'trucks' => Truck::where('company_id', $this->companyId())
                ->orderBy('plate_number')->get(['id', 'plate_number', 'name', 'status']),
            'drivers' => Driver::where('company_id', $this->companyId())
                ->active()->orderBy('name')->get(['id', 'name']),
            'clients' => TripClient::where('company_id', $this->companyId())
                ->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeLogistics();

        $validated = $this->validated($request);

        $trip = DB::transaction(function () use ($validated) {
            return Trip::create([
                ...$validated,
                'company_id' => $this->companyId(),
                // Locked inside this transaction so two trips recorded at once
                // cannot both claim the same number.
                'sequence' => Trip::nextSequence($this->companyId()),
                'status' => Trip::IN_TRANSIT,
                'user_id' => auth()->id(),
            ]);
        });

        // Straight to the trip, because the next thing anyone does is start
        // adding what it cost.
        return redirect()
            ->route('logistics.trips.show', $trip)
            ->with('success', "Trip {$trip->reference()} recorded.");
    }

    public function update(Request $request, Trip $trip): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwns($trip);

        $trip->update($this->validated($request));

        return back()->with('success', 'Trip updated.');
    }

    /** Delivered, cancelled, or back on the road. */
    public function updateStatus(Request $request, Trip $trip): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwns($trip);

        $validated = $request->validate([
            'status' => ['required', Rule::in(Trip::STATUSES)],
            'delivered_at' => ['nullable', 'date', 'after_or_equal:'.$trip->dispatched_at->toDateString()],
        ]);

        $trip->update([
            'status' => $validated['status'],
            // Arriving stamps the date; un-delivering clears it rather than
            // leaving a delivery date on a journey still on the road.
            'delivered_at' => $validated['status'] === Trip::DELIVERED
                ? ($validated['delivered_at'] ?? now()->toDateString())
                : null,
        ]);

        return back()->with('success', match ($validated['status']) {
            Trip::DELIVERED => 'Trip marked delivered.',
            Trip::CANCELLED => 'Trip cancelled.',
            default => 'Trip is back on the road.',
        });
    }

    public function destroy(Trip $trip): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwns($trip);

        $reference = $trip->reference();
        // Expenses and payments cascade — they have no meaning without it.
        $trip->delete();

        return redirect()
            ->route('logistics.trips.index')
            ->with('success', "Trip {$reference} deleted.");
    }

    /** @return \Illuminate\Database\Eloquent\Builder<Trip> */
    private function filtered(array $filters)
    {
        return Trip::query()
            ->where('company_id', $this->companyId())
            ->when($filters['from_date'] ?? null, fn (Builder $q, $d) => $q->whereDate('dispatched_at', '>=', $d))
            ->when($filters['to_date'] ?? null, fn (Builder $q, $d) => $q->whereDate('dispatched_at', '<=', $d))
            ->when($filters['status'] ?? null, fn (Builder $q, $s) => $q->where('status', $s))
            ->when($filters['truck_id'] ?? null, fn (Builder $q, $id) => $q->where('truck_id', $id))
            ->when($filters['search'] ?? null, fn (Builder $q, $term) => $q->where(function (Builder $inner) use ($term) {
                $inner->where('origin', 'like', "%{$term}%")
                    ->orWhere('destination', 'like', "%{$term}%")
                    ->orWhere('cargo', 'like', "%{$term}%")
                    ->orWhereRelation('client', 'name', 'like', "%{$term}%")
                    ->orWhereRelation('truck', 'plate_number', 'like', "%{$term}%");
            }));
    }

    /** @return array<string,mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            // Each of these must belong to the caller's own company — without
            // it a hand-rolled request could hang a trip off another
            // company's lorry and quietly read its plate on this screen.
            'truck_id' => [
                'required',
                Rule::exists('trucks', 'id')->where('company_id', $this->companyId()),
            ],
            'trip_client_id' => [
                'required',
                Rule::exists('trip_clients', 'id')->where('company_id', $this->companyId()),
            ],
            'driver_id' => [
                'nullable',
                Rule::exists('drivers', 'id')->where('company_id', $this->companyId()),
            ],
            'origin' => ['required', 'string', 'max:80'],
            'destination' => ['required', 'string', 'max:80'],
            'cargo' => ['nullable', 'string', 'max:120'],
            'weight_tons' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'freight_amount' => ['required', 'numeric', 'min:0', 'max:9999999999'],
            'dispatched_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ], [], [
            'truck_id' => 'truck',
            'trip_client_id' => 'client',
            'driver_id' => 'driver',
            'freight_amount' => 'freight',
            'dispatched_at' => 'dispatch date',
        ]);
    }

    private function authorizeOwns(Trip $trip): void
    {
        abort_unless($trip->company_id === $this->companyId(), 403);
    }
}
