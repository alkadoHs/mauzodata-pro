import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn, numberFormat } from "@/lib/utils";
import axios from "axios";
import { Loader2, PackageX, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ReportRow } from "./SalesReportView";

type Item = {
    id: number;
    product: string;
    unit: string | null;
    quantity: number;
    price: number;
    discount: number;
    total: number;
};

/**
 * A sale's line items, opened from a report row — chiefly to answer "which
 * products were discounted, and by how much", since the report row only ever
 * shows one discount total for the whole sale.
 *
 * The header figures (Total, Discount, Paid, Due) come straight from the row
 * that was clicked rather than being re-fetched: the report already computed
 * them correctly for whatever date window is in effect, and re-deriving them
 * here from the order alone — with no date window — could quietly disagree
 * with what's on screen. Only the line items, which the flat row has no room
 * for, are fetched.
 */
export function OrderItemsDialog({
    row,
    onClose,
}: {
    row: ReportRow | null;
    onClose: () => void;
}) {
    const [items, setItems] = useState<Item[] | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!row) return;

        setItems(null);
        setLoading(true);

        axios
            .get(route("orders.items", row.id))
            .then((r) => setItems(r.data.items))
            .catch(() => toast.error("Could not load this sale's items."))
            .finally(() => setLoading(false));
    }, [row?.id]);

    return (
        <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{row?.customer ?? "Sale"}</DialogTitle>
                    <DialogDescription>
                        {row &&
                            `Receipt ${row.invoice ?? row.id} · ${row.date}${row.seller ? ` · sold by ${row.seller}` : ""}`}
                    </DialogDescription>
                </DialogHeader>

                {row && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Figure label="Total" value={row.total} />
                        <Figure
                            label="Discount"
                            value={row.discount}
                            tone={row.discount > 0 ? "out" : undefined}
                        />
                        <Figure label="Paid" value={row.paid} tone="in" />
                        <Figure
                            label="Due"
                            value={row.due}
                            tone={row.due > 0 ? "out" : undefined}
                        />
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
                    </div>
                )}

                {items && (
                    <div className="max-h-[360px] overflow-y-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-muted/60">
                                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-3 py-2 font-medium">
                                        Product
                                    </th>
                                    <th className="px-3 py-2 text-right font-medium">
                                        Qty
                                    </th>
                                    <th className="px-3 py-2 text-right font-medium">
                                        Price
                                    </th>
                                    <th className="px-3 py-2 text-right font-medium">
                                        Discount
                                    </th>
                                    <th className="px-3 py-2 text-right font-medium">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-3 py-8 text-center text-muted-foreground"
                                        >
                                            <PackageX className="mx-auto mb-2 size-5 opacity-50" />
                                            This sale has no items on record.
                                        </td>
                                    </tr>
                                )}
                                {items.map((item) => {
                                    const discounted = item.discount > 0;

                                    return (
                                        <tr
                                            key={item.id}
                                            className={cn(
                                                "border-t",
                                                // Discounted lines are what this
                                                // whole dialog exists to surface —
                                                // a plain row colour would bury
                                                // the one thing being asked for.
                                                discounted &&
                                                    "bg-amber-50 dark:bg-amber-500/10"
                                            )}
                                        >
                                            <td className="px-3 py-2 font-medium">
                                                <span className="flex items-center gap-1.5">
                                                    {discounted && (
                                                        <Tag className="size-3.5 shrink-0 text-amber-600" />
                                                    )}
                                                    {item.product}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {numberFormat(item.quantity)}
                                                {item.unit ? ` ${item.unit}` : ""}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                                {numberFormat(item.price)}
                                            </td>
                                            <td
                                                className={cn(
                                                    "px-3 py-2 text-right tabular-nums",
                                                    discounted &&
                                                        "font-semibold text-amber-700 dark:text-amber-400"
                                                )}
                                            >
                                                {discounted
                                                    ? `−${numberFormat(item.discount)}`
                                                    : "—"}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium tabular-nums">
                                                {numberFormat(item.total)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    Shown here only — the exported PDF and Excel reports carry
                    the sale's discount total, not this per-product detail.
                </p>
            </DialogContent>
        </Dialog>
    );
}

function Figure({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone?: "in" | "out";
}) {
    return (
        <div className="rounded-lg border bg-card p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div
                className={cn(
                    "text-lg font-semibold tabular-nums",
                    tone === "in" && "text-emerald-700 dark:text-emerald-400",
                    tone === "out" && "text-amber-700 dark:text-amber-400"
                )}
            >
                {numberFormat(value)}
            </div>
        </div>
    );
}
