<?php

namespace App\Http\Controllers;

use App\Exports\MultiSheetExport;
use App\Exports\ReportExport;
use App\Http\Controllers\Concerns\BuildsSalesReports;
use App\Support\CurrentBranch;
use App\Support\ExpenseReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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
        $filters = $this->filters($request);
        $rows = $this->report->rows($this->report->query($filters));
        $categories = $this->report->categoryTotals($filters);

        return Inertia::render('Reports/ExpensesReport', [
            'rows' => $rows,
            'totals' => $this->report->totals($rows),
            'categories' => $categories,
            'filters' => $filters,
            'sellers' => $this->reportSellers($this->branch),
            'branchLabel' => $this->reportBranchLabel($this->branch),
        ]);
    }

    public function excel(Request $request): BinaryFileResponse
    {
        $filters = $this->filters($request);
        $rows = $this->report->rows($this->report->query($filters));
        $categories = $this->report->categoryTotals($filters);

        $export = new MultiSheetExport([
            new ReportExport(
                $this->report->headingsWithCategory(),
                $this->report->orderedRowsWithCategory($rows),
                'Expenses Report',
            ),
            new ReportExport(
                $this->report->categoryHeadings(),
                $this->report->orderedCategoryRows($categories),
                'By Category',
            ),
        ]);

        return Excel::download($export, $this->exportFilename('expenses-report', $filters).'.xlsx');
    }

    public function pdf(Request $request): HttpResponse
    {
        $filters = $this->filters($request);
        $rows = $this->report->rows($this->report->query($filters));
        $categories = $this->report->categoryTotals($filters);

        $this->guardPdf($rows, $categories);

        $pdf = Pdf::loadView('reports.expenses', [
            'title' => 'Expenses Report',
            'meta' => $this->report->meta($filters, $this->reportBranchLabel($this->branch)),
            'rows' => $rows,
            'totals' => $this->report->totals($rows),
            'categories' => $categories,
        ])->setPaper('a4', 'portrait');

        return $pdf->download($this->exportFilename('expenses-report', $filters).'.pdf');
    }

    /**
     * reportFilters() plus the category drill-down, which is specific to this
     * report and has no business in the shared trait every report uses.
     *
     * Anything that isn't the clear-filter sentinel, "none", or a numeric id
     * is dropped rather than passed through — the query only ever compares
     * this value, never executes it, but a filter that silently does nothing
     * on garbage input is more confusing than one that's simply cleared.
     */
    private function filters(Request $request): array
    {
        $filters = $this->reportFilters($request);

        $request->validate(['category_id' => 'nullable|string|max:20']);

        $category = $request->input('category_id');
        $filters['category_id'] = ($category && $category !== 'all' && ($category === 'none' || is_numeric($category)))
            ? $category
            : null;

        return $filters;
    }
}
