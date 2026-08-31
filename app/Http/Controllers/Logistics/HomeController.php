<?php

namespace App\Http\Controllers\Logistics;

use Inertia\Inertia;
use Inertia\Response;

/**
 * The front door of the haulage business.
 *
 * Grows into the overview as the rest of the system lands; for now it is the
 * proof that the two systems are genuinely separate — different menu, nothing
 * of the shop's in sight.
 */
class HomeController extends LogisticsController
{
    public function index(): Response
    {
        $this->authorizeLogistics();

        return Inertia::render('Logistics/Home');
    }
}
