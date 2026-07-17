<?php

namespace App\Support;

use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Sales aggregated per product — what actually sold, and what it earned.
 *
 * Uses the generated columns on order_items:
 *   total           = quantity * price
 *   total_buy_price = buy_price * quantity
 *   profit          = (price - buy_price) * quantity
 *
 * Branch isolation is automatic: OrderItem carries OrderBranchScope, so every
 * aggregate here respects the active branch (or spans all under "All").
 */
class ProductSalesReport
{
    public function __construct(private readonly SalesReport $dates) {}

    /**
     * @param  array{from_date?:string,to_date?:string,user_id?:int|string}  $filters
     */
    public function query(array $filters, bool $allWhenNoDates = false): Builder
    {
        [$from, $to] = $this->dates->resolveDates($filters, $allWhenNoDates);

        return OrderItem::query()
            ->select(
                'product_id',
                DB::raw('SUM(quantity) as qty'),
                DB::raw('SUM(total) as sales'),
                DB::raw('SUM(total_buy_price) as cost'),
                DB::raw('SUM(profit) as gp'),
                DB::raw('COUNT(DISTINCT order_id) as orders_count'),
            )
            ->with('product:id,name,unit')
            ->when($from, fn (Builder $q) => $q->whereDate('order_items.created_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('order_items.created_at', '<=', $to))
            ->when(
                ! empty($filters['user_id']) && is_numeric($filters['user_id']),
                fn (Builder $q) => $q->whereRelation('order', 'user_id', $filters['user_id'])
            )
            ->groupBy('product_id')
            ->orderByDesc('sales');
    }

    public function rows(Builder $query): Collection
    {
        return $query->get()->map(fn (OrderItem $i) => [
            'id' => $i->product_id,
            // The product relation bypasses BranchScope, so cross-branch history
            // still resolves its name rather than coming back null.
            'product' => $i->product?->name ?? '—',
            'unit' => $i->product?->unit ?? '',
            'orders' => (int) $i->orders_count,
            'qty' => round((float) $i->qty, 2),
            'sales' => round((float) $i->sales, 2),
            'cost' => round((float) $i->cost, 2),
            'gp' => round((float) $i->gp, 2),
        ]);
    }

    public function totals(Collection $rows): array
    {
        return [
            'qty' => round($rows->sum('qty'), 2),
            'sales' => round($rows->sum('sales'), 2),
            'cost' => round($rows->sum('cost'), 2),
            'gp' => round($rows->sum('gp'), 2),
            'count' => $rows->count(),
        ];
    }

    /** @return array<int,string> */
    public function headings(): array
    {
        return ['Product', 'Unit', 'Orders', 'Qty sold', 'Sales', 'Cost', 'GP'];
    }

    public function numericFrom(): int
    {
        return 2;
    }

    /** @return array<int,array<int,mixed>> */
    public function orderedRows(Collection $rows): array
    {
        return $rows->map(fn (array $r) => [
            $r['product'],
            $r['unit'],
            $r['orders'],
            $r['qty'],
            $r['sales'],
            $r['cost'],
            $r['gp'],
        ])->values()->all();
    }

    public function meta(array $filters, string $branchLabel, bool $allWhenNoDates = false): array
    {
        return $this->dates->meta($filters, $branchLabel, $allWhenNoDates);
    }
}
