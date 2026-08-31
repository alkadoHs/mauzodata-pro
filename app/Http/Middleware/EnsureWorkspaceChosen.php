<?php

namespace App\Http\Middleware;

use App\Support\CurrentBranch;
use App\Support\CurrentWorkspace;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Asks an admin who runs both businesses which one they are opening.
 *
 * A complete no-op for everyone else — which today is everyone, since no
 * branch has logistics switched on until one is deliberately given it.
 */
class EnsureWorkspaceChosen
{
    /**
     * Routes that stay reachable while the choice is pending — the chooser,
     * the endpoint that answers it, and the ways out of a stuck session.
     */
    private const ALLOWED = [
        'workspace.choose',
        'workspace.switch',
        'logout',
        'verification.notice',
        'verification.verify',
        'verification.send',
        'password.confirm',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // One question at a time: the branch chooser comes first, and asking
        // both at once would leave neither answerable.
        if (app(CurrentBranch::class)->mustChoose()) {
            return $next($request);
        }

        if (! app(CurrentWorkspace::class)->mustChoose()) {
            return $next($request);
        }

        if ($request->routeIs(self::ALLOWED)) {
            return $next($request);
        }

        // Remember where they were headed so the choice carries them there.
        if ($request->isMethod('GET') && ! $request->expectsJson()) {
            $request->session()->put('url.intended', $request->fullUrl());
        }

        return redirect()->route('workspace.choose');
    }
}
