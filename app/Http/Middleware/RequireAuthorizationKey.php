<?php

namespace App\Http\Middleware;

use App\Models\AuthorizationKey;
use App\Support\AuthorizationKeys;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates a critical action behind an authorization key.
 *
 * This is the only real check — the old client-side prompt compared against a
 * key compiled into the JS bundle and merely blocked navigation, so the update
 * dialog and direct requests bypassed it entirely. Enforcing on the mutation
 * covers every path at once.
 *
 * Usage: ->middleware('auth.key:product.update')
 */
class RequireAuthorizationKey
{
    public function __construct(private readonly AuthorizationKeys $keys) {}

    public function handle(Request $request, Closure $next, string $ability): Response
    {
        $provided = $request->input('authorization_key');

        if ($this->keys->verify($ability, $provided)) {
            return $next($request);
        }

        // A field error so Inertia renders it inline on the prompt rather than
        // throwing up an error page.
        throw ValidationException::withMessages([
            'authorization_key' => $this->message($ability, $provided),
        ]);
    }

    private function message(string $ability, ?string $provided): string
    {
        $label = AuthorizationKey::ABILITIES[$ability] ?? $ability;

        if (blank($provided)) {
            return "An authorization key is required to {$label}.";
        }

        return 'That key is not valid, has expired, or has already been used. '
            .'An admin can issue one in Setup → Authorization keys.';
    }
}
