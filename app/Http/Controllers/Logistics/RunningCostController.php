<?php

namespace App\Http\Controllers\Logistics;

use App\Models\Logistics\RunningCost;
use App\Models\Logistics\Truck;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The costs of being in business rather than of any one journey.
 *
 * Without these the profit figure is trip margin wearing a bigger word.
 */
class RunningCostController extends LogisticsController
{
    public function index(Request $request): Response
    {
        $this->authorizeLogistics();

        $filters = $request->validate([
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date'],
        ]);

        $costs = RunningCost::query()
            ->where('company_id', $this->companyId())
            ->with('truck:id,plate_number')
            ->when($filters['from_date'] ?? null, fn ($q, $d) => $q->whereDate('spent_at', '>=', $d))
            ->when($filters['to_date'] ?? null, fn ($q, $d) => $q->whereDate('spent_at', '<=', $d))
            ->orderByDesc('spent_at')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Logistics/RunningCosts', [
            'costs' => $costs->map(fn (RunningCost $c) => [
                'id' => $c->id,
                'category' => $c->category,
                'category_label' => $c->categoryLabel(),
                'amount' => (float) $c->amount,
                'description' => $c->description,
                'spent_at' => $c->spent_at?->toDateString(),
                'truck' => $c->truck?->plate_number,
            ]),
            'total' => round($costs->sum(fn (RunningCost $c) => (float) $c->amount), 2),
            'categories' => RunningCost::CATEGORIES,
            'trucks' => Truck::where('company_id', $this->companyId())
                ->orderBy('plate_number')->get(['id', 'plate_number', 'name']),
            'filters' => [
                'from_date' => $filters['from_date'] ?? null,
                'to_date' => $filters['to_date'] ?? null,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeLogistics();

        RunningCost::create([
            ...$this->validated($request),
            'company_id' => $this->companyId(),
            'user_id' => auth()->id(),
        ]);

        return back()->with('success', 'Running cost recorded.');
    }

    public function destroy(RunningCost $runningCost): RedirectResponse
    {
        $this->authorizeLogistics();
        abort_unless($runningCost->company_id === $this->companyId(), 403);

        $runningCost->delete();

        return back()->with('success', 'Running cost removed.');
    }

    /** @return array<string,mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'category' => ['required', Rule::in(array_keys(RunningCost::CATEGORIES))],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999'],
            'description' => ['nullable', 'string', 'max:160'],
            'spent_at' => ['required', 'date'],
            // Null means it belongs to the business rather than one lorry.
            'truck_id' => [
                'nullable',
                Rule::exists('trucks', 'id')->where('company_id', $this->companyId()),
            ],
        ], [], ['spent_at' => 'date', 'truck_id' => 'truck']);
    }
}
