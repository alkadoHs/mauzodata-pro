<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;
use App\Support\CurrentBranch;
use Illuminate\Http\Request;

trait BuildsSalesReports
{
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
