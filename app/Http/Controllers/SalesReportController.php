<?php

namespace App\Http\Controllers;

use App\Exports\MultiSheetExport;
use App\Exports\ReportExport;
use App\Http\Controllers\Concerns\BuildsSalesReports;
use App\Support\CurrentBranch;
use App\Support\ExpenseReport;
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
        private readonly ExpenseReport $expenses,
        private readonly CurrentBranch $branch,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->reportFilters($request);
        [$rows, $collections, $expenses] = $this->datasets($filters);

        return Inertia::render('Reports/SalesReport', [
            'rows' => $rows,
            'totals' => $this->report->totals($rows),
            'collections' => $collections,
            'expenses' => $expenses,
            'summary' => $this->report->summary($rows, $collections, $expenses),
            'filters' => $filters,
            'sellers' => $this->reportSellers($this->branch),
            'branchLabel' => $this->reportBranchLabel($this->branch),
        ]);
    }

    public function excel(Request $request): BinaryFileResponse
    {
        $filters = $this->reportFilters($request);
        [$rows, $collections, $expenses] = $this->datasets($filters);

        $export = new MultiSheetExport([
            new ReportExport(
                $this->report->headings(),
                $this->report->orderedRows($rows),
                'Sales Report',
            ),
            new ReportExport(
                $this->report->collectionHeadings(),
                $this->report->orderedCollectionRows($collections),
                'Credit Collections',
            ),
            new ReportExport(
                $this->expenses->headings(),
                $this->expenses->orderedRows($expenses),
                'Expenses',
            ),
        ]);

        return Excel::download($export, $this->exportFilename('sales-report', $filters).'.xlsx');
    }

    public function pdf(Request $request): HttpResponse
    {
        $filters = $this->reportFilters($request);
        [$rows, $collections, $expenses] = $this->datasets($filters);

        $this->guardPdf($rows, $collections, $expenses);

        $pdf = Pdf::loadView('reports.sales', [
            'title' => 'Sales Report',
            'meta' => $this->report->meta($filters, $this->reportBranchLabel($this->branch)),
            'rows' => $rows,
            'totals' => $this->report->totals($rows),
            'collections' => $collections,
            'expenses' => $expenses,
            'summary' => $this->report->summary($rows, $collections, $expenses),
        ])->setPaper('a4', 'landscape');

        return $pdf->download($this->exportFilename('sales-report', $filters).'.pdf');
    }

    /**
     * The three datasets the report is built from: the sales themselves, the
     * repayments banked in this window against older credit sales, and the
     * expenses spent in the same window.
     *
     * @return array{0:\Illuminate\Support\Collection,1:\Illuminate\Support\Collection,2:\Illuminate\Support\Collection}
     */
    private function datasets(array $filters): array
    {
        return [
            $this->report->rows($this->report->query($filters)),
            $this->report->collections($filters),
            $this->expenses->rows($this->expenses->query($filters)),
        ];
    }
}
