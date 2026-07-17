import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { paginatedOrder } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import relativeTime from "dayjs/plugin/relativeTime";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "use-debounce";
import { useState } from "react";
import dayjs from "dayjs";
import { ArrowLeft, ArrowRight, ExternalLink, SearchIcon } from "lucide-react";
import { OrderDetail } from "./Partials/OrderDetail";
import OrderStatus from "./Partials/OrderStatus";
import DeleteOrderAction from "./Partials/DeleteOrderAction";

dayjs.extend(relativeTime);

const totalOf = (order: any) =>
    Number(order.total_amount ?? 0) ||
    order.order_items?.reduce((acc: number, i: any) => acc + Number(i.total), 0) ||
    0;

export default function Invoices({
    auth,
    orders,
    filters,
}: PageProps<{ orders: paginatedOrder; filters: { search: string } }>) {
    const [search, setSearch] = useState(filters?.search ?? "");

    const onSearchChange = useDebouncedCallback((value: string) => {
        router.get(
            route("orders.invoices"),
            value ? { search: value } : {},
            { preserveState: true, preserveScroll: true, replace: true }
        );
    }, 400);

    return (
        <Authenticated user={auth.user}>
            <Head title="Invoices" />

            <section className="space-y-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Invoices
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {orders.total.toLocaleString()} sale
                            {orders.total === 1 ? "" : "s"} recorded.
                        </p>
                    </div>
                    <div className="relative w-full sm:max-w-xs">
                        <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            type="search"
                            value={search}
                            placeholder="Search invoice no. or customer…"
                            className="pl-8"
                            onChange={(e) => {
                                setSearch(e.target.value);
                                onSearchChange(e.target.value);
                            }}
                        />
                    </div>
                </header>

                {/* Desktop */}
                <div className="hidden rounded-xl border border-border bg-card md:block">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Seller</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="w-24" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-28 text-center text-muted-foreground"
                                        >
                                            No invoices found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {orders.data.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium tabular-nums">
                                            #{String(order.id).padStart(2, "0")}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {order?.user?.name ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {order?.customer?.name ?? "Walk-in"}
                                        </TableCell>
                                        <TableCell>
                                            <OrderStatus order={order} />
                                        </TableCell>
                                        <TableCell className="text-right font-medium tabular-nums">
                                            {numberFormat(totalOf(order))}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-muted-foreground">
                                            {dayjs(order.created_at).format(
                                                "DD/MM/YYYY HH:mm"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <OrderDetail order={order} />
                                                <Link
                                                    href={route("orders.invoice", order.id)}
                                                    aria-label={`Open invoice ${order.id}`}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                    >
                                                        <ExternalLink className="size-4" />
                                                    </Button>
                                                </Link>
                                                <DeleteOrderAction order={order} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Mobile */}
                <div className="space-y-2 md:hidden">
                    {orders.data.length === 0 && (
                        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                            No invoices found.
                        </p>
                    )}
                    {orders.data.map((order) => (
                        <div
                            key={order.id}
                            className="rounded-xl border border-border bg-card p-4"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-medium tabular-nums">
                                        #{String(order.id).padStart(2, "0")}
                                    </p>
                                    <p className="truncate text-sm text-muted-foreground">
                                        {order?.customer?.name ?? "Walk-in"} ·{" "}
                                        {order?.user?.name}
                                    </p>
                                </div>
                                <OrderStatus order={order} />
                            </div>
                            <div className="mt-3 flex items-end justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {dayjs(order.created_at).format("DD/MM/YYYY HH:mm")}
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {numberFormat(totalOf(order))}
                                </span>
                            </div>
                            <div className="mt-3 flex items-center gap-1 border-t border-border pt-2">
                                <OrderDetail order={order} />
                                <Link href={route("orders.invoice", order.id)}>
                                    <Button variant="ghost" size="icon" className="size-8">
                                        <ExternalLink className="size-4" />
                                    </Button>
                                </Link>
                                <DeleteOrderAction order={order} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination — the page had none at all, so only the first 50 of
                    thousands of invoices were ever reachable. */}
                {orders.last_page > 1 && (
                    <div className="flex items-center justify-center gap-3 text-sm">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={!orders.prev_page_url}
                            onClick={() =>
                                orders.prev_page_url &&
                                router.get(orders.prev_page_url, {}, { preserveScroll: true })
                            }
                        >
                            <ArrowLeft className="size-4" /> Prev
                        </Button>
                        <span className="text-muted-foreground">
                            {orders.from ?? 0}–{orders.to ?? 0} of{" "}
                            {orders.total.toLocaleString()} · page{" "}
                            <b>{orders.current_page}</b> / {orders.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={!orders.next_page_url}
                            onClick={() =>
                                orders.next_page_url &&
                                router.get(orders.next_page_url, {}, { preserveScroll: true })
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
