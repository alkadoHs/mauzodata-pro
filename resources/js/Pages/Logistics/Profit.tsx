import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { cn, numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import { Info, SearchIcon } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { Breakdown } from "./partials/Breakdown";

type Totals = {
    trips: number;
    cancelled: number;
    freight: number;
    trip_expenses: number;
    trip_margin: number;
    running_costs: number;
    net_profit: number;
    cash_in: number;
    outstanding: number;
};

type CategoryRow = { category: string; label: string; total: number };

type TruckRow = {
    truck_id: number;
    truck: string;
    name: string | null;
    trips: number;
    freight: number;
    trip_expenses: number;
    margin: number;
    running_costs: number;
    net: number;
};

type ClientRow = {
    client: string;
    trips: number;
    freight: number;
    paid: number;
    owed: number;
};

/**
 * What the business made.
 *
 * The statement is deliberately two-stage: trip margin, then net profit after
 * running costs. Showing only the first would flatter the business by every
 * shilling of insurance, licence and salary — and that is the number someone
 * would otherwise act on.
 */
export default function Profit({
    auth,
    totals,
    tripExpenseCategories,
    runningCostCategories,
    byTruck,
    byClient,
    unattributedRunning,
    filters,
}: PageProps<{
    totals: Totals;
    tripExpenseCategories: CategoryRow[];
    runningCostCategories: CategoryRow[];
    byTruck: TruckRow[];
    byClient: ClientRow[];
    unattributedRunning: number;
    filters: { from_date: string; to_date: string };
}>) {
    const [from, setFrom] = useState(filters.from_date);
    const [to, setTo] = useState(filters.to_date);

    const go = (f: string, t: string) =>
        router.get(
            route("logistics.profit"),
            { from_date: f, to_date: t },
            { preserveState: true, replace: true }
        );

    const apply: FormEventHandler = (e) => {
        e.preventDefault();
        go(from, to);
    };

    const preset = (months: number) => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - months, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - months + 1, 0);
        const iso = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
                d.getDate()
            ).padStart(2, "0")}`;
        setFrom(iso(start));
        setTo(iso(end));
        go(iso(start), iso(end));
    };

    const thisYear = () => {
        const y = new Date().getFullYear();
        setFrom(`${y}-01-01`);
        setTo(`${y}-12-31`);
        go(`${y}-01-01`, `${y}-12-31`);
    };

    const profitable = totals.net_profit >= 0;

    return (
        <Authenticated user={auth.user}>
            <Head title="Profit" />

            <section className="flex flex-col gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Profit</h1>
                    <p className="text-sm text-muted-foreground">
                        What the trucks earned, what they cost, and what is
                        actually left.
                    </p>
                </div>

                <form
                    onSubmit={apply}
                    className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3"
                >
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        From
                        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        To
                        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                    </label>
                    <Button type="submit" className="gap-2">
                        <SearchIcon className="size-4" /> Apply
                    </Button>
                    <div className="flex flex-wrap gap-1.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => preset(0)}>
                            This month
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => preset(1)}>
                            Last month
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={thisYear}>
                            This year
                        </Button>
                    </div>
                </form>

                {/* The statement itself. */}
                <div className="rounded-xl border bg-card">
                    <div className="border-b p-3">
                        <h2 className="font-medium">
                            {filters.from_date} to {filters.to_date}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {numberFormat(totals.trips)} trip(s)
                            {totals.cancelled > 0 &&
                                `, ${numberFormat(totals.cancelled)} cancelled`}
                        </p>
                    </div>

                    <dl className="divide-y">
                        <Line label="Freight earned" value={totals.freight} />
                        <Line label="Trip expenses" value={-totals.trip_expenses} />
                        <Line label="Trip margin" value={totals.trip_margin} subtotal />
                        <Line label="Running costs" value={-totals.running_costs} />
                        <Line
                            label="Net profit"
                            value={totals.net_profit}
                            headline
                            tone={profitable ? "in" : "out"}
                        />
                    </dl>
                </div>

                {/* Earned is not the same as received, and both matter. */}
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-card p-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            Cash received
                        </div>
                        <div className="text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                            {numberFormat(totals.cash_in)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                            paid in this period, whenever it was earned
                        </div>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            Still owed
                        </div>
                        <div
                            className={cn(
                                "text-xl font-semibold tabular-nums",
                                totals.outstanding > 0 && "text-amber-600 dark:text-amber-400"
                            )}
                        >
                            {numberFormat(totals.outstanding)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                            earned in this period and still unpaid today
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Breakdown
                        title="Trip expenses"
                        subtitle="What the journeys cost on the road"
                        rows={tripExpenseCategories}
                        total={totals.trip_expenses}
                        empty="Nothing spent on trips in this period."
                    />
                    <Breakdown
                        title="Running costs"
                        subtitle="What the business costs between journeys"
                        rows={runningCostCategories}
                        total={totals.running_costs}
                        empty="No running costs recorded in this period."
                    />
                </div>

                {byTruck.length > 0 && (
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Truck</TableHead>
                                    <TableHead className="text-right">Trips</TableHead>
                                    <TableHead className="text-right">Freight</TableHead>
                                    <TableHead className="text-right">Trip costs</TableHead>
                                    <TableHead className="text-right">Margin</TableHead>
                                    <TableHead className="text-right">Running</TableHead>
                                    <TableHead className="text-right">Net</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {byTruck.map((row) => (
                                    <TableRow key={row.truck_id}>
                                        <TableCell>
                                            <div className="font-medium">{row.truck}</div>
                                            {row.name && (
                                                <div className="text-xs text-muted-foreground">
                                                    {row.name}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {numberFormat(row.trips)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {numberFormat(row.freight)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-muted-foreground">
                                            {numberFormat(row.trip_expenses)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {numberFormat(row.margin)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-muted-foreground">
                                            {numberFormat(row.running_costs)}
                                        </TableCell>
                                        <TableCell
                                            className={cn(
                                                "text-right font-medium tabular-nums",
                                                row.net >= 0
                                                    ? "text-emerald-700 dark:text-emerald-400"
                                                    : "text-red-700 dark:text-red-400"
                                            )}
                                        >
                                            {numberFormat(row.net)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {unattributedRunning > 0 && (
                    <p className="text-xs text-muted-foreground">
                        A further <b>{numberFormat(unattributedRunning)}</b> of
                        running costs belongs to the business rather than any one
                        lorry — salaries, office, and the like. It is in the net
                        profit above but not in the per-truck rows, because
                        splitting it across the fleet would be a guess.
                    </p>
                )}

                {byClient.length > 0 && (
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="text-right">Trips</TableHead>
                                    <TableHead className="text-right">Freight</TableHead>
                                    <TableHead className="text-right">Paid</TableHead>
                                    <TableHead className="text-right">Owed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {byClient.map((row) => (
                                    <TableRow key={row.client}>
                                        <TableCell className="font-medium">{row.client}</TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {numberFormat(row.trips)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {numberFormat(row.freight)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-muted-foreground">
                                            {numberFormat(row.paid)}
                                        </TableCell>
                                        <TableCell
                                            className={cn(
                                                "text-right tabular-nums",
                                                row.owed > 0 && "text-amber-600 dark:text-amber-400"
                                            )}
                                        >
                                            {numberFormat(row.owed)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <div className="flex gap-2 rounded-md border bg-card p-3 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <p>
                        A trip's costs count in the period the <b>trip</b> falls
                        in, not the date each receipt was written — a journey
                        dispatched on the 31st whose fuel receipt is dated the
                        1st still cost what it cost, and splitting the two would
                        leave one month too high and the next too low. Running
                        costs, belonging to no journey, are counted by when they
                        were spent. Net profit is what was <b>earned</b>; cash
                        received is a separate line because a haulier can be
                        profitable and still short of money. <b>Still owed</b>
                        is what remains unpaid <b>today</b>, not what was
                        outstanding on the closing date — it is there to tell
                        you who to chase, so a debt since settled reads zero.
                    </p>
                </div>
            </section>
        </Authenticated>
    );
}

function Line({
    label,
    value,
    subtotal,
    headline,
    tone,
}: {
    label: string;
    value: number;
    subtotal?: boolean;
    headline?: boolean;
    tone?: "in" | "out";
}) {
    return (
        <div
            className={cn(
                "flex items-baseline justify-between gap-4 px-4 py-2.5",
                subtotal && "bg-muted/40 font-medium",
                headline && "bg-primary/5 py-4"
            )}
        >
            <dt className={cn(headline && "text-base font-semibold")}>{label}</dt>
            <dd
                className={cn(
                    "tabular-nums",
                    headline ? "text-2xl font-bold" : "text-base",
                    tone === "in" && "text-emerald-700 dark:text-emerald-400",
                    tone === "out" && "text-red-700 dark:text-red-400",
                    !tone && value < 0 && "text-muted-foreground"
                )}
            >
                {value < 0 ? `−${numberFormat(Math.abs(value))}` : numberFormat(value)}
            </dd>
        </div>
    );
}
