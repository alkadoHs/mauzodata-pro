<?php

namespace App\Models\Scopes;

use App\Support\CurrentBranch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class BranchScope implements Scope
{
    /**
     * Constrain the query to the active branch.
     *
     * - Unauthenticated context (console, seeders, login) → no constraint.
     * - "All branches" mode (admins/managers) → no constraint.
     * - Otherwise → filter by the active branch id (table-qualified so it stays
     *   safe inside joins and whereHas subqueries).
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (! auth()->check()) {
            return;
        }

        $branchId = app(CurrentBranch::class)->id();

        if ($branchId === null) {
            return;
        }

        $builder->where($model->getTable().'.branch_id', $branchId);
    }
}
