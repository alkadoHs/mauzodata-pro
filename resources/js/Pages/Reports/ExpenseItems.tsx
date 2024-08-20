import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PageProps } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import { Expense, ExpenseItem, PaginatedProduct } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    ArrowRight,
    ChevronFirstIcon,
    ChevronLastIcon,
    DownloadCloud,
    ExternalLink,
} from "lucide-react";
import { dateFormat, dateFormatFilter, numberFormat } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function Expenses({
    auth,
    expenseItems,
}: PageProps<{ expenseItems: ExpenseItem[] }>) {
    return (
        <Authenticated user={auth.user}>
            <Head title="expense items" />

            <section className="p-4 pt-0">
                <header>
                    <h2 className="text-xl my-3">
                        {expenseItems[0]?.expense?.user?.name}
                    </h2>

                    <div className="flex justify-between items-center mb-3">
                        <div className="text-muted-foreground">
                            Expense Items for{" "}
                            <span className="text-indigo-400">
                                {expenseItems[0]?.expense?.user?.name}
                            </span>
                        </div>
                        <div className=""></div>
                    </div>
                </header>
                <div className="rounded-md border bg-slate-50 dark:bg-slate-800/50 dark:border-gray-800">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>S/N</TableHead>
                                <TableHead>COST</TableHead>
                                <TableHead>COST</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenseItems.map((expense, index) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{expense?.item}</TableCell>
                                    <TableCell>
                                        {numberFormat(expense.cost)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex items-center gap-3 justify-center my-3">
                        <Button
                            onClick={() =>
                                router.get(route("reports.expenses"), {
                                    date: dateFormatFilter(
                                        expenseItems[0].created_at
                                    ),
                                })
                            }
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </section>
        </Authenticated>
    );
}
