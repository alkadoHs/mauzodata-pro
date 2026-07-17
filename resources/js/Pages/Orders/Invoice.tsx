import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { Button } from "@/components/ui/button";
import { Order } from "@/lib/schemas";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Printer } from "lucide-react";
import { numberFormat } from "@/lib/utils";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import OrderStatus from "@/Pages/Sales/Partials/OrderStatus";

dayjs.extend(relativeTime);

export default function Invoice({ auth, order }: PageProps<{ order: Order }>) {
    const items = order.order_items ?? [];
    const totalPrice = items.reduce((acc, item) => acc + Number(item.total), 0);
    const paid = order.status === "credit" ? Number(order.paid) : totalPrice;
    const due = Math.max(totalPrice - paid, 0);

    return (
        <Authenticated user={auth.user}>
            <Head title={`Invoice #${order.id}`} />

            <section className="space-y-4">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href={route("orders.invoices")}>
                            <Button variant="outline" size="icon" aria-label="Back to invoices">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold tracking-tight">
                                    Invoice #{String(order.id).padStart(2, "0")}
                                </h1>
                                <OrderStatus order={order} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {dayjs(order.created_at).format("DD MMM YYYY HH:mm")}
                            </p>
                        </div>
                    </div>

                    {/* Opens the print-ready receipt, which triggers the print dialog. */}
                    <a href={route("invoices.download", order.id)}>
                        <Button className="gap-2">
                            <Printer className="size-4" /> Print
                        </Button>
                    </a>
                </header>

                <div className="mx-auto w-full max-w-3xl rounded-xl border border-border bg-card p-5 sm:p-8">
                    {/* Branch / issuer */}
                    <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row">
                        <div>
                            <p className="text-lg font-semibold">{order.branch?.name}</p>
                            {(order.branch?.address || order.branch?.city) && (
                                <p className="text-sm text-muted-foreground">
                                    {[order.branch?.address, order.branch?.city]
                                        .filter(Boolean)
                                        .join(", ")}
                                </p>
                            )}
                            {order.branch?.phone && (
                                <p className="text-sm text-muted-foreground">
                                    {order.branch.phone}
                                </p>
                            )}
                        </div>
                        <dl className="text-sm sm:text-right">
                            <div className="flex gap-2 sm:justify-end">
                                <dt className="text-muted-foreground">Bill to</dt>
                                <dd className="font-medium">
                                    {order.customer?.name ?? "Walk-in customer"}
                                </dd>
                            </div>
                            {order.customer?.contact && (
                                <div className="flex gap-2 sm:justify-end">
                                    <dt className="text-muted-foreground">Contact</dt>
                                    <dd>{order.customer.contact}</dd>
                                </div>
                            )}
                            <div className="flex gap-2 sm:justify-end">
                                <dt className="text-muted-foreground">Served by</dt>
                                <dd>{order.user?.name}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Items */}
                    <div className="-mx-5 my-5 overflow-x-auto sm:mx-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-5 py-2 font-medium sm:px-3">Product</th>
                                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                                    <th className="px-3 py-2 text-right font-medium">Price</th>
                                    <th className="px-5 py-2 text-right font-medium sm:px-3">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id} className="border-b border-border/60">
                                        <td className="px-5 py-2.5 sm:px-3">
                                            {item.product?.name ?? "—"}
                                        </td>
                                        <td className="px-3 py-2.5 text-right tabular-nums">
                                            {item.quantity}
                                        </td>
                                        <td className="px-3 py-2.5 text-right tabular-nums">
                                            {numberFormat(item.price)}
                                        </td>
                                        <td className="px-5 py-2.5 text-right tabular-nums sm:px-3">
                                            {numberFormat(item.quantity * item.price)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <dl className="w-full max-w-xs space-y-1.5 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Total</dt>
                                <dd className="font-semibold tabular-nums">
                                    {numberFormat(totalPrice)}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Paid</dt>
                                <dd className="tabular-nums">{numberFormat(paid)}</dd>
                            </div>
                            {due > 0 && (
                                <div className="flex justify-between border-t border-border pt-1.5 text-destructive">
                                    <dt className="font-medium">Due</dt>
                                    <dd className="font-semibold tabular-nums">
                                        {numberFormat(due)}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            </section>
        </Authenticated>
    );
}
