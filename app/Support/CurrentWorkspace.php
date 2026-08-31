<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Which of the two systems this session is working in.
 *
 * The shop and the haulage business are separate businesses that happen to
 * share a login. They share no tables, no reports and no records; this class
 * is the only thing that decides which one you are looking at.
 *
 * Deliberately knows nothing about the shop's branches. The haulage business
 * is not a branch of the shop and does not sit inside one — so changing branch
 * in the shop, or browsing "all branches", cannot move, split or hide a single
 * shilling of the trucks' money. The only thing the two share is a company.
 *
 * This code ships only to the deployment that runs a haulage business, which
 * is why there is no feature flag: having the system installed IS the flag.
 *
 * Registered as a singleton (see AppServiceProvider).
 */
class CurrentWorkspace
{
    public const SHOP = 'shop';

    public const LOGISTICS = 'logistics';

    public const SESSION_KEY = 'active_workspace';

    /**
     * Whether this user has a haulage business to look at.
     *
     * Admins only: separate business, separate money, no part in it for the
     * shop's managers or sellers.
     */
    public function isAvailable(): bool
    {
        return auth()->user()?->role === 'admin';
    }

    /** The company every logistics record belongs to. */
    public function companyId(): ?int
    {
        return auth()->user()?->company_id;
    }

    /**
     * Whether the user has to say which system they are opening.
     *
     * Asked once per session — see EnsureWorkspaceChosen.
     */
    public function mustChoose(): bool
    {
        return $this->isAvailable() && ! session()->has(self::SESSION_KEY);
    }

    /**
     * The workspace this session is in.
     *
     * Falls back to the shop, which is what everybody had before this existed.
     */
    public function current(): string
    {
        if (! $this->isAvailable()) {
            return self::SHOP;
        }

        return session(self::SESSION_KEY) === self::LOGISTICS
            ? self::LOGISTICS
            : self::SHOP;
    }

    /**
     * The workspace to present for a given request.
     *
     * A logistics page is in the logistics workspace whatever the session says
     * — otherwise opening a bookmarked trip while the session is on the shop
     * would show the shop's menu wrapped around a truck.
     */
    public function forRequest(Request $request): string
    {
        if ($this->isAvailable() && $request->routeIs('logistics.*')) {
            return self::LOGISTICS;
        }

        return $this->current();
    }

    public function isLogistics(): bool
    {
        return $this->current() === self::LOGISTICS;
    }

    /** Where each workspace starts. */
    public function landingRoute(string $workspace): string
    {
        return $workspace === self::LOGISTICS
            ? route('logistics.home', absolute: false)
            : route('dashboard', absolute: false);
    }
}
