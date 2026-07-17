<?php

namespace App\Http\Middleware;

use App\Models\Branch;
use App\Support\CurrentBranch;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $currentBranch = app(CurrentBranch::class);
        $user = $request->user();
        $canSwitch = $currentBranch->canSwitch();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'success' => session('success'),
                'error' => session('error'),
                'info' => session('info'),
                // Flashed once by AuthorizationKeyController@store — the only
                // moment a key's plaintext is ever available.
                'newKey' => session('newKey'),
                // Active branch context for the branch switcher.
                'activeBranch' => $user ? $currentBranch->shareValue() : null,
                'branch' => $user ? $currentBranch->branch() : null,
                'canSwitchBranches' => $canSwitch,
                'branches' => $canSwitch
                    ? Branch::where('company_id', $user->company_id)->orderBy('name')->get()
                    : [],
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
