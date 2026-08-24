<?php

namespace App\Support;

use App\Models\ExpenseItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Flat expense-item report: one row per line item, plus a breakdown of the
 * same window by category — how much went on Chakula, Mafuta, and so on.
 *
 * Branch isolation: ExpenseItem has no branch_id, so it's constrained through
 * its (branch-scoped) expense — whereHas('expense') applies Expense's BranchScope.
 */
class ExpenseReport
{
    public function __construct(private readonly SalesReport $dates) {}

    /**
     * @param  array{from_date?:string,to_date?:string,user_id?:int|string,category_id?:string}  $filters
     */
    public function query(array $filters, bool $allWhenNoDates = false): Builder
    {
        // Timestamp bounds, not whereDate() — see SalesReport::dateBounds().
        [$from, $to] = $this->dates->dateBounds($filters, $allWhenNoDates);

        return ExpenseItem::query()
            ->whereHas('expense')
            ->with(['expense.user:id,name', 'expense.branch:id,name', 'expenseCategory:id,name'])
            ->when($from, fn (Builder $q) => $q->where('expense_items.created_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->where('expense_items.created_at', '<=', $to))
            ->when(
                ! empty($filters['user_id']) && is_numeric($filters['user_id']),
                fn (Builder $q) => $q->whereRelation('expense', 'user_id', $filters['user_id'])
            )
            // Drill-down from the category breakdown below. 'none' is the
            // uncategorised bucket — everything recorded before categories
            // existed, or anything that lost its category since.
            ->when(
                ! empty($filters['category_id']),
                fn (Builder $q) => $filters['category_id'] === 'none'
                    ? $q->whereNull('expense_category_id')
                    : $q->where('expense_category_id', $filters['category_id'])
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
            'category' => $i->expenseCategory?->name ?? 'Uncategorised',
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

    /**
     * How this window's spending splits by category — the answer to "how
     * much did I use on Chakula this month". Always the full picture (every
     * category, regardless of any category_id drill-down filter on the
     * itemized rows above), sorted highest spend first.
     *
     * A separate aggregate query rather than grouping the rows collection in
     * memory: it stays correct independent of whatever category the itemized
     * table is currently narrowed to, and GROUP BY does the summing where
     * it's cheap to do it.
     *
     * @param  array{from_date?:string,to_date?:string,user_id?:int|string}  $filters
     * @return Collection<int,array{id:int|string,name:string,cost:float,count:int,percent:float}>
     */
    public function categoryTotals(array $filters, bool $allWhenNoDates = false): Collection
    {
        [$from, $to] = $this->dates->dateBounds($filters, $allWhenNoDates);

        $rows = ExpenseItem::query()
            ->select('expense_category_id', DB::raw('SUM(cost) as total'), DB::raw('COUNT(*) as line_count'))
            ->whereHas('expense')
            ->when($from, fn (Builder $q) => $q->where('expense_items.created_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->where('expense_items.created_at', '<=', $to))
            ->when(
                ! empty($filters['user_id']) && is_numeric($filters['user_id']),
                fn (Builder $q) => $q->whereRelation('expense', 'user_id', $filters['user_id'])
            )
            ->groupBy('expense_category_id')
            ->with('expenseCategory:id,name')
            ->get();

        $grandTotal = (float) $rows->sum('total');

        return $rows
            ->map(fn ($row) => [
                // 'none' mirrors the sentinel query() reads back — a plain
                // null here would collapse to an empty string once it round
                // trips through an Inertia prop / query string.
                'id' => $row->expense_category_id ?? 'none',
                'name' => $row->expenseCategory?->name ?? 'Uncategorised',
                'cost' => round((float) $row->total, 2),
                'count' => (int) $row->line_count,
                'percent' => $grandTotal > 0 ? round(((float) $row->total / $grandTotal) * 100, 1) : 0.0,
            ])
            ->sortByDesc('cost')
            ->values();
    }

    /**
     * @return array<int,string>
     *
     * Deliberately still 5 columns, no Category — this is also what
     * SalesReportController embeds as the "Expenses" sheet inside the Sales
     * Report, a document this change has no business reshaping. The Expenses
     * Report itself uses headingsWithCategory() below instead.
     */
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

    /**
     * The Expenses Report's own flat sheet/table — headings() plus Category,
     * kept separate so SalesReportController's embedded sheet is untouched.
     *
     * @return array<int,string>
     */
    public function headingsWithCategory(): array
    {
        return ['Date', 'Branch', 'Spent by', 'Category', 'Item', 'Cost'];
    }

    /** @return array<int,array<int,mixed>> */
    public function orderedRowsWithCategory(Collection $rows): array
    {
        return $rows->map(fn (array $r) => [
            $r['date'],
            $r['branch'],
            $r['user'],
            $r['category'],
            $r['item'],
            $r['cost'],
        ])->values()->all();
    }

    /** @return array<int,string> */
    public function categoryHeadings(): array
    {
        return ['Category', 'Amount', 'Items', '% of total'];
    }

    /** @return array<int,array<int,mixed>> */
    public function orderedCategoryRows(Collection $categories): array
    {
        return $categories->map(fn (array $c) => [
            $c['name'],
            $c['cost'],
            $c['count'],
            $c['percent'],
        ])->values()->all();
    }

    public function meta(array $filters, string $branchLabel, bool $allWhenNoDates = false): array
    {
        return $this->dates->meta($filters, $branchLabel, $allWhenNoDates);
    }
}
