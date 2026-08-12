import { Heading4 } from "@/components/Typography/Heading4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { cn, numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import { ChevronDown, ChevronRight, SearchIcon, Truck, Undo2 } from "lucide-react";
import { Fragment, FormEventHandler, useState } from "react";

type Line = {
    id: number;
    product: string;
    unit: string | null;
    sent: number;
    received: number;
    returned: number;
    awaiting: number;
    received_at: string | null;
    received_by: string | null;
};

type Transfer = {
    id: number;
    date: string | null;
    from: string;
    to: string;
    sent_by: string | null;
    received_by: string | null;
    received_at: string | null;
    status: "pending" | "transferred" | "received";
    sent: number;
    received: number;
    returned: number;
    awaiting: number;
    lines: Line[];
};

type Totals = {
    transfers: number;
    sent: number;
    received: number;
    returned: number;
    awaiting: number;
};

/**
 * What moved between branches and what actually arrived.
 *
 * The gap is the point: a transfer can be sent in full and counted in short,
 * with the difference going back to the sender. Sent, received and returned
 * sit side by side so a manager can see where stock is going missing.
 */
export default function StockTransfers({
    auth,
    transfers,
    totals,
    filters,
    branchLabel,
}: PageProps<{
    transfers: Transfer[];
    totals: Totals;
    filters: { from_date: string | null; to_date: string | null };
    branchLabel: string;
}>) {
    const [from, setFrom] = useState(filters.from_date ?? "");
    const [to, setTo] = useState(filters.to_date ?? "");
    const [open, setOpen] = useState<number | null>(null);

    const apply: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            route("reports.stocktransfers"),
            { from_date: from || undefined, to_date: to || undefined },
            { preserveState: true, replace: true }
        );
    };

    return (
        <Authenticated user={auth.user}>
            <Head title="Stock transfers" />

            <section className="flex flex-col gap-4">
                <div>
                    <Heading4>Stock transfers</Heading4>
                    <p className="text-sm text-muted-foreground">
                        {branchLabel} — what was sent, what arrived, and what
                        came back.
                    </p>
                </div>

                <form
                    onSubmit={apply}
                    className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3"
                >
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
                    <Stat label="Sent" value={totals.sent} hint={`${totals.transfers} transfer(s)`} />
                    <Stat label="Received" value={totals.received} tone="in" />
                    <Stat
                        label="Returned"
                        value={totals.returned}
                        hint="went back to the sender"
                        tone="out"
                    />
                    <Stat
                        label="Still in transit"
                        value={totals.awaiting}
                        hint="sent, not yet counted"
                    />
                </div>

                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                <th className="px-3 py-2 font-medium">Date</th>
                                <th className="px-3 py-2 font-medium">From</th>
                                <th className="px-3 py-2 font-medium">To</th>
                                <th className="px-3 py-2 font-medium">Status</th>
                                <th className="px-3 py-2 text-right font-medium">Sent</th>
                                <th className="px-3 py-2 text-right font-medium">Received</th>
                                <th className="px-3 py-2 text-right font-medium">Returned</th>
                                <th className="px-3 py-2 text-right font-medium">In transit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-3 py-12 text-center text-muted-foreground"
                                    >
                                        <Truck className="mx-auto mb-2 size-6 opacity-50" />
                                        No transfers in this period.
                                    </td>
                                </tr>
                            )}

                            {transfers.map((t) => (
                                <Fragment key={t.id}>
                                    <tr
                                        className="cursor-pointer border-b hover:bg-muted/50"
                                        onClick={() =>
                                            setOpen(open === t.id ? null : t.id)
                                        }
                                    >
                                        <td className="whitespace-nowrap px-3 py-2">
                                            <span className="flex items-center gap-1">
                                                {open === t.id ? (
                                                    <ChevronDown className="size-3.5" />
                                                ) : (
                                                    <ChevronRight className="size-3.5" />
                                                )}
                                                {t.date}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">{t.from}</td>
                                        <td className="px-3 py-2">{t.to}</td>
                                        <td className="px-3 py-2">
                                            <StatusChip transfer={t} />
                                        </td>
                                        <td className="px-3 py-2 text-right tabular-nums">
                                            {numberFormat(t.sent)}
                                        </td>
                                        <td className="px-3 py-2 text-right tabular-nums">
                                            {numberFormat(t.received)}
                                        </td>
                                        <td
                                            className={cn(
                                                "px-3 py-2 text-right tabular-nums",
                                                t.returned > 0 &&
                                                    "font-semibold text-amber-600"
                                            )}
                                        >
                                            {t.returned > 0
                                                ? numberFormat(t.returned)
                                                : "—"}
                                        </td>
                                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                            {t.awaiting > 0
                                                ? numberFormat(t.awaiting)
                                                : "—"}
                                        </td>
                                    </tr>

                                    {open === t.id && (
                                        <tr>
                                            <td colSpan={8} className="bg-muted/30 px-3 py-2">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="text-left text-muted-foreground">
                                                            <th className="py-1 font-medium">Product</th>
                                                            <th className="py-1 text-right font-medium">Sent</th>
                                                            <th className="py-1 text-right font-medium">Received</th>
                                                            <th className="py-1 text-right font-medium">Returned</th>
                                                            <th className="py-1 font-medium">Confirmed</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {t.lines.map((l) => (
                                                            <tr key={l.id} className="border-t border-border/50">
                                                                <td className="py-1.5">{l.product}</td>
                                                                <td className="py-1.5 text-right tabular-nums">
                                                                    {numberFormat(l.sent)} {l.unit}
                                                                </td>
                                                                <td className="py-1.5 text-right tabular-nums">
                                                                    {l.received_at ? numberFormat(l.received) : "—"}
                                                                </td>
                                                                <td
                                                                    className={cn(
                                                                        "py-1.5 text-right tabular-nums",
                                                                        l.returned > 0 && "font-semibold text-amber-600"
                                                                    )}
                                                                >
                                                                    {l.returned > 0 ? numberFormat(l.returned) : "—"}
                                                                </td>
                                                                <td className="py-1.5 text-muted-foreground">
                                                                    {l.received_at
                                                                        ? `${l.received_at}${l.received_by ? ` · ${l.received_by}` : ""}`
                                                                        : "awaiting"}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </Authenticated>
    );
}

function StatusChip({ transfer }: { transfer: Transfer }) {
    const done = transfer.lines.filter((l) => l.received_at).length;
    const total = transfer.lines.length;

    if (transfer.status === "received") {
        return (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                Received
            </span>
        );
    }

    if (transfer.status === "pending") {
        return (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Not sent
            </span>
        );
    }

    return (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            {done > 0 ? `${done}/${total} confirmed` : "In transit"}
        </span>
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
                    tone === "out" && "text-amber-600"
                )}
            >
                {numberFormat(value)}
            </div>
            {hint && (
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    {tone === "out" && <Undo2 className="size-3" />}
                    {hint}
                </div>
            )}
        </div>
    );
}
