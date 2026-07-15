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

class SalesReportController extends Controller
{
    use BuildsSalesReports;

    public function __construct(
        private readonly SalesReport $report,
        private readonly CurrentBranch $branch,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->reportFilters($request);
        $rows = $this->report->rows($this->report->query($filters));

        return Inertia::render('Reports/SalesReport', [
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
        $rows = $this->report->rows($this->report->query($filters));

        $export = new ReportExport(
            $this->report->headings(),
            $this->report->orderedRows($rows),
            'Sales Report',
        );

        return Excel::download($export, $this->exportFilename('sales-report', $filters).'.xlsx');
    }

    public function pdf(Request $request): HttpResponse
    {
        $filters = $this->reportFilters($request);
        $rows = $this->report->rows($this->report->query($filters));

        $pdf = Pdf::loadView('reports.sales', [
            'title' => 'Sales Report',
            'meta' => $this->report->meta($filters, $this->reportBranchLabel($this->branch)),
            'rows' => $rows,
            'totals' => $this->report->totals($rows),
        ])->setPaper('a4', 'landscape');

        return $pdf->download($this->exportFilename('sales-report', $filters).'.pdf');
    }
}
