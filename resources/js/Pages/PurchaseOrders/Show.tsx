import { Head, Link, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import { PurchaseOrder } from "@/lib/schemas";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { dateTimeFormat, numberFormat } from "@/lib/utils";
import { ArrowLeft, Ban, CheckCircle2, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "./Partials/StatusBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function PurchaseOrderShow({
    auth,
    purchaseOrder,
}: PageProps<{ purchaseOrder: PurchaseOrder }>) {
    const [receiving, setReceiving] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const totalValue = purchaseOrder.items.reduce(
        (acc, i) => acc + i.quantity * i.cost,
        0
    );
    const totalUnits = purchaseOrder.items.reduce((acc, i) => acc + Number(i.quantity), 0);
    const isPending = purchaseOrder.status === "pending";

    const act = (
        routeName: string,
        successMessage: string,
        close: () => void
    ) => {
        setProcessing(true);
        setError(undefined);
        router.post(
            route(routeName, purchaseOrder.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(successMessage);
                    close();
                },
                onError: (errors) => setError(errors.status ?? "Something went wrong."),
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <Authenticated user={auth.user}>
            <Head title={`PO-${purchaseOrder.id}`} />

            <section className="space-y-4">
                <header className="flex flex-wrap items-start justify-between gap-3 print:hidden">
                    <div className="flex items-center gap-3">
                        <Link href={route("purchase-orders.index")}>
                            <Button variant="outline" size="icon" aria-label="Back">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold tracking-tight">
                                    PO-{purchaseOrder.id}
                                </h1>
                                <StatusBadge status={purchaseOrder.status} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {purchaseOrder.supplier?.name} ·{" "}
                                {dateTimeFormat(purchaseOrder.created_at)}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => window.print()}
                        >
                            <Printer className="size-4" /> Print
                        </Button>
                        {isPending && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-destructive"
                                    onClick={() => {
                                        setError(undefined);
                                        setCancelling(true);
                                    }}
                                >
                                    <Ban className="size-4" /> Cancel order
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => {
                                        setError(undefined);
                                        setReceiving(true);
                                    }}
                                >
                                    <CheckCircle2 className="size-4" /> Receive stock
                                </Button>
                            </>
                        )}
                    </div>
                </header>

                {isPending && (
                    <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground print:hidden">
                        This order is pending — nothing has been added to your stock yet.
                        Choose <b>Receive stock</b> once the delivery arrives.
                    </p>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Items */}
                    <div className="rounded-xl border border-border bg-card lg:col-span-2">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchaseOrder.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.product?.name ?? "—"}
                                                {item.product?.unit && (
                                                    <span className="ml-1 text-xs text-muted-foreground">
                                                        ({item.product.unit})
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {numberFormat(item.cost)}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {numberFormat(item.quantity * item.cost)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            {purchaseOrder.items.length} product
                                            {purchaseOrder.items.length === 1 ? "" : "s"} ·{" "}
                                            {totalUnits} units
                                        </TableCell>
                                        <TableCell colSpan={2} className="text-right font-medium">
                                            Total
                                        </TableCell>
                                        <TableCell className="text-right font-semibold tabular-nums">
                                            {numberFormat(totalValue)}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="space-y-4">
                        <InfoCard title="Supplier">
                            <Row label="Name" value={purchaseOrder.supplier?.name} />
                            <Row label="Email" value={purchaseOrder.supplier?.email} />
                            <Row label="Phone" value={purchaseOrder.supplier?.phone} />
                        </InfoCard>

                        <InfoCard title="Order">
                            <Row label="Created by" value={purchaseOrder.user?.name} />
                            <Row
                                label="Date"
                                value={dateTimeFormat(purchaseOrder.created_at)}
                            />
                            {purchaseOrder.notes && (
                                <Row label="Notes" value={purchaseOrder.notes} />
                            )}
                        </InfoCard>
                    </div>
                </div>
            </section>

            <ConfirmDialog
                open={receiving}
                onOpenChange={(o) => !o && setReceiving(false)}
                title="Receive this stock?"
                description="This adds the ordered quantities to your stock and updates each product's buying price. It can't be undone."
                confirmLabel="Receive stock"
                processing={processing}
                error={error}
                onConfirm={() =>
                    act("purchase-orders.receive", "Stock received", () =>
                        setReceiving(false)
                    )
                }
            >
                <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
                    <p className="text-muted-foreground">
                        {purchaseOrder.items.length} product
                        {purchaseOrder.items.length === 1 ? "" : "s"} · {totalUnits} units
                        worth <b className="text-foreground">{numberFormat(totalValue)}</b>{" "}
                        will be added to stock.
                    </p>
                </div>
            </ConfirmDialog>

            <ConfirmDialog
                open={cancelling}
                onOpenChange={(o) => !o && setCancelling(false)}
                title="Cancel this order?"
                description="The order is kept for your records but marked cancelled. No stock is affected."
                confirmLabel="Cancel order"
                processing={processing}
                error={error}
                onConfirm={() =>
                    act("purchase-orders.cancel", "Order cancelled", () =>
                        setCancelling(false)
                    )
                }
            />
        </Authenticated>
    );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">{title}</h2>
            <dl className="space-y-1 text-sm">{children}</dl>
        </div>
    );
}

function Row({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right">{value || "—"}</dd>
        </div>
    );
}
