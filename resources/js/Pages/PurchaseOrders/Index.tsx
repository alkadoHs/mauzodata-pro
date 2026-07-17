import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import { PaginatedPurchaseOrder, PurchaseOrder } from "@/lib/schemas";
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
import {
    ArrowLeft,
    ArrowRight,
    ChevronRight,
    Clock,
    PlusCircle,
    SearchIcon,
    Truck,
} from "lucide-react";
import { numberFormat, dateFormat } from "@/lib/utils";
import { StatusBadge } from "./Partials/StatusBadge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "use-debounce";

type PORow = PurchaseOrder & { items_count: number; total_value: number | null };
type Paginated = Omit<PaginatedPurchaseOrder, "data"> & { data: PORow[] };

type Stats = {
    pending_count: number;
    pending_value: number;
    received_count: number;
    received_value: number;
};

const STATUSES = ["all", "pending", "received", "cancelled"] as const;

export default function PurchaseOrderIndex({
    auth,
    purchaseOrders,
    stats,
    filters,
}: PageProps<{
    purchaseOrders: Paginated;
    stats: Stats;
    filters: { search: string; status: string };
}>) {
    const [search, setSearch] = useState(filters.search ?? "");

    const go = (params: Record<string, string>) =>
        router.get(
            route("purchase-orders.index"),
            { search, status: filters.status, ...params },
            { preserveState: true, replace: true, preserveScroll: true }
        );

    // Debounced so we're not firing a request per keystroke.
    const onSearch = useDebouncedCallback((value: string) => go({ search: value }), 350);

    return (
        <Authenticated user={auth.user}>
            <Head title="Purchase orders" />

            <section className="space-y-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Purchase orders
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Stock you've ordered from suppliers.
                        </p>
                    </div>
                    <Link href={route("purchase-orders.create")}>
                        <Button className="gap-2">
                            <PlusCircle className="size-4" /> New order
                        </Button>
                    </Link>
                </header>

                {/* Headline numbers */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatTile
                        label="Pending"
                        value={String(stats.pending_count)}
                        hint="awaiting delivery"
                        Icon={Clock}
                    />
                    <StatTile
                        label="Pending value"
                        value={numberFormat(stats.pending_value)}
                        hint="not yet in stock"
                    />
                    <StatTile
                        label="Received"
                        value={String(stats.received_count)}
                        hint="all time"
                        Icon={Truck}
                    />
                    <StatTile
                        label="Received value"
                        value={numberFormat(stats.received_value)}
                        hint="stock brought in"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative sm:max-w-xs sm:flex-1">
                        <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                onSearch(e.target.value);
                            }}
                            placeholder="Search PO number or supplier…"
                            className="pl-8"
                        />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map((s) => (
                            <Button
                                key={s}
                                size="sm"
                                variant={filters.status === s ? "default" : "outline"}
                                onClick={() => go({ status: s })}
                                className="capitalize"
                            >
                                {s}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Desktop table */}
                <div className="hidden rounded-xl border border-border bg-card md:block">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Items</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseOrders.data.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-28 text-center text-muted-foreground"
                                        >
                                            No purchase orders found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {purchaseOrders.data.map((po) => (
                                    <TableRow
                                        key={po.id}
                                        className="cursor-pointer"
                                        onClick={() =>
                                            router.get(route("purchase-orders.show", po.id))
                                        }
                                    >
                                        <TableCell className="font-medium">
                                            PO-{po.id}
                                        </TableCell>
                                        <TableCell>{po.supplier?.name ?? "—"}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={po.status} />
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {po.items_count}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {numberFormat(po.total_value ?? 0)}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-muted-foreground">
                                            {dateFormat(po.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <ChevronRight className="size-4 text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Mobile cards */}
                <div className="space-y-2 md:hidden">
                    {purchaseOrders.data.length === 0 && (
                        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                            No purchase orders found.
                        </p>
                    )}
                    {purchaseOrders.data.map((po) => (
                        <Link
                            key={po.id}
                            href={route("purchase-orders.show", po.id)}
                            className="block rounded-xl border border-border bg-card p-4"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-medium">PO-{po.id}</p>
                                    <p className="truncate text-sm text-muted-foreground">
                                        {po.supplier?.name ?? "—"}
                                    </p>
                                </div>
                                <StatusBadge status={po.status} />
                            </div>
                            <div className="mt-3 flex items-end justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {po.items_count} item{po.items_count === 1 ? "" : "s"} ·{" "}
                                    {dateFormat(po.created_at)}
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {numberFormat(po.total_value ?? 0)}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Pagination — only when there's more than one page */}
                {purchaseOrders.last_page > 1 && (
                    <div className="flex items-center justify-center gap-3 text-sm">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={!purchaseOrders.prev_page_url}
                            onClick={() =>
                                purchaseOrders.prev_page_url &&
                                router.get(purchaseOrders.prev_page_url, {}, { preserveScroll: true })
                            }
                        >
                            <ArrowLeft className="size-4" /> Prev
                        </Button>
                        <span className="text-muted-foreground">
                            {purchaseOrders.from ?? 0}–{purchaseOrders.to ?? 0} of{" "}
                            {purchaseOrders.total} · page <b>{purchaseOrders.current_page}</b>{" "}
                            / {purchaseOrders.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={!purchaseOrders.next_page_url}
                            onClick={() =>
                                purchaseOrders.next_page_url &&
                                router.get(purchaseOrders.next_page_url, {}, { preserveScroll: true })
                            }
                        >
                            Next <ArrowRight className="size-4" />
                        </Button>
                    </div>
                )}
            </section>
        </Authenticated>
    );
}

function StatTile({
    label,
    value,
    hint,
    Icon,
}: {
    label: string;
    value: string;
    hint?: string;
    Icon?: typeof Clock;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {Icon && <Icon className="size-3.5" />}
                {label}
            </div>
            <p className={cn("mt-1 text-lg font-semibold tabular-nums")}>{value}</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}
