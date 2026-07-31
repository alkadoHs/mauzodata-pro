<?php

namespace App\Http\Controllers;

use App\Exports\MultiSheetExport;
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
        $rows = $this->report->rows($this->report->query($filters, creditOnly: true, allWhenNoDates: true), creditView: true);
        // Empty on the default (all-dates) view — nothing predates "all time".
        $collections = $this->report->collections($filters, allWhenNoDates: true);

        return Inertia::render('Reports/CreditSalesReport', [
            'rows' => $rows,
            'totals' => $this->report->totals($rows),
            'collections' => $collections,
            'summary' => $this->report->summary($rows, $collections),
            'filters' => $filters,
            'sellers' => $this->reportSellers($this->branch),
            'branchLabel' => $this->reportBranchLabel($this->branch),
        ]);
    }

    public function excel(Request $request): BinaryFileResponse
    {
        $filters = $this->reportFilters($request);
        $rows = $this->report->rows($this->report->query($filters, creditOnly: true, allWhenNoDates: true), creditView: true);
        $collections = $this->report->collections($filters, allWhenNoDates: true);

        $export = new MultiSheetExport([
            new ReportExport(
                $this->report->headings(),
                $this->report->orderedRows($rows),
                'Credit Sales Report',
            ),
            new ReportExport(
                $this->report->collectionHeadings(),
                $this->report->orderedCollectionRows($collections),
                'Credit Collections',
            ),
        ]);

        return Excel::download($export, $this->exportFilename('credit-sales-report', $filters).'.xlsx');
    }

    public function pdf(Request $request): HttpResponse
    {
        $filters = $this->reportFilters($request);
        $rows = $this->report->rows($this->report->query($filters, creditOnly: true, allWhenNoDates: true), creditView: true);
        $collections = $this->report->collections($filters, allWhenNoDates: true);

        $this->guardPdf($rows, $collections);

        $pdf = Pdf::loadView('reports.sales', [
            'title' => 'Credit Sales Report',
            'meta' => $this->report->meta($filters, $this->reportBranchLabel($this->branch), allWhenNoDates: true),
            'rows' => $rows,
            'totals' => $this->report->totals($rows),
            'collections' => $collections,
            'summary' => $this->report->summary($rows, $collections),
        ])->setPaper('a4', 'landscape');

        return $pdf->download($this->exportFilename('credit-sales-report', $filters).'.pdf');
    }
}
