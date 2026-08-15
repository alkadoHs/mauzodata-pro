<?php

namespace App\Support;

use App\Models\Product;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Every movement that has touched a product's stock, in order, with the
 * balance it left behind.
 *
 * There is no stock_movements table — stock is a running number that half a
 * dozen features increment and decrement. So the history is reassembled from
 * the rows those features wrote: order lines, new stock, transfers in and out,
 * shortfalls returned, received purchase orders and the legacy transfers.
 *
 * The balance is worked *backwards* from the product's stock as it is now, so
 * the ledger always ends on the number the system is actually showing. That
 * makes a disagreement visible rather than hiding it: where a movement also
 * recorded a snapshot of the stock at the time — transfers and new stock do,
 * sales do not — the snapshot is compared with the computed balance, and a
 * mismatch means something moved this product outside these movements.
 *
 * Two things genuinely leave no trace, and the report says so rather than
 * pretending otherwise:
 *   - editing the stock field on the product form;
 *   - deleting an order line, which puts the quantity back and removes the row.
 */
class StockLedger
{
    /** Sale, transfer out, legacy transfer. */
    public const OUT = 'out';

    /** New stock, transfer in, returned shortfall, purchase received. */
    public const IN = 'in';

    /**
     * The ledger for one product over a window.
     *
     * @return array{
     *     opening: float, closing: float, current: float,
     *     in: float, out: float, rows: Collection, mismatches: int
     * }
     */
    public function build(Product $product, ?Carbon $from, ?Carbon $to): array
    {
        $movements = $this->movements($product->id, $from, $to)
            ->sortBy(['at', 'id'])
            ->values();

        // Anything that happened after the window still shaped today's number,
        // so unwind it to find where the window actually closed. With no end
        // date there is nothing after it to unwind.
        $closing = (float) $product->stock - $this->netAfter($product->id, $to);
        $opening = $closing - $movements->sum(fn ($m) => $m['in'] - $m['out']);

        $balance = $opening;
        $mismatches = 0;

        $rows = $movements->map(function (array $m) use (&$balance, &$mismatches) {
            $before = $balance;
            $balance = $balance + $m['in'] - $m['out'];

            // Where the app recorded what the stock was at the time, hold the
            // computed balance up against it.
            $recorded = $m['recorded_after'];
            $drift = $recorded === null ? null : round($recorded - $balance, 2);

            if ($drift !== null && abs($drift) >= 0.01) {
                $mismatches++;
            }

            return [
                ...$m,
                'balance_before' => round($before, 2),
                'balance_after' => round($balance, 2),
                'drift' => $drift,
            ];
        });

        return [
            'opening' => round($opening, 2),
            'closing' => round($closing, 2),
            'current' => round((float) $product->stock, 2),
            'in' => round($movements->sum('in'), 2),
            'out' => round($movements->sum('out'), 2),
            'rows' => $rows,
            'mismatches' => $mismatches,
        ];
    }

    /**
     * Net change strictly after $to — what has to be unwound from today's
     * stock to land on the closing balance of the window being viewed.
     *
     * Strictly after: a movement at exactly $to belongs inside the window, and
     * counting it on both sides would shift every balance by its quantity.
     */
    private function netAfter(int $productId, ?Carbon $to): float
    {
        if ($to === null) {
            return 0.0;
        }

        return (float) $this->movements($productId, $to, null, strictFrom: true)
            ->sum(fn ($m) => $m['in'] - $m['out']);
    }

    /**
     * @return Collection<int,array<string,mixed>>
     */
    private function movements(int $productId, ?Carbon $from, ?Carbon $to, bool $strictFrom = false): Collection
    {
        $window = fn ($q, string $column) => $q
            ->when($from, fn ($qq) => $qq->where($column, $strictFrom ? '>' : '>=', $from))
            ->when($to, fn ($qq) => $qq->where($column, '<=', $to));

        $rows = collect();

        // --- sold -----------------------------------------------------------
        $sales = $window(
            DB::table('order_items as oi')
                ->join('orders as o', 'o.id', '=', 'oi.order_id')
                ->leftJoin('users as u', 'u.id', '=', 'o.user_id')
                ->where('oi.product_id', $productId),
            'oi.created_at'
        )->get([
            'oi.id', 'oi.created_at', 'oi.quantity', 'o.id as order_id',
            'o.invoice_number', 'o.status', 'u.name as who',
        ]);

        foreach ($sales as $r) {
            $rows->push($this->row(
                'sale-'.$r->id, $r->created_at, 'Sale', self::OUT, (float) $r->quantity,
                $r->who, 'Receipt '.($r->invoice_number ?: $r->order_id).($r->status === 'credit' ? ' (credit)' : ''), null
            ));
        }

        // --- stock added ------------------------------------------------------
        $added = $window(DB::table('new_stocks')->where('product_id', $productId), 'created_at')
            ->get(['id', 'created_at', 'new_stock', 'stock']);

        foreach ($added as $r) {
            // new_stocks.stock is the level *before* the addition.
            $before = $r->stock !== null ? (float) $r->stock : null;
            $rows->push($this->row(
                'new-'.$r->id, $r->created_at, 'New stock', self::IN, (float) $r->new_stock,
                null, 'Stock added', $before === null ? null : $before + (float) $r->new_stock
            ));
        }

        // --- sent to another branch -------------------------------------------
        $sent = $window(
            DB::table('product_transfer_items as i')
                ->join('product_transfers as t', 't.id', '=', 'i.product_transfer_id')
                ->leftJoin('branches as b', 'b.id', '=', 't.branch_id')
                ->leftJoin('users as u', 'u.id', '=', 't.user_id')
                ->where('i.product_id', $productId)
                ->where('t.status', '!=', 'pending'),
            't.created_at'
        )->get([
            'i.id', 't.created_at', 'i.stock', 'i.stock_after', 'b.name as branch', 'u.name as who', 't.id as tid',
        ]);

        foreach ($sent as $r) {
            $rows->push($this->row(
                'out-'.$r->id, $r->created_at, 'Transferred out', self::OUT, (float) $r->stock,
                $r->who, 'To '.($r->branch ?? 'another branch').' · transfer '.$r->tid,
                $r->stock_after === null ? null : (float) $r->stock_after
            ));
        }

        // --- received from another branch --------------------------------------
        $received = $window(
            DB::table('product_transfer_items as i')
                ->join('product_transfers as t', 't.id', '=', 'i.product_transfer_id')
                ->leftJoin('branches as b', 'b.id', '=', 't.from_branch_id')
                ->leftJoin('users as u', 'u.id', '=', 'i.received_by')
                ->where('i.to_product_id', $productId)
                ->whereNotNull('i.received_at'),
            'i.received_at'
        )->get([
            'i.id', 'i.received_at', 'i.received_stock', 'i.to_stock_after',
            'b.name as branch', 'u.name as who', 't.id as tid',
        ]);

        foreach ($received as $r) {
            $rows->push($this->row(
                'in-'.$r->id, $r->received_at, 'Received in', self::IN, (float) $r->received_stock,
                $r->who, 'From '.($r->branch ?? 'another branch').' · transfer '.$r->tid,
                $r->to_stock_after === null ? null : (float) $r->to_stock_after
            ));
        }

        // --- came back because it never arrived ---------------------------------
        $returned = $window(
            DB::table('product_transfer_items as i')
                ->join('product_transfers as t', 't.id', '=', 'i.product_transfer_id')
                ->leftJoin('branches as b', 'b.id', '=', 't.branch_id')
                ->where('i.product_id', $productId)
                ->whereNotNull('i.received_at')
                ->where('i.returned_stock', '>', 0),
            'i.received_at'
        )->get(['i.id', 'i.received_at', 'i.returned_stock', 'b.name as branch', 't.id as tid']);

        foreach ($returned as $r) {
            $rows->push($this->row(
                'ret-'.$r->id, $r->received_at, 'Returned (short delivery)', self::IN, (float) $r->returned_stock,
                null, ($r->branch ?? 'The other branch').' counted fewer · transfer '.$r->tid, null
            ));
        }

        // --- purchase order received ---------------------------------------------
        $purchased = $window(
            DB::table('purchase_order_items as pi')
                ->join('purchase_orders as p', 'p.id', '=', 'pi.purchase_order_id')
                ->leftJoin('suppliers as s', 's.id', '=', 'p.supplier_id')
                ->where('pi.product_id', $productId)
                ->where('p.status', 'received'),
            'pi.updated_at'
        )->get(['pi.id', 'pi.updated_at', 'pi.quantity', 'pi.stock_after', 's.name as supplier', 'p.id as pid']);

        foreach ($purchased as $r) {
            $rows->push($this->row(
                'po-'.$r->id, $r->updated_at, 'Purchase received', self::IN, (float) $r->quantity,
                null, 'From '.($r->supplier ?? 'supplier').' · order '.$r->pid,
                $r->stock_after === null ? null : (float) $r->stock_after
            ));
        }

        // --- the old transfer screen ---------------------------------------------
        // It only ever took stock off the sending branch; nothing was added at
        // the other end, which is why those numbers never balanced.
        $legacy = $window(
            DB::table('stock_transfers as st')
                ->leftJoin('branches as b', 'b.id', '=', 'st.branch_id')
                ->leftJoin('users as u', 'u.id', '=', 'st.released_by')
                ->where('st.product_id', $productId),
            'st.created_at'
        )->get(['st.id', 'st.created_at', 'st.stock', 'b.name as branch', 'u.name as who']);

        foreach ($legacy as $r) {
            $rows->push($this->row(
                'leg-'.$r->id, $r->created_at, 'Transferred out (old screen)', self::OUT, (float) $r->stock,
                $r->who, 'To '.($r->branch ?? 'another branch'), null
            ));
        }

        return $rows;
    }

    /**
     * @param  float|null  $recordedAfter  what the app noted the stock to be
     *                                     straight after this movement, if it
     *                                     noted anything at all
     */
    private function row(
        string $id, ?string $at, string $type, string $direction,
        float $quantity, ?string $who, ?string $reference, ?float $recordedAfter,
    ): array {
        return [
            'id' => $id,
            'at' => $at,
            'type' => $type,
            'in' => $direction === self::IN ? $quantity : 0.0,
            'out' => $direction === self::OUT ? $quantity : 0.0,
            'who' => $who,
            'reference' => $reference,
            'recorded_after' => $recordedAfter,
        ];
    }
}
