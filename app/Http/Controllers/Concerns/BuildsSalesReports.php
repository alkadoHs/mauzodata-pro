<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;
use App\Support\CurrentBranch;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

trait BuildsSalesReports
{
    /**
     * Most rows we'll render into a PDF.
     *
     * dompdf holds the whole document in memory and costs roughly 0.4 MB/row —
     * measured: 500 rows ≈ 212 MB, 1000 ≈ 514 MB, 1500 ≈ 946 MB, and 2000+ dies
     * with an uncatchable crash. Excel has no such problem, so past this we send
     * people there rather than 500-ing.
     */
    protected const PDF_MAX_ROWS = 750;

    /**
     * Call before rendering a PDF: refuses oversized documents and gives dompdf
     * the headroom it needs for the ones we do allow.
     */
    protected function guardPdf(Collection $rows): void
    {
        abort_if(
            $rows->count() > self::PDF_MAX_ROWS,
            422,
            "This range has {$rows->count()} rows — too many for a PDF (limit ".self::PDF_MAX_ROWS.
            "). Narrow the dates, or use the Excel export which has no limit."
        );

        ini_set('memory_limit', '512M');
    }

    protected function reportFilters(Request $request): array
    {
        // Treat non-numeric seller sentinels (e.g. "all") as no filter so a
        // shared/typed URL never fails validation and silently drops the filters.
        if (! is_numeric($request->input('user_id'))) {
            $request->merge(['user_id' => null]);
        }

        $request->validate([
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
            'user_id' => 'nullable|integer',
        ]);

        return $request->only(['from_date', 'to_date', 'user_id']);
    }

    /** Sellers available for the filter dropdown, limited to the active branch. */
    protected function reportSellers(CurrentBranch $branch)
    {
        $branchId = $branch->id();

        return User::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    protected function reportBranchLabel(CurrentBranch $branch): string
    {
        return $branch->isAll()
            ? 'All branches'
            : ($branch->branch()?->name ?? 'Current branch');
    }

    protected function exportFilename(string $base, array $filters): string
    {
        $suffix = ($filters['from_date'] ?? 'today');
        if (! empty($filters['to_date']) && $filters['to_date'] !== ($filters['from_date'] ?? null)) {
            $suffix .= '_to_'.$filters['to_date'];
        }

        return "{$base}_{$suffix}";
    }
}
