<?php

namespace App\Http\Controllers;

use App\Exports\ReportExport;
use App\Http\Controllers\Concerns\BuildsSalesReports;
use App\Support\CurrentBranch;
use App\Support\SalesReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class CreditSalesReportController extends Controller
{
    use BuildsSalesReports;

    public function __construct(
        private readonly SalesReport $report,
        private readonly CurrentBranch $branch,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->reportFilters($request);
        $rows = $this->creditRows($filters);

        return Inertia::render('Reports/CreditSalesReport', [
            'rows' => $rows,
            'totals' => $this->report->totals($rows),
            'filters' => $filters,
            'sellers' => $this->reportSellers($this->branch),
            'branchLabel' => $this->reportBranchLabel($this->branch),
        ]);
    }

    public function excel(Request $request): BinaryFileResponse
    {
        $filters = $this->reportFilters($request);
        $rows = $this->creditRows($filters);

        $export = new ReportExport(
            $this->report->headings(),
            $this->report->orderedRows($rows),
            'Credit Sales Report',
        );

        return Excel::download($export, $this->exportFilename('credit-sales-report', $filters).'.xlsx');
    }

    public function pdf(Request $request): HttpResponse
    {
        $filters = $this->reportFilters($request);
        $rows = $this->creditRows($filters);

        $this->guardPdf($rows);

        $pdf = Pdf::loadView('reports.sales', [
            'title' => 'Credit Sales Report',
            'meta' => $this->report->meta($filters, $this->reportBranchLabel($this->branch), allWhenNoDates: true),
            'rows' => $rows,
            'totals' => $this->report->totals($rows),
        ])->setPaper('a4', 'landscape');

        return $pdf->download($this->exportFilename('credit-sales-report', $filters).'.pdf');
    }

    /**
     * Credit sales and nothing else.
     *
     * This report answers one question — who owes what — so it deliberately
     * carries no cash collections, no expenses and no net-sales figure. Those
     * belong to the sales report, where the day's money is being counted.
     */
    private function creditRows(array $filters)
    {
        return $this->report->rows(
            $this->report->query($filters, creditOnly: true, allWhenNoDates: true),
            creditView: true
        );
    }
}
