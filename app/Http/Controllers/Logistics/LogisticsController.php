<?php

namespace App\Http\Controllers\Logistics;

use App\Http\Controllers\Controller;
use App\Support\CurrentWorkspace;

/**
 * Shared ground for every logistics screen.
 *
 * Two rules hold across the whole mini-system and are enforced here rather
 * than remembered in each action: only an admin may be here at all, and
 * everything read or written belongs to their company.
 *
 * Note what is absent — no branch. The haulage business does not live inside
 * one of the shop's branches, so nothing here can be moved or hidden by the
 * shop's branch switcher.
 */
abstract class LogisticsController extends Controller
{
    protected function workspace(): CurrentWorkspace
    {
        return app(CurrentWorkspace::class);
    }

    /**
     * The company every logistics record belongs to.
     *
     * Never null past authorizeLogistics(): being signed in as an admin is
     * what got you here.
     */
    protected function companyId(): int
    {
        return $this->workspace()->companyId();
    }

    protected function authorizeLogistics(): void
    {
        abort_unless($this->workspace()->isAvailable(), 403);
    }
}
