import CartLayout from "@/Layouts/CartLayout";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CreditSalePayment, ExpenseItem, Order } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import { Banknote, DollarSign, HistoryIcon } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import EmptyPlaceHolder from "@/components/EmptyPlaceHolder";

dayjs.extend(relativeTime);

const SalesHistory = ({
    auth,
    orders,
    payments,
    expenses,
}: PageProps<{ orders: Order[]; payments: CreditSalePayment[], expenses: ExpenseItem[] }>) => {
    let totalRevenue = orders.reduce(
        (acc, order) => acc + Number(order.paid),
        0
    );

    const creditsReceived = payments.reduce(
        (acc, item) => acc + Number(item.amount),
        0
    );

    const totalExpenses = expenses.reduce((acc, item) => acc + Number(item.cost), 0)

    return (
        <CartLayout user={auth.user}>
            <Head title="Sales History" />

            <section className="p-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Revenue
                            </CardTitle>
                            <DollarSign className="size-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {numberFormat(totalRevenue)}
                            </div>
                            <p className="text-xs text-primary">
                                +20.1% from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-orange-500/10 dark:bg-orange-500/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Expenses
                            </CardTitle>
                            <Banknote className="size-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {numberFormat(totalExpenses)}
                            </div>
                            <p className="text-xs text-primary">
                                +20.1% from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Credit Received
                            </CardTitle>
                            <DollarSign className="size-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {numberFormat(creditsReceived)}
                            </div>
                            <p className="text-xs text-primary">
                                +20.1% from last month
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="p-4">
                    <header>
                        <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
                            Products you sold
                        </h3>
                    </header>
                    <Accordion type="multiple" className="w-full">
                        {orders.length ? (
                            orders.map((order) => (
                                <AccordionItem
                                    key={order.id}
                                    value={order.invoice_number}
                                >
                                    <AccordionTrigger>
                                        <div className="max-w-sm lg:max-w-xl w-full flex gap-3 justify-between items-center">
                                            <p>INV - {`0${order.id}`}</p>
                                            {order.customer ? (
                                                <p className="bg-zinc-500/30">
                                                    {order.customer.name}
                                                </p>
                                            ) : null}
                                            <p className="bg-slate-500/30 p-1">
                                                PAID ={" "}
                                                {numberFormat(order.paid)}{" "}
                                            </p>
                                            <p className="text-muted-foreground flex gap-2">
                                                <HistoryIcon className="size-4" />{" "}
                                                <span>
                                                    {dayjs(
                                                        order.created_at
                                                    ).fromNow()}
                                                </span>
                                            </p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        PRODUCT
                                                    </TableHead>
                                                    <TableHead>QTY</TableHead>
                                                    <TableHead>PRICE</TableHead>
                                                    <TableHead>TOTAL</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {order?.order_items.map(
                                                    (item) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell>
                                                                {
                                                                    item.product
                                                                        .name
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {numberFormat(
                                                                    item.quantity
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {numberFormat(
                                                                    item.price
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {numberFormat(
                                                                    item.price *
                                                                        item.quantity
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )}
                                            </TableBody>
                                            <TableFooter>
                                                <TableRow>
                                                    <TableHead>
                                                        TOTAL PRICE
                                                    </TableHead>
                                                    <TableCell></TableCell>
                                                    <TableCell></TableCell>
                                                    <TableHead className="bg-violet-500/30">
                                                        {numberFormat(
                                                            order.order_items.reduce(
                                                                (acc, item) =>
                                                                    acc +
                                                                    item.price *
                                                                        item.quantity,
                                                                0
                                                            )
                                                        )}
                                                    </TableHead>
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                            ))
                        ) : (
                            <EmptyPlaceHolder message="You haven't sold anything today." />
                        )}
                    </Accordion>
                </div>
            </section>
        </CartLayout>
    );
};

export default SalesHistory;
