<?php

namespace App\Http\Middleware;

use App\Support\CurrentBranch;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Holds an admin or manager at the branch chooser until they say which branch
 * they are working in.
 *
 * Sellers are locked to their own branch and never see this; neither does a
 * company with a single branch. See CurrentBranch::mustChoose().
 */
class EnsureBranchChosen
{
    /**
     * Routes that stay reachable while the choice is pending — the chooser
     * itself, the endpoint that answers it, and the ways out of a stuck
     * session.
     */
    private const ALLOWED = [
        'branch.choose',
        'branch.switch',
        'logout',
        'verification.notice',
        'verification.verify',
        'verification.send',
        'password.confirm',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if (! app(CurrentBranch::class)->mustChoose()) {
            return $next($request);
        }

        if ($request->routeIs(self::ALLOWED)) {
            return $next($request);
        }

        // Remember where they were headed so choosing a branch carries them
        // there rather than dumping them on the dashboard.
        if ($request->isMethod('GET') && ! $request->expectsJson()) {
            $request->session()->put('url.intended', $request->fullUrl());
        }

        return redirect()->route('branch.choose');
    }
}
