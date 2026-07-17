<?php

namespace App\Http\Controllers;

use App\Exports\ReportExport;
use App\Http\Controllers\Concerns\BuildsSalesReports;
use App\Support\CurrentBranch;
use App\Support\ExpenseReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class ExpensesReportController extends Controller
{
    use BuildsSalesReports;

    public function __construct(
        private readonly ExpenseReport $report,
        private readonly CurrentBranch $branch,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->reportFilters($request);
        $rows = $this->report->rows($this->report->query($filters));

        return Inertia::render('Reports/ExpensesReport', [
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
            'Expenses Report',
        );

        return Excel::download($export, $this->exportFilename('expenses-report', $filters).'.xlsx');
    }

    public function pdf(Request $request): HttpResponse
    {
        $filters = $this->reportFilters($request);
        $rows = $this->report->rows($this->report->query($filters));

        $this->guardPdf($rows);
        $totals = $this->report->totals($rows);

        $pdf = Pdf::loadView('reports.table', [
            'title' => 'Expenses Report',
            'meta' => $this->report->meta($filters, $this->reportBranchLabel($this->branch)),
            'headings' => $this->report->headings(),
            'numericFrom' => $this->report->numericFrom(),
            'rows' => $this->report->orderedRows($rows),
            'totalsRow' => [$totals['cost']],
        ])->setPaper('a4', 'portrait');

        return $pdf->download($this->exportFilename('expenses-report', $filters).'.pdf');
    }
}
