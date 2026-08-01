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

class CreditSalesReportController extends Controller
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

        return Inertia::render('Reports/CreditSalesReport', [
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
                'Credit Sales Report',
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

        return Excel::download($export, $this->exportFilename('credit-sales-report', $filters).'.xlsx');
    }

    public function pdf(Request $request): HttpResponse
    {
        $filters = $this->reportFilters($request);
        [$rows, $collections, $expenses] = $this->datasets($filters);

        $this->guardPdf($rows, $collections, $expenses);

        $pdf = Pdf::loadView('reports.sales', [
            'title' => 'Credit Sales Report',
            'meta' => $this->report->meta($filters, $this->reportBranchLabel($this->branch), allWhenNoDates: true),
            'rows' => $rows,
            'totals' => $this->report->totals($rows),
            'collections' => $collections,
            'expenses' => $expenses,
            'summary' => $this->report->summary($rows, $collections, $expenses),
        ])->setPaper('a4', 'landscape');

        return $pdf->download($this->exportFilename('credit-sales-report', $filters).'.pdf');
    }

    /**
     * Credit sales, the repayments banked in this window against sales made
     * before it (empty on the default all-dates view), and the window's
     * expenses.
     *
     * @return array{0:\Illuminate\Support\Collection,1:\Illuminate\Support\Collection,2:\Illuminate\Support\Collection}
     */
    private function datasets(array $filters): array
    {
        return [
            $this->report->rows(
                $this->report->query($filters, creditOnly: true, allWhenNoDates: true),
                creditView: true
            ),
            $this->report->collections($filters, allWhenNoDates: true),
            $this->expenses->rows($this->expenses->query($filters, allWhenNoDates: true)),
        ];
    }
}
