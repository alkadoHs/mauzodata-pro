import Receipt from "@/components/Receipt";
import { Button } from "@/components/ui/button";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Order } from "@/lib/schemas";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { Check, Printer, ShoppingBasket } from "lucide-react";

/**
 * Shown straight after a sale: the same receipt the customer gets, so the
 * seller can check it before printing.
 */
export default function Preview({ auth, order }: PageProps<{ order: Order }>) {
    return (
        <Authenticated user={auth.user}>
            <Head title="Receipt preview" />

            <section className="flex flex-col gap-4">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                            <Check className="size-4" />
                        </span>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">
                                Sale recorded
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Receipt #{order.invoice_number ?? order.id}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={route("cart.index")}>
                            <Button variant="outline" className="gap-2">
                                <ShoppingBasket className="size-4" /> New sale
                            </Button>
                        </Link>
                        <a href={route("invoices.download", order.id)}>
                            <Button className="gap-2">
                                <Printer className="size-4" /> Print
                            </Button>
                        </a>
                    </div>
                </header>

                <div className="mx-auto w-fit rounded-lg border border-border bg-white shadow-sm">
                    <Receipt order={order} />
                </div>
            </section>
        </Authenticated>
    );
}
