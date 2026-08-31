<?php

namespace App\Http\Controllers\Logistics;

use App\Models\Logistics\TripClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The people whose mizigo the trucks carry.
 *
 * Their own list, not the shop's customers — see TripClient.
 */
class ClientController extends LogisticsController
{
    public function index(): Response
    {
        $this->authorizeLogistics();

        return Inertia::render('Logistics/Clients', [
            'clients' => TripClient::where('company_id', $this->companyId())
                ->orderBy('name')
                ->get(['id', 'name', 'phone', 'notes']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeLogistics();

        TripClient::create([
            ...$this->validated($request),
            'company_id' => $this->companyId(),
        ]);

        return back()->with('success', 'Client added.');
    }

    public function update(Request $request, TripClient $client): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwns($client);

        $client->update($this->validated($request));

        return back()->with('success', 'Client updated.');
    }

    public function destroy(TripClient $client): RedirectResponse
    {
        $this->authorizeLogistics();
        $this->authorizeOwns($client);

        $client->delete();

        return back()->with('success', 'Client removed.');
    }

    /** @return array<string,mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:80'],
            'phone' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);
    }

    private function authorizeOwns(TripClient $client): void
    {
        abort_unless($client->company_id === $this->companyId(), 403);
    }
}
