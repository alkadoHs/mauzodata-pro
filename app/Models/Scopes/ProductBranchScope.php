<?php

namespace App\Models\Scopes;

use App\Support\CurrentBranch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Branch scope for models that have no branch_id of their own but belong to a
 * Product (e.g. NewStock). Constrains the query to rows whose parent product
 * lives in the active branch.
 *
 * Same guard rails as BranchScope: unauthenticated or "all branches" → no filter.
 * The model MUST define a `product` belongsTo relation.
 */
class ProductBranchScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (! auth()->check()) {
            return;
        }

        $current = app(CurrentBranch::class);

        // Fail closed: a branchless non-switcher sees nothing.
        if ($current->deniesAll()) {
            $builder->whereRaw('1 = 0');

            return;
        }

        $branchId = $current->id();

        if ($branchId === null) {
            return;
        }

        $builder->whereHas('product', function (Builder $query) use ($branchId) {
            $query->where('products.branch_id', $branchId);
        });
    }
}
