import { ExpenseItem } from "@/lib/schemas";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import ExpenseForm from "./Partials/ExpenseForm";
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
import { numberFormat } from "@/lib/utils";
import dayjs from "dayjs";
import { Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";

const UserExpenses = ({
    auth,
    expenseItems,
    total,
}: PageProps<{ expenseItems: ExpenseItem[]; total: number }>) => {
    const remove = (item: ExpenseItem) =>
        router.delete(route("expenses.items.destroy", item.id), {
            preserveScroll: true,
            onSuccess: () => toast.success("Expense removed"),
            onError: () => toast.error("Could not remove that expense."),
        });

    return (
        <Authenticated user={auth.user}>
            <Head title="Expenses" />

            <section className="space-y-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Expenses</h1>
                        <p className="text-sm text-muted-foreground">
                            Money you've spent today · {dayjs().format("DD MMM YYYY")}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-4 py-2 text-right">
                        <span className="text-xs text-muted-foreground">Today's total</span>
                        <p className="text-xl font-semibold tabular-nums">
                            {numberFormat(total)}
                        </p>
                    </div>
                </header>

                <ExpenseForm />

                <div className="rounded-xl border border-border bg-card">
                    <div className="border-b border-border p-4">
                        <h2 className="font-medium">
                            Today's expenses{" "}
                            <span className="text-sm font-normal text-muted-foreground">
                                ({expenseItems.length})
                            </span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenseItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-28 text-center text-muted-foreground"
                                        >
                                            <span className="flex flex-col items-center gap-2">
                                                <Receipt className="size-6 opacity-50" />
                                                Nothing logged today.
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    expenseItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.item}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {numberFormat(item.cost)}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-muted-foreground">
                                                {dayjs(item.created_at).format("HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                {/* Previously there was no way to undo a typo. */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive"
                                                    aria-label={`Remove ${item.item}`}
                                                    onClick={() => remove(item)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </section>
        </Authenticated>
    );
};

export default UserExpenses;
