<?php

namespace App\Http\Controllers\Logistics;

use App\Support\Logistics\ProfitReport;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * What the business made — the question the whole system was built to answer.
 */
class ProfitReportController extends LogisticsController
{
    public function index(Request $request): Response
    {
        $this->authorizeLogistics();

        $filters = $request->validate([
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date'],
        ]);

        // This month by default: the question is nearly always "how are we
        // doing", and an all-time figure answers a different one.
        $from = isset($filters['from_date'])
            ? Carbon::parse($filters['from_date'])
            : Carbon::now()->startOfMonth();
        $to = isset($filters['to_date'])
            ? Carbon::parse($filters['to_date'])
            : Carbon::now()->endOfMonth();

        // A backwards range would silently report zero of everything, which
        // reads as a business that did nothing rather than a typo.
        if ($to->lessThan($from)) {
            [$from, $to] = [$to, $from];
        }

        $report = (new ProfitReport($this->companyId(), $from, $to))->build();

        return Inertia::render('Logistics/Profit', [
            ...$report,
            'filters' => [
                'from_date' => $from->toDateString(),
                'to_date' => $to->toDateString(),
            ],
        ]);
    }
}
