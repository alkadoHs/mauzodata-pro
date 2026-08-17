<?php

namespace App\Support;

use App\Models\CreditSalePayment;
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
 *  - Paid  = credit order -> SUM(credit_sale_payments.amount) RECEIVED INSIDE the
 *            selected date window (incl. the down payment, which is written at
 *            checkout so it always lands on the sale date)
 *            paid order   -> Total (fully paid by definition; order.paid is unreliable)
 *  - Due   = Total - Paid, i.e. the balance as at the end of the window.
 *
 * Money is reported on the day it was actually received. A credit sale made on
 * Monday and cleared on Friday shows only Monday's down payment in Monday's
 * report; Friday's instalment belongs to Friday and reaches that day's report
 * through collections() below. (Paid + Due = Total still holds on every order
 * row: an order's payments can never predate the order, so "received in the
 * window" and "received up to the end of the window" are the same number.)
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
        [$from, $to] = $this->dateBounds($filters, $allWhenNoDates);

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
            // total and profit are generated columns that already net this off;
            // it is summed separately so the report can show what was given away.
            ->withSum('orderItems as discount_given', 'discount')
            // Only the money that came in during the window — a repayment made
            // later belongs to the day it was collected, not to the sale date.
            ->withSum([
                'creditSalePayments as credit_paid' => fn (Builder $q) => $q
                    ->when($from, fn (Builder $p) => $p->where('credit_sale_payments.created_at', '>=', $from))
                    ->when($to, fn (Builder $p) => $p->where('credit_sale_payments.created_at', '<=', $to)),
            ], 'amount')
            ->when($from, fn (Builder $q) => $q->where('orders.created_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->where('orders.created_at', '<=', $to))
            ->when(
                ! empty($filters['user_id']) && is_numeric($filters['user_id']),
                fn (Builder $q) => $q->where('user_id', $filters['user_id'])
            )
            // Finding one debtor among thousands of rows. Grouped so the OR
            // can't escape the branch scope's WHERE.
            ->when(
                ! empty($filters['search']),
                fn (Builder $q) => $q->where(function (Builder $inner) use ($filters) {
                    $term = trim($filters['search']);

                    $inner->whereRelation('customer', 'name', 'like', "%{$term}%")
                        ->orWhere('invoice_number', 'like', "%{$term}%");
                })
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
        $discount = (float) ($order->discount_given ?? 0);
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
            'discount' => round($discount, 2),
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
            'discount' => round($rows->sum('discount'), 2),
            'paid' => round($rows->sum('paid'), 2),
            'due' => round($rows->sum('due'), 2),
            'gp' => round($rows->sum('gp'), 2),
            'count' => $rows->count(),
        ];
    }

    /**
     * Repayments banked inside the window against credit sales made BEFORE it.
     *
     * These are real money-in for the day being closed, but they carry no sale
     * of their own inside the window, so they would otherwise be invisible.
     * Payments on sales made *inside* the window are deliberately excluded —
     * those already sit in that sale's own "Paid" column.
     *
     * The seller filter matches whoever *received* the payment (the person
     * closing their day), not whoever originally made the sale.
     */
    public function collectionsQuery(array $filters, bool $allWhenNoDates = false): Builder
    {
        [$from, $to] = $this->dateBounds($filters, $allWhenNoDates);

        $query = CreditSalePayment::query()
            ->with([
                'user:id,name',
                'creditSale:id,order_id,customer_id,status',
                'creditSale.customer:id,name',
                'creditSale.order:id,branch_id,customer_id,invoice_number,created_at',
                'creditSale.order.branch:id,name',
                'creditSale.order.customer:id,name',
            ]);

        // Without a start date the window is "all time", so no sale predates it
        // and there is nothing to carry over.
        if (! $from) {
            return $query->whereRaw('1 = 0');
        }

        return $query
            // Branch isolation: CreditSale carries OrderBranchScope, so this
            // whereHas keeps us inside the active branch's credit sales.
            ->whereHas('creditSale', fn (Builder $q) => $q->whereHas(
                'order',
                fn (Builder $o) => $o->where('orders.created_at', '<', $from)
            ))
            ->where('credit_sale_payments.created_at', '>=', $from)
            ->when($to, fn (Builder $q) => $q->where('credit_sale_payments.created_at', '<=', $to))
            ->when(
                ! empty($filters['user_id']) && is_numeric($filters['user_id']),
                fn (Builder $q) => $q->where('credit_sale_payments.user_id', $filters['user_id'])
            )
            ->latest('credit_sale_payments.created_at');
    }

    /**
     * @return Collection<int,array<string,mixed>>
     */
    public function collections(array $filters, bool $allWhenNoDates = false): Collection
    {
        return $this->collectionsQuery($filters, $allWhenNoDates)
            ->get()
            ->map(fn (CreditSalePayment $p) => $this->collectionRow($p));
    }

    public function collectionRow(CreditSalePayment $payment): array
    {
        $order = $payment->creditSale?->order;

        return [
            'id' => $payment->id,
            'date' => optional($payment->created_at)->format('Y-m-d H:i'),
            'branch' => $order?->branch?->name,
            'customer' => $payment->creditSale?->customer?->name
                ?? $order?->customer?->name
                ?? 'Walk-in',
            'received_by' => $payment->user?->name,
            'invoice' => $order?->invoice_number,
            'sale_date' => optional($order?->created_at)->format('Y-m-d'),
            'amount' => round((float) $payment->amount, 2),
        ];
    }

    public function collectionsTotal(Collection $collections): float
    {
        return round($collections->sum('amount'), 2);
    }

    /**
     * Cash-in view of the window — what the day actually closes with.
     *
     * collected_total is the money that physically came in: what was banked
     * against sales made in the window, plus repayments on older credit sales.
     * net_sales takes the expenses spent in the same window back off it.
     *
     * @param  Collection|null  $expenses  rows from ExpenseReport::rows()
     */
    public function summary(Collection $rows, Collection $collections, ?Collection $expenses = null): array
    {
        $totals = $this->totals($rows);
        $previous = $this->collectionsTotal($collections);
        $expenses ??= new Collection;

        $collected = round($totals['paid'] + $previous, 2);
        $spent = round($expenses->sum('cost'), 2);

        return [
            'sales' => $totals['total'],
            'discount' => $totals['discount'],
            'collected_on_sales' => $totals['paid'],
            'collected_on_previous' => $previous,
            'collected_total' => $collected,
            'expenses' => $spent,
            'net_sales' => round($collected - $spent, 2),
            'net_profit' => round($totals['gp'] - $spent, 2),
            'outstanding' => $totals['due'],
            'gp' => $totals['gp'],
            'collections_count' => $collections->count(),
            'expenses_count' => $expenses->count(),
        ];
    }

    /**
     * Column headings for exports (order matches orderedRows()).
     *
     * @return array<int,string>
     */
    public function headings(): array
    {
        return ['Date', 'Branch', 'Customer', 'Seller', 'Status', 'Discount', 'Total', 'Paid', 'Due', 'GP'];
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
            $r['discount'],
            $r['total'],
            $r['paid'],
            $r['due'],
            $r['gp'],
        ])->values()->all();
    }

    /**
     * Headings for the credit-collections sheet (order matches
     * orderedCollectionRows()).
     *
     * @return array<int,string>
     */
    public function collectionHeadings(): array
    {
        return ['Paid on', 'Branch', 'Customer', 'Received by', 'Invoice', 'Sale date', 'Amount'];
    }

    /**
     * @return array<int,array<int,mixed>>
     */
    public function orderedCollectionRows(Collection $collections): array
    {
        return $collections->map(fn (array $r) => [
            $r['date'],
            $r['branch'],
            $r['customer'],
            $r['received_by'],
            $r['invoice'],
            $r['sale_date'],
            $r['amount'],
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

    /**
     * The same window as resolveDates(), but as timestamps for use in queries.
     *
     * Reports compare against these with plain >= / <= rather than whereDate():
     * whereDate() wraps the column in DATE(), which makes any index on
     * created_at unusable and forces a full scan of orders / payments.
     *
     * @return array{0:?Carbon,1:?Carbon}
     */
    public function dateBounds(array $filters, bool $allWhenNoDates = false): array
    {
        [$from, $to] = $this->resolveDates($filters, $allWhenNoDates);

        return [
            $from ? Carbon::parse($from)->startOfDay() : null,
            $to ? Carbon::parse($to)->endOfDay() : null,
        ];
    }
}
