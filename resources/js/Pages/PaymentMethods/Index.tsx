import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaymentMethod } from "@/lib/schemas";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { PaymentMethodFormDialog } from "./Partials/PaymentMethodFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type PaymentMethodRow = PaymentMethod & { orders_count: number };

const Index = ({
    auth,
    paymentMethods,
}: PageProps<{ paymentMethods: PaymentMethodRow[] }>) => {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<PaymentMethodRow | null>(null);
    const [deleting, setDeleting] = useState<PaymentMethodRow | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (method: PaymentMethodRow) => {
        setEditing(method);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleting) return;
        setProcessing(true);
        setError(undefined);

        router.delete(route("payments.destroy", deleting.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Payment method deleted");
                setDeleting(null);
            },
            onError: () => setError("Could not delete this payment method."),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Authenticated user={auth.user}>
            <Head title="Payment methods" />

            <section className="space-y-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Payment methods
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            How customers can pay at checkout.
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="size-4" /> Add method
                    </Button>
                </header>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">
                                        Used by orders
                                    </TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paymentMethods.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="h-28 text-center text-muted-foreground"
                                        >
                                            <span className="flex flex-col items-center gap-2">
                                                <CreditCard className="size-6 opacity-50" />
                                                No payment methods yet.
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {paymentMethods.map((method) => (
                                    <TableRow key={method.id}>
                                        <TableCell className="font-medium">
                                            {method.name}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {method.orders_count > 0 ? (
                                                <Badge variant="secondary">
                                                    {method.orders_count.toLocaleString()}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                        <span className="sr-only">
                                                            Actions
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => openEdit(method)}
                                                        className="gap-2"
                                                    >
                                                        <Pencil className="size-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setError(undefined);
                                                            setDeleting(method);
                                                        }}
                                                        className="gap-2 text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="size-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </section>

            <PaymentMethodFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                paymentMethod={editing}
            />

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.name ?? "payment method"}?`}
                description="Customers will no longer be able to pay with this method."
                confirmLabel="Delete"
                processing={processing}
                error={error}
                onConfirm={confirmDelete}
            >
                {!!deleting?.orders_count && (
                    <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                        {deleting.orders_count.toLocaleString()} existing order
                        {deleting.orders_count === 1 ? "" : "s"} used this method.
                        They keep their history but will no longer show a payment
                        method.
                    </p>
                )}
            </ConfirmDialog>
        </Authenticated>
    );
};

export default Index;
