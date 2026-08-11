<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Registration is the system's one-time setup, not an open door.
 *
 * The first person to arrive creates the company and becomes its admin. After
 * that the company exists, and everyone else is added from Employees by
 * someone who already works there — so signing up would only ever create a
 * second, empty company nobody asked for.
 *
 * Enforced on the POST as well as the page, because a hidden link is not a
 * closed door.
 */
class EnsureSetupIsOpen
{
    public function handle(Request $request, Closure $next): Response
    {
        if (self::isOpen()) {
            return $next($request);
        }

        return redirect()
            ->route('login')
            ->with('status', 'This system is already set up. Ask an administrator for an account.');
    }

    /** True only until the first company exists. */
    public static function isOpen(): bool
    {
        return ! Company::query()->exists();
    }
}
