import Receipt from "@/components/Receipt";
import { Button } from "@/components/ui/button";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Order } from "@/lib/schemas";
import OrderStatus from "@/Pages/Sales/Partials/OrderStatus";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ArrowLeft, Printer } from "lucide-react";

dayjs.extend(relativeTime);

/**
 * A past sale, shown as the exact receipt the customer was given.
 */
export default function Invoice({ auth, order }: PageProps<{ order: Order }>) {
    return (
        <Authenticated user={auth.user}>
            <Head title={`Receipt #${order.invoice_number ?? order.id}`} />

            <section className="space-y-4">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href={route("orders.invoices")}>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Back to invoices"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold tracking-tight">
                                    Receipt #{order.invoice_number ?? order.id}
                                </h1>
                                <OrderStatus order={order} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {dayjs(order.created_at).format(
                                    "DD MMM YYYY HH:mm"
                                )}
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

                <div className="mx-auto w-fit rounded-lg border border-border bg-white shadow-sm">
                    <Receipt order={order} />
                </div>
            </section>
        </Authenticated>
    );
}
