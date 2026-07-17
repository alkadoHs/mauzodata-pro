<?php

namespace App\Http\Controllers;

use App\Models\AuthorizationKey;
use App\Support\AuthorizationKeys;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AuthorizationKeyController extends Controller
{
    public function __construct(private readonly AuthorizationKeys $keys) {}

    public function index(): Response
    {
        $this->authorizeAdmin();

        return Inertia::render('Settings/AuthorizationKeys', [
            'keys' => AuthorizationKey::where('company_id', auth()->user()->company_id)
                ->with('creator:id,name', 'usedBy:id,name')
                ->latest()
                ->get()
                ->map(fn (AuthorizationKey $k) => [
                    'id' => $k->id,
                    'name' => $k->name,
                    'hint' => $k->hint,
                    'abilities' => $k->abilities,
                    'single_use' => $k->single_use,
                    'expires_at' => $k->expires_at?->toDateString(),
                    'used_at' => $k->used_at?->format('Y-m-d H:i'),
                    'used_by' => $k->usedBy?->name,
                    'created_by' => $k->creator?->name,
                    'created_at' => $k->created_at?->toDateString(),
                    'status' => $k->status(),
                ]),
            'abilities' => AuthorizationKey::ABILITIES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'abilities' => ['required', 'array', 'min:1'],
            'abilities.*' => [Rule::in(array_keys(AuthorizationKey::ABILITIES))],
            'single_use' => ['boolean'],
            'expires_at' => ['nullable', 'date', 'after:today'],
        ], [
            'abilities.required' => 'Choose at least one action this key can authorize.',
            'expires_at.after' => 'The expiry date must be in the future.',
        ]);

        [, $plain] = $this->keys->issue(
            auth()->user()->company_id,
            $validated['name'],
            $validated['abilities'],
            (bool) ($validated['single_use'] ?? false),
            $validated['expires_at'] ?? null,
        );

        // The one and only time the plaintext exists outside the issuer's hands.
        // Flashed, not persisted — a refresh won't show it again.
        return back()->with('newKey', ['name' => $validated['name'], 'key' => $plain]);
    }

    public function destroy(AuthorizationKey $authorizationKey): RedirectResponse
    {
        $this->authorizeAdmin();
        abort_unless($authorizationKey->company_id === auth()->user()->company_id, 403);

        $authorizationKey->delete();

        return back()->with('success', 'Key revoked.');
    }

    /**
     * Admin-only — managers must not issue or revoke keys, otherwise they could
     * mint themselves authorization for the very actions keys are meant to gate.
     */
    private function authorizeAdmin(): void
    {
        abort_unless(auth()->user()?->isAdmin(), 403);
    }
}
