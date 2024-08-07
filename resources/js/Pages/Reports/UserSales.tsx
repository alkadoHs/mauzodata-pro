import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PageProps, User } from "@/types";
import { Head } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { DownloadCloud } from "lucide-react";
import { numberFormat } from "@/lib/utils";

const UsersIndex = ({ auth, users }: PageProps<{ users: User[] }>) => {
    return (
        <Authenticated user={auth.user}>
            <Head title="Users" />

            <section className="p-4 pt-0">
                <header>
                    <h2 className="text-xl my-3">Sellers Report</h2>

                    <div className="flex justify-between items-center mb-3">
                        <div>Total</div>
                        <div>
                            <Button>
                                <DownloadCloud className="mr-2 size-5" />
                                Download
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
                                users.map((user, index) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>
                                            {numberFormat(
                                                user.order_items.reduce(
                                                    (acc, item) =>
                                                        acc + item.total,
                                                    0
                                                )
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {numberFormat(
                                                user.order_items.reduce(
                                                    (acc, item) =>
                                                        acc +
                                                        (item.total -
                                                            item.product
                                                                .buy_price *
                                                                item.quantity),
                                                    0
                                                )
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {numberFormat(
                                                user.expense_items.reduce(
                                                    (acc, item) =>
                                                        acc + Number(item.cost),
                                                    0
                                                )
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {numberFormat(
                                                user.credit_sale_payments.reduce(
                                                    (acc, payment) =>
                                                        acc +
                                                        Number(payment.amount),
                                                    0
                                                )
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {numberFormat(
                                                user.orders.reduce(
                                                    (acc, item) =>
                                                        acc + Number(item.paid),
                                                    0
                                                ) +
                                                    user.credit_sale_payments.reduce(
                                                        (acc, payment) =>
                                                            acc +
                                                            Number(
                                                                payment.amount
                                                            ),
                                                        0
                                                    ) -
                                                    user.expense_items.reduce(
                                                        (acc, item) =>
                                                            acc +
                                                            Number(item.cost),
                                                        0
                                                    )
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {numberFormat(
                                                user.order_items.reduce(
                                                    (acc, order) =>
                                                        acc +
                                                        (order.price -
                                                            order.product
                                                                .buy_price) *
                                                            order.quantity,
                                                    0
                                                ) -
                                                    user.expense_items.reduce(
                                                        (acc, item) =>
                                                            acc +
                                                            Number(item.cost),
                                                        0
                                                    )
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </div>
            </section>
        </Authenticated>
    );
};

export default UsersIndex;
