import { Heading4 } from "@/components/Typography/Heading4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { cn, numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowLeft,
    ArrowUpRight,
    Info,
    SearchIcon,
} from "lucide-react";
import { FormEventHandler, useState } from "react";

type Row = {
    id: string;
    at: string | null;
    type: string;
    in: number;
    out: number;
    who: string | null;
    reference: string | null;
    /** What the app noted the stock to be right after, if it noted anything. */
    recorded_after: number | null;
    balance_before: number;
    balance_after: number;
    /** recorded_after minus the computed balance; non-zero means drift. */
    drift: number | null;
};

type Summary = {
    opening: number;
    closing: number;
    current: number;
    in: number;
    out: number;
    mismatches: number;
    movements: number;
};

/**
 * How a product's stock got to the number on the screen.
 *
 * The balance is worked backwards from today's stock, so the ledger always
 * ends on what the system shows. Where a movement also recorded the stock at
 * the time, the two are compared — a mismatch means something moved this
 * product outside these movements.
 */
export default function ProductLedger({
    auth,
    product,
    ledger,
    summary,
    filters,
    products,
}: PageProps<{
    product: { id: number; name: string; unit: string; stock: number; stock_alert: number };
    ledger: Row[];
    summary: Summary;
    filters: { from_date: string; to_date: string };
    products: { id: number; name: string }[];
}>) {
    const [from, setFrom] = useState(filters.from_date);
    const [to, setTo] = useState(filters.to_date);

    const apply: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            route("reports.product-ledger", product.id),
            { from_date: from, to_date: to },
            { preserveState: true, replace: true }
        );
    };

    return (
        <Authenticated user={auth.user}>
            <Head title={`${product.name} — stock ledger`} />

            <section className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Heading4>{product.name} — stock ledger</Heading4>
                        <p className="text-sm text-muted-foreground">
                            Every movement behind the current figure of{" "}
                            <b className="text-foreground">
                                {numberFormat(summary.current)} {product.unit}
                            </b>
                            .
                        </p>
                    </div>
                    <Link href={route("reports.inventory")}>
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="size-4" /> Inventory
                        </Button>
                    </Link>
                </div>

                <form
                    onSubmit={apply}
                    className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3"
                >
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        Product
                        <Select
                            value={String(product.id)}
                            onValueChange={(v) =>
                                router.get(route("reports.product-ledger", v), {
                                    from_date: from,
                                    to_date: to,
                                })
                            }
                        >
                            <SelectTrigger className="w-[240px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        From
                        <Input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        To
                        <Input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                    </label>
                    <Button type="submit" className="gap-2">
                        <SearchIcon className="size-4" /> Apply
                    </Button>
                </form>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat label="Opening" value={summary.opening} hint="start of this period" />
                    <Stat label="Came in" value={summary.in} tone="in" />
                    <Stat label="Went out" value={summary.out} tone="out" />
                    <Stat
                        label="Closing"
                        value={summary.closing}
                        hint={`${summary.movements} movement(s)`}
                    />
                </div>

                {summary.mismatches > 0 && (
                    <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p>
                            <b>
                                {summary.mismatches} movement
                                {summary.mismatches === 1 ? "" : "s"} disagree
                                with the stock recorded at the time.
                            </b>{" "}
                            Where a row shows a difference below, this product's
                            stock changed by something other than the movements
                            listed here — most often the stock field being edited
                            on the product form, or an order line being deleted.
                        </p>
                    </div>
                )}

                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                <th className="px-3 py-2 font-medium">When</th>
                                <th className="px-3 py-2 font-medium">What happened</th>
                                <th className="px-3 py-2 font-medium">Who</th>
                                <th className="px-3 py-2 text-right font-medium">Before</th>
                                <th className="px-3 py-2 text-right font-medium">In</th>
                                <th className="px-3 py-2 text-right font-medium">Out</th>
                                <th className="px-3 py-2 text-right font-medium">After</th>
                                <th className="px-3 py-2 text-right font-medium">Recorded</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b bg-muted/40 font-medium">
                                <td className="px-3 py-2" colSpan={6}>
                                    Opening stock
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                    {numberFormat(summary.opening)}
                                </td>
                                <td />
                            </tr>

                            {ledger.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-3 py-10 text-center text-muted-foreground"
                                    >
                                        Nothing moved this product in this period.
                                    </td>
                                </tr>
                            )}

                            {ledger.map((row) => (
                                <tr key={row.id} className="border-b">
                                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                                        {row.at}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="font-medium">{row.type}</div>
                                        {row.reference && (
                                            <div className="text-xs text-muted-foreground">
                                                {row.reference}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-muted-foreground">
                                        {row.who ?? "—"}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                        {numberFormat(row.balance_before)}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                        {row.in ? (
                                            <span className="inline-flex items-center gap-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                                                <ArrowUpRight className="size-3" />
                                                {numberFormat(row.in)}
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                        {row.out ? (
                                            <span className="inline-flex items-center gap-0.5 font-medium text-red-700 dark:text-red-400">
                                                <ArrowDownRight className="size-3" />
                                                {numberFormat(row.out)}
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                                        {numberFormat(row.balance_after)}
                                    </td>
                                    <td
                                        className={cn(
                                            "px-3 py-2 text-right tabular-nums",
                                            row.drift !== null && Math.abs(row.drift) >= 0.01
                                                ? "font-semibold text-amber-600"
                                                : "text-muted-foreground"
                                        )}
                                        title={
                                            row.drift !== null && Math.abs(row.drift) >= 0.01
                                                ? `The app recorded ${numberFormat(row.recorded_after ?? 0)} here, ${numberFormat(Math.abs(row.drift))} ${row.drift > 0 ? "more" : "less"} than these movements account for.`
                                                : undefined
                                        }
                                    >
                                        {row.recorded_after === null
                                            ? "—"
                                            : numberFormat(row.recorded_after)}
                                        {row.drift !== null &&
                                            Math.abs(row.drift) >= 0.01 && (
                                                <span className="ml-1">
                                                    ({row.drift > 0 ? "+" : ""}
                                                    {numberFormat(row.drift)})
                                                </span>
                                            )}
                                    </td>
                                </tr>
                            ))}

                            <tr className="bg-muted/40 font-medium">
                                <td className="px-3 py-2" colSpan={6}>
                                    Closing stock
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                    {numberFormat(summary.closing)}
                                </td>
                                <td />
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="flex gap-2 rounded-md border bg-card p-3 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <p>
                        Balances are worked back from the stock the system shows
                        now, so the ledger always ends on that number. Two
                        things change stock without leaving a record and so
                        cannot appear here: editing the stock field on the
                        product form, and deleting a line from an order, which
                        puts the quantity back. Where the <b>Recorded</b> column
                        differs from <b>After</b>, one of those is the usual
                        explanation.
                    </p>
                </div>
            </section>
        </Authenticated>
    );
}

function Stat({
    label,
    value,
    hint,
    tone,
}: {
    label: string;
    value: number;
    hint?: string;
    tone?: "in" | "out";
}) {
    return (
        <div className="rounded-lg border bg-card p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div
                className={cn(
                    "text-xl font-semibold tabular-nums",
                    tone === "in" && "text-emerald-700 dark:text-emerald-400",
                    tone === "out" && "text-red-700 dark:text-red-400"
                )}
            >
                {numberFormat(value)}
            </div>
            {hint && (
                <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
            )}
        </div>
    );
}
