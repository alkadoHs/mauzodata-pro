import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Head, Link, router } from "@inertiajs/react";
import { Plus, Route as RouteIcon, SearchIcon } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { Figure } from "./partials/Figure";
import { TripFormDialog } from "./partials/TripFormDialog";
import { TripRow, TRIP_STATUS_LABELS, TripStatus } from "./partials/types";

const ANY = "any";

type Totals = {
    trips: number;
    freight: number;
    expenses: number;
    margin: number;
    outstanding: number;
};

type Filters = {
    from_date: string | null;
    to_date: string | null;
    status: TripStatus | null;
    truck_id: number | null;
    search: string | null;
};

/**
 * Every journey the business has run, and what each one made.
 *
 * The margin column is freight minus that trip's own costs. It is not net
 * profit — running costs sit outside any one journey — and the page says so
 * rather than letting a healthy margin be read as money in hand.
 */
export default function Trips({
    auth,
    trips,
    totals,
    trucks,
    drivers,
    clients,
    filters,
}: PageProps<{
    trips: TripRow[];
    totals: Totals;
    trucks: { id: number; plate_number: string; name: string | null; status: any }[];
    drivers: { id: number; name: string }[];
    clients: { id: number; name: string }[];
    filters: Filters;
}>) {
    const [from, setFrom] = useState(filters.from_date ?? "");
    const [to, setTo] = useState(filters.to_date ?? "");
    const [status, setStatus] = useState<string>(filters.status ?? ANY);
    const [truck, setTruck] = useState<string>(
        filters.truck_id ? String(filters.truck_id) : ANY
    );
    const [search, setSearch] = useState(filters.search ?? "");
    const [formOpen, setFormOpen] = useState(false);

    const apply: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            route("logistics.trips.index"),
            {
                from_date: from || undefined,
                to_date: to || undefined,
                status: status === ANY ? undefined : status,
                truck_id: truck === ANY ? undefined : truck,
                search: search || undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const filtering =
        !!from || !!to || status !== ANY || truck !== ANY || !!search;

    return (
        <Authenticated user={auth.user}>
            <Head title="Trips" />

            <section className="flex flex-col gap-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Trips</h1>
                        <p className="text-sm text-muted-foreground">
                            Every journey, what it earned and what it cost.
                        </p>
                    </div>
                    <Button onClick={() => setFormOpen(true)} className="gap-2">
                        <Plus className="size-4" /> Record trip
                    </Button>
                </header>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Figure
                        label="Freight earned"
                        value={totals.freight}
                        hint={`${numberFormat(totals.trips)} trip(s)`}
                    />
                    <Figure label="Trip expenses" value={totals.expenses} tone="out" />
                    <Figure
                        label="Trip margin"
                        value={totals.margin}
                        hint="before running costs"
                        tone={totals.margin >= 0 ? "in" : "out"}
                        emphasis
                    />
                    <Figure
                        label="Still owed"
                        value={totals.outstanding}
                        hint="earned but not yet received"
                        tone={totals.outstanding > 0 ? "out" : undefined}
                    />
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
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        Status
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ANY}>Any status</SelectItem>
                                {Object.entries(TRIP_STATUS_LABELS).map(([v, l]) => (
                                    <SelectItem key={v} value={v}>{l}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        Truck
                        <Select value={truck} onValueChange={setTruck}>
                            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ANY}>Any truck</SelectItem>
                                {trucks.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                        {t.plate_number}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>
                    <label className="flex flex-1 min-w-[180px] flex-col gap-1 text-xs text-muted-foreground">
                        Search
                        <Input
                            placeholder="Route, cargo, client or plate…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </label>
                    <Button type="submit" className="gap-2">
                        <SearchIcon className="size-4" /> Apply
                    </Button>
                </form>

                <div className="overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Trip</TableHead>
                                <TableHead>Route</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Truck</TableHead>
                                <TableHead className="text-right">Freight</TableHead>
                                <TableHead className="text-right">Expenses</TableHead>
                                <TableHead className="text-right">Margin</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trips.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                        <span className="flex flex-col items-center gap-2">
                                            <RouteIcon className="size-6 opacity-50" />
                                            {filtering
                                                ? "No trips match these filters."
                                                : "No trips recorded yet."}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            )}

                            {trips.map((trip) => (
                                <TableRow
                                    key={trip.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() =>
                                        router.get(route("logistics.trips.show", trip.id))
                                    }
                                >
                                    <TableCell>
                                        <div className="font-medium">{trip.reference}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {trip.dispatched_at}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="whitespace-nowrap">
                                            {trip.origin} → {trip.destination}
                                        </div>
                                        {trip.cargo && (
                                            <div className="text-xs text-muted-foreground">
                                                {trip.cargo}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {trip.client ?? "—"}
                                        {trip.balance > 0 && trip.status !== "cancelled" && (
                                            <div className="text-xs text-amber-600 dark:text-amber-400">
                                                owes {numberFormat(trip.balance)}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {trip.truck ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {numberFormat(trip.freight)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">
                                        {numberFormat(trip.expenses)}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            "text-right font-medium tabular-nums",
                                            trip.margin >= 0
                                                ? "text-emerald-700 dark:text-emerald-400"
                                                : "text-red-700 dark:text-red-400"
                                        )}
                                    >
                                        {numberFormat(trip.margin)}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={trip.status} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <p className="text-xs text-muted-foreground">
                    Margin is freight minus that trip's own costs. Insurance,
                    licences, servicing and salaries are not in it — those are
                    running costs, and they come off in the profit report.
                </p>
            </section>

            <TripFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                options={{ trucks, drivers, clients }}
            />
        </Authenticated>
    );
}

export function StatusBadge({ status }: { status: TripStatus }) {
    if (status === "delivered") {
        return (
            <Badge className="border-transparent bg-emerald-600 text-white hover:bg-emerald-600/90">
                {TRIP_STATUS_LABELS.delivered}
            </Badge>
        );
    }
    if (status === "in_transit") {
        return (
            <Badge className="border-transparent bg-sky-600 text-white hover:bg-sky-600/90">
                {TRIP_STATUS_LABELS.in_transit}
            </Badge>
        );
    }
    return <Badge variant="outline">{TRIP_STATUS_LABELS.cancelled}</Badge>;
}
