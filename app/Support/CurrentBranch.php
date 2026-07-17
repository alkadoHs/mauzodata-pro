<?php

namespace App\Support;

use App\Models\Branch;

/**
 * Single source of truth for the "active branch" a request operates under.
 *
 * Registered as a singleton (see AppServiceProvider) so the resolved id is
 * memoized for the lifetime of one request.
 *
 * Semantics:
 *  - sellers / vendors are always locked to their own branch (session ignored);
 *  - admins / managers may switch to any branch in their company, or to "all"
 *    (the ALL sentinel) which removes the branch filter entirely.
 */
class CurrentBranch
{
    public const ALL = 'all';

    public const SESSION_KEY = 'active_branch_id';

    private bool $resolved = false;

    private ?int $resolvedId = null;

    /**
     * Whether the current user is allowed to switch branches / view "all".
     */
    public function canSwitch(): bool
    {
        $user = auth()->user();

        return $user !== null && in_array($user->role, ['admin', 'manager'], true);
    }

    /**
     * True when the active context is "all branches" (no branch filter).
     */
    public function isAll(): bool
    {
        return $this->id() === null && auth()->check() && ! $this->deniesAll();
    }

    /**
     * Fail-closed guard: a user who cannot switch branches but has no branch of
     * their own (e.g. orphaned by a branch deletion, since users.branch_id is
     * ON DELETE SET NULL) must see NOTHING rather than everything.
     */
    public function deniesAll(): bool
    {
        $user = auth()->user();

        return $user !== null && ! $this->canSwitch() && $user->branch_id === null;
    }

    /**
     * The effective branch id used for READ scoping.
     * Returns null to mean "all branches" (no filter) — only possible for switchers.
     */
    public function id(): ?int
    {
        if ($this->resolved) {
            return $this->resolvedId;
        }

        $this->resolvedId = $this->resolve();
        $this->resolved = true;

        return $this->resolvedId;
    }

    /**
     * The branch id to stamp on NEW records. Never null: in "all" mode we fall
     * back to the user's home branch so writes always land somewhere sensible.
     */
    public function writeBranchId(): ?int
    {
        return $this->id() ?? auth()->user()?->branch_id;
    }

    /**
     * The active Branch model, or null when in "all" mode / unauthenticated.
     */
    public function branch(): ?Branch
    {
        $id = $this->id();

        return $id !== null ? Branch::find($id) : null;
    }

    /**
     * The raw value to expose to the frontend: a branch id, or the ALL sentinel.
     */
    public function shareValue(): int|string|null
    {
        if (! auth()->check()) {
            return null;
        }

        return $this->id() ?? self::ALL;
    }

    /**
     * Whether the given branch id belongs to the current user's company.
     */
    public function isValidBranch(int $branchId): bool
    {
        $user = auth()->user();

        return $user !== null
            && Branch::where('id', $branchId)
                ->where('company_id', $user->company_id)
                ->exists();
    }

    /**
     * Clear the memoized value (used right after a switch within the same request).
     */
    public function forget(): void
    {
        $this->resolved = false;
        $this->resolvedId = null;
    }

    private function resolve(): ?int
    {
        $user = auth()->user();

        if ($user === null) {
            return null;
        }

        // Non-switchers can never leave their own branch.
        if (! $this->canSwitch()) {
            return $user->branch_id;
        }

        $value = session(self::SESSION_KEY);

        if ($value === self::ALL) {
            return null;
        }

        if ($value !== null && $this->isValidBranch((int) $value)) {
            return (int) $value;
        }

        // Default: the switcher's own home branch.
        return $user->branch_id;
    }
}
