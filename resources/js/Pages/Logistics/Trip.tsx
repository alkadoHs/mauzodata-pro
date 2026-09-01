import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { cn, numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Ban,
    CheckCircle2,
    MoreHorizontal,
    Pencil,
    Phone,
    Trash2,
    Undo2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExpensePanel, PaymentPanel } from "./partials/TripLedger";
import { StatusBadge } from "./Trips";
import { Figure } from "./partials/Figure";
import { TripFormDialog } from "./partials/TripFormDialog";
import {
    TripDetail,
    TripExpense,
    TripFigures,
    TripPayment,
} from "./partials/types";

/**
 * One journey, whole.
 *
 * Everything about a trip is on this page because everything about it is one
 * question: was it worth running? The figures sit at the top, and the two
 * things that move them — costs and payments — are added right below without
 * leaving the page.
 */
export default function Trip({
    auth,
    trip,
    figures,
    expenses,
    payments,
    byCategory,
    categories,
    trucks,
    drivers,
    clients,
}: PageProps<{
    trip: TripDetail;
    figures: TripFigures;
    expenses: TripExpense[];
    payments: TripPayment[];
    byCategory: { category: string; label: string; total: number }[];
    categories: Record<string, string>;
    trucks: any[];
    drivers: { id: number; name: string }[];
    clients: { id: number; name: string }[];
}>) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [processing, setProcessing] = useState(false);

    const setStatus = (status: string) =>
        router.patch(
            route("logistics.trips.status", trip.id),
            { status },
            {
                preserveScroll: true,
                onError: () => toast.error("Could not change this trip's status."),
            }
        );

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(route("logistics.trips.destroy", trip.id), {
            onError: () => {
                toast.error("Could not delete this trip.");
                setProcessing(false);
            },
        });
    };

    const cancelled = trip.status === "cancelled";

    return (
        <Authenticated user={auth.user}>
            <Head title={`${trip.reference} · ${trip.origin} → ${trip.destination}`} />

            <section className="flex flex-col gap-4">
                <Link
                    href={route("logistics.trips.index")}
                    className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" /> All trips
                </Link>

                <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight">
                                {trip.origin} → {trip.destination}
                            </h1>
                            <StatusBadge status={trip.status} />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {trip.reference} · dispatched {trip.dispatched_at}
                            {trip.delivered_at ? ` · delivered ${trip.delivered_at}` : ""}
                        </p>

                        <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            <Detail label="Client" value={trip.client?.name} phone={trip.client?.phone} />
                            <Detail label="Truck" value={trip.truck?.label} />
                            <Detail label="Driver" value={trip.driver?.name} phone={trip.driver?.phone} />
                            <Detail
                                label="Cargo"
                                value={
                                    trip.cargo || trip.weight_tons
                                        ? [trip.cargo, trip.weight_tons ? `${numberFormat(trip.weight_tons)} t` : null]
                                              .filter(Boolean)
                                              .join(" · ")
                                        : undefined
                                }
                            />
                        </dl>

                        {trip.notes && (
                            <p className="mt-3 rounded-md bg-muted/50 p-2 text-sm text-muted-foreground">
                                {trip.notes}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {trip.status === "in_transit" && (
                            <Button onClick={() => setStatus("delivered")} className="gap-2">
                                <CheckCircle2 className="size-4" /> Mark delivered
                            </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">Actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditOpen(true)} className="gap-2">
                                    <Pencil className="size-4" /> Edit trip
                                </DropdownMenuItem>
                                {trip.status !== "in_transit" && (
                                    <DropdownMenuItem onClick={() => setStatus("in_transit")} className="gap-2">
                                        <Undo2 className="size-4" /> Put back on the road
                                    </DropdownMenuItem>
                                )}
                                {!cancelled && (
                                    <DropdownMenuItem onClick={() => setStatus("cancelled")} className="gap-2">
                                        <Ban className="size-4" /> Cancel trip
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setDeleting(true)}
                                    className="gap-2 text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="size-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {cancelled && (
                    <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                        This trip is cancelled, so it earns nothing — but anything already
                        spent on it is still counted below, because it was still spent.
                    </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Figure label="Freight" value={figures.freight} />
                    <Figure label="Expenses" value={figures.expenses} tone="out" />
                    <Figure
                        label="Margin"
                        value={figures.margin}
                        tone={figures.margin >= 0 ? "in" : "out"}
                        emphasis
                    />
                    <Figure label="Paid" value={figures.paid} tone="in" />
                    <Figure
                        label="Balance"
                        value={figures.balance}
                        hint={figures.balance > 0 ? "still owed" : "settled"}
                        tone={figures.balance > 0 ? "out" : undefined}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <ExpensePanel
                        tripId={trip.id}
                        expenses={expenses}
                        byCategory={byCategory}
                        categories={categories}
                        total={figures.expenses}
                    />
                    <PaymentPanel
                        tripId={trip.id}
                        payments={payments}
                        total={figures.paid}
                        balance={figures.balance}
                    />
                </div>
            </section>

            <TripFormDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                trip={trip}
                options={{ trucks, drivers, clients }}
            />

            <ConfirmDialog
                open={deleting}
                onOpenChange={(open) => !open && setDeleting(false)}
                title={`Delete ${trip.reference}?`}
                description="The journey and everything recorded against it — every expense and every payment — will be removed. If it simply never happened, cancel it instead."
                confirmLabel="Delete trip"
                confirmText={trip.reference}
                processing={processing}
                onConfirm={confirmDelete}
            />
        </Authenticated>
    );
}

function Detail({
    label,
    value,
    phone,
}: {
    label: string;
    value?: string | null;
    phone?: string | null;
}) {
    return (
        <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </dt>
            <dd className={cn("font-medium", !value && "text-muted-foreground font-normal")}>
                {value ?? "—"}
                {phone && (
                    <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                        <Phone className="size-3" />
                        {phone}
                    </span>
                )}
            </dd>
        </div>
    );
}
