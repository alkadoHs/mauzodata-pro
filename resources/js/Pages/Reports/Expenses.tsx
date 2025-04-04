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
import { Head, router } from "@inertiajs/react";
import { Expense } from "@/lib/schemas";
import {
    ExternalLink
} from "lucide-react";
import { dateFormat, numberFormat } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function Expenses({
    auth,
    expenses,
}: PageProps<{ expenses: Expense[] }>) {
    const totalExpense = expenses.reduce(
        (acc, item) => acc + Number(item.expense_items_sum_cost),
        0
    );
    return (
        <Authenticated user={auth.user}>
            <Head title="Users" />

            <section className="pt-0">
                <header>
                    <h2 className="text-xl my-3">Expenses Report</h2>

                    <div className="flex justify-between items-center mb-3">
                        <div>
                            Total:{" "}
                            <span className="text-indigo-500">
                                {numberFormat(totalExpense)}
                            </span>
                        </div>
                        <div className="">
                            <Input
                                type="date"
                                name="date"
                                onChange={(e) => {
                                    router.get(
                                        route("reports.expenses"),
                                        { date: e.target.value },
                                        { preserveState: true }
                                    );
                                }}
                            />
                        </div>
                    </div>
                </header>
                <div className="rounded-md border bg-slate-50 dark:bg-slate-800/50 dark:border-gray-800">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>S/N</TableHead>
                                <TableHead>SELLER</TableHead>
                                <TableHead>TOTAL COST</TableHead>
                                <TableHead>DATE</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.map((expense, index) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{expense?.user?.name}</TableCell>
                                    <TableCell>
                                        {numberFormat(
                                            expense.expense_items_sum_cost
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {dateFormat(expense.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <a
                                            href={route(
                                                "reports.expenseitems",
                                                expense.id
                                            )}
                                            className="text-green-500"
                                        >
                                            <ExternalLink className="size-5" />
                                        </a>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex items-center gap-3 justify-center my-3">
                        
                    </div>
                </div>
            </section>
        </Authenticated>
    );
}
