<?php

namespace App\Support;

use App\Models\ExpenseItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Flat expense-item report: one row per line item.
 *
 * Branch isolation: ExpenseItem has no branch_id, so it's constrained through
 * its (branch-scoped) expense — whereHas('expense') applies Expense's BranchScope.
 */
class ExpenseReport
{
    public function __construct(private readonly SalesReport $dates) {}

    /**
     * @param  array{from_date?:string,to_date?:string,user_id?:int|string}  $filters
     */
    public function query(array $filters, bool $allWhenNoDates = false): Builder
    {
        [$from, $to] = $this->dates->resolveDates($filters, $allWhenNoDates);

        return ExpenseItem::query()
            ->whereHas('expense')
            ->with(['expense.user:id,name', 'expense.branch:id,name'])
            ->when($from, fn (Builder $q) => $q->whereDate('expense_items.created_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('expense_items.created_at', '<=', $to))
            ->when(
                ! empty($filters['user_id']) && is_numeric($filters['user_id']),
                fn (Builder $q) => $q->whereRelation('expense', 'user_id', $filters['user_id'])
            )
            ->latest('expense_items.created_at');
    }

    public function rows(Builder $query): Collection
    {
        return $query->get()->map(fn (ExpenseItem $i) => [
            'id' => $i->id,
            'date' => optional($i->created_at)->format('Y-m-d H:i'),
            'branch' => $i->expense?->branch?->name,
            'user' => $i->expense?->user?->name,
            'item' => $i->item,
            'cost' => round((float) $i->cost, 2),
        ]);
    }

    public function totals(Collection $rows): array
    {
        return [
            'cost' => round($rows->sum('cost'), 2),
            'count' => $rows->count(),
        ];
    }

    /** @return array<int,string> */
    public function headings(): array
    {
        return ['Date', 'Branch', 'Spent by', 'Item', 'Cost'];
    }

    /** First right-aligned column index (matches headings()). */
    public function numericFrom(): int
    {
        return 4;
    }

    /** @return array<int,array<int,mixed>> */
    public function orderedRows(Collection $rows): array
    {
        return $rows->map(fn (array $r) => [
            $r['date'],
            $r['branch'],
            $r['user'],
            $r['item'],
            $r['cost'],
        ])->values()->all();
    }

    public function meta(array $filters, string $branchLabel, bool $allWhenNoDates = false): array
    {
        return $this->dates->meta($filters, $branchLabel, $allWhenNoDates);
    }
}
