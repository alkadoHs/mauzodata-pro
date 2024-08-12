import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PageProps, User } from "@/types";
import { Head, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { DownloadCloud } from "lucide-react";
import { numberFormat } from "@/lib/utils";
import { SalesFilter } from "./partials/SalesFilter";
import { ReloadIcon } from "@radix-ui/react-icons";

const UsersIndex = ({ auth, users }: PageProps<{ users: User[] }>) => {
    let totalSales = 0;
    let totalProfit = 0;
    let totalExpenses = 0;
    let totalCreditReceived = 0;
    let totalNetSales = 0;
    let totalNetProfit = 0;

    return (
        <Authenticated user={auth.user}>
            <Head title="Users" />

            <section className="p-4 pt-0">
                <header>
                    <h2 className="text-xl my-3">Sellers Report</h2>

                    <div className="flex justify-between items-center mb-3">
                        <div>Total</div>
                        <div className="flex items-center gap-3">
                            <SalesFilter />
                            <Button
                                size={"icon"}
                                onClick={() =>
                                    router.visit(route("reports.sales"))
                                }
                            >
                                <ReloadIcon className="size-5" />
                            </Button>
                        </div>
                    </div>
                </header>
                <div className="rounded-md border bg-slate-50 dark:bg-slate-800/50 dark:border-gray-800">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>S/N</TableHead>
                                <TableHead>SELLER</TableHead>
                                <TableHead>SALES</TableHead>
                                <TableHead>PROFIT</TableHead>
                                <TableHead>EXPENSES</TableHead>
                                <TableHead>CREDIT RECEIVED</TableHead>
                                <TableHead>NET SALES</TableHead>
                                <TableHead>NET PROFIT</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users &&
                                users.map(function (user, index) {
                                    const sales = user?.order_items?.reduce(
                                        (acc, item) => acc + Number(item.total),
                                        0
                                    );
                                    totalSales += sales;

                                    const profit = user?.order_items?.reduce(
                                        (acc, item) => acc + item.profit,
                                        0
                                    );

                                    totalProfit += profit;

                                    const expenses =
                                        user?.expense_items?.reduce(
                                            (acc, item) =>
                                                acc + Number(item.cost),
                                            0
                                        );

                                    totalExpenses += expenses;

                                    const credits =
                                        user?.credit_sale_payments?.reduce(
                                            (acc, payment) =>
                                                acc + Number(payment.amount),
                                            0
                                        );

                                    totalCreditReceived += credits;

                                    const netSales =
                                        user?.order_items?.reduce(
                                            (acc, item) =>
                                                acc + Number(item.total),
                                            0
                                        ) +
                                        user?.credit_sale_payments?.reduce(
                                            (acc, payment) =>
                                                acc + Number(payment.amount),
                                            0
                                        ) -
                                        user?.expense_items?.reduce(
                                            (acc, item) =>
                                                acc + Number(item.cost),
                                            0
                                        );

                                    totalNetSales += netSales;

                                    const netProfit =
                                        user.order_items.reduce(
                                            (acc, order) =>
                                                acc + Number(order.profit),
                                            0
                                        ) -
                                        user.expense_items.reduce(
                                            (acc, item) =>
                                                acc + Number(item.cost),
                                            0
                                        );

                                    totalNetProfit += netProfit;

                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>
                                                {numberFormat(sales)}
                                            </TableCell>
                                            <TableCell>
                                                {numberFormat(profit)}
                                            </TableCell>
                                            <TableCell>
                                                {numberFormat(expenses)}
                                            </TableCell>
                                            <TableCell>
                                                {numberFormat(credits)}
                                            </TableCell>
                                            <TableCell>
                                                {numberFormat(netSales)}
                                            </TableCell>
                                            <TableCell>
                                                {numberFormat(netProfit)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableHead>TOTAL</TableHead>
                                <TableHead></TableHead>
                                <TableHead>
                                    {numberFormat(totalSales)}
                                </TableHead>
                                <TableHead>
                                    {numberFormat(totalProfit)}
                                </TableHead>
                                <TableHead>{numberFormat(totalExpenses)}</TableHead>
                                <TableHead>{numberFormat(totalCreditReceived)}</TableHead>
                                <TableHead>{numberFormat(totalNetSales)}</TableHead>
                                <TableHead>{numberFormat(totalNetProfit)}</TableHead>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </section>
        </Authenticated>
    );
};

export default UsersIndex;
