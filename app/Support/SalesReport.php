<?php

namespace App\Support;

use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Builds the Sales / Credit-Sales report datasets.
 *
 * Domain rules (verified against the data):
 *  - Total = SUM(order_items.total)   [quantity * price]
 *  - GP    = SUM(order_items.profit)  [(price - buy_price) * quantity]
 *  - Paid  = credit order -> SUM(credit_sale_payments.amount) (incl. down payment)
 *            paid order   -> Total (fully paid by definition; order.paid is unreliable)
 *  - Due   = Total - Paid
 *
 * Branch isolation is automatic: Order is branch-scoped, so every query here
 * respects the active branch (or aggregates across all when "All" is selected).
 */
class SalesReport
{
    /**
     * @param  array{from_date?:string,to_date?:string,user_id?:int|string}  $filters
     * @param  bool  $allWhenNoDates  when true and no dates are given, don't restrict
     *                                 by date (show everything); otherwise default to today.
     */
    public function query(array $filters, bool $creditOnly = false, bool $allWhenNoDates = false): Builder
    {
        [$from, $to] = $this->resolveDates($filters, $allWhenNoDates);

        return Order::query()
            ->when($creditOnly, fn (Builder $q) => $q->where('status', 'credit'))
            ->with([
                'branch:id,name',
                'customer:id,name',
                'user:id,name',
                'creditSale:id,order_id,status',
            ])
            ->withSum('orderItems as total_amount', 'total')
            ->withSum('orderItems as gross_profit', 'profit')
            ->withSum('creditSalePayments as credit_paid', 'amount')
            ->when($from, fn (Builder $q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('created_at', '<=', $to))
            ->when(
                ! empty($filters['user_id']) && is_numeric($filters['user_id']),
                fn (Builder $q) => $q->where('user_id', $filters['user_id'])
            )
            ->latest();
    }

    /**
     * Map orders into flat report rows.
     */
    public function rows(Builder $query, bool $creditView = false): Collection
    {
        return $query->get()->map(fn (Order $o) => $this->row($o, $creditView));
    }

    public function row(Order $order, bool $creditView = false): array
    {
        $total = (float) ($order->total_amount ?? 0);
        $gp = (float) ($order->gross_profit ?? 0);
        $paid = $order->status === 'credit'
            ? (float) ($order->credit_paid ?? 0)
            : $total;

        return [
            'id' => $order->id,
            'date' => optional($order->created_at)->format('Y-m-d H:i'),
            'branch' => $order->branch?->name,
            'customer' => $order->customer?->name ?? 'Walk-in',
            'seller' => $order->user?->name,
            // Sales view shows order status; credit view shows the debt status.
            'status' => $creditView
                ? ($order->creditSale?->status ?? $order->status)
                : $order->status,
            'total' => round($total, 2),
            'paid' => round($paid, 2),
            'due' => round($total - $paid, 2),
            'gp' => round($gp, 2),
        ];
    }

    /**
     * Grand totals across the mapped rows.
     */
    public function totals(Collection $rows): array
    {
        return [
            'total' => round($rows->sum('total'), 2),
            'paid' => round($rows->sum('paid'), 2),
            'due' => round($rows->sum('due'), 2),
            'gp' => round($rows->sum('gp'), 2),
            'count' => $rows->count(),
        ];
    }

    /**
     * Column headings for exports (order matches orderedRows()).
     *
     * @return array<int,string>
     */
    public function headings(): array
    {
        return ['Date', 'Branch', 'Customer', 'Seller', 'Status', 'Total', 'Paid', 'Due', 'GP'];
    }

    /**
     * Flatten report rows into ordered numeric rows for spreadsheet export.
     *
     * @return array<int,array<int,mixed>>
     */
    public function orderedRows(Collection $rows): array
    {
        return $rows->map(fn (array $r) => [
            $r['date'],
            $r['branch'],
            $r['customer'],
            $r['seller'],
            $r['status'],
            $r['total'],
            $r['paid'],
            $r['due'],
            $r['gp'],
        ])->values()->all();
    }

    /**
     * Human-readable header metadata for the PDF.
     */
    public function meta(array $filters, string $branchLabel, bool $allWhenNoDates = false): array
    {
        [$from, $to] = $this->resolveDates($filters, $allWhenNoDates);

        $range = match (true) {
            ! $from && ! $to => 'All dates',
            $from === $to => (string) $from,
            default => ($from ?? '…').' → '.($to ?? '…'),
        };

        return [
            'Branch' => $branchLabel,
            'Date range' => $range,
            'Generated' => Carbon::now()->format('Y-m-d H:i'),
        ];
    }

    /**
     * Resolve the applied date range.
     *  - explicit from/to → use them (either side may be null / open-ended);
     *  - no dates + $allWhenNoDates → [null, null] (unbounded);
     *  - no dates otherwise → default to today (matches existing reports).
     *
     * @return array{0:?string,1:?string}
     */
    public function resolveDates(array $filters, bool $allWhenNoDates = false): array
    {
        $from = ! empty($filters['from_date']) ? Carbon::parse($filters['from_date'])->toDateString() : null;
        $to = ! empty($filters['to_date']) ? Carbon::parse($filters['to_date'])->toDateString() : null;

        if (! $from && ! $to && ! $allWhenNoDates) {
            $from = $to = Carbon::today()->toDateString();
        }

        return [$from, $to];
    }
}
