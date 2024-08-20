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
import {
    product_sold
} from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import { Banknote, DollarSign } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Authenticated from "@/Layouts/AuthenticatedLayout";

dayjs.extend(relativeTime);

const SalesHistory = ({
    auth,
    orders,
    payments,
    expenses,
    products_sold,
}: PageProps<{
    orders: number;
    payments: number;
    expenses: number;
    products_sold: product_sold[];
}>) => {
    const totalSales = products_sold.reduce(
        (acc, item) => acc + Number(item.total_price),
        0
    );
    const totalSold = products_sold.reduce(
        (acc, item) => acc + Number(item.total_qty),
        0
    );
    return (
        <Authenticated user={auth.user}>
            <Head title="Sales History" />

            <section className="">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Sales
                            </CardTitle>
                            <DollarSign className="size-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {numberFormat(orders)}
                            </div>
                            <p className="text-xs text-primary">
                                NET{" "}
                                <span className="text-green-500">
                                    {numberFormat(Number(orders) - Number(expenses))}
                                </span>
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
                                {numberFormat(expenses)}
                            </div>
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
                                {numberFormat(payments)}
                            </div>
                            <p className="text-xs text-primary">
                                TOTAL REVENUES {" "}
                                <span className="text-green-500">
                                    {numberFormat(Number(orders) + Number(payments) - Number(expenses))}
                                </span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="">
                    <header className="py-3">
                        <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
                            Products sold
                        </h3>
                    </header>

                    <div className="rounded-md border  dark:border-gray-800">
                        <Table>
                            <TableHeader>
                                <TableHead>PRODUCT</TableHead>
                                <TableHead>TOTAL SOLD</TableHead>
                                <TableHead>TOTAL PRICE</TableHead>
                            </TableHeader>
                            <TableBody>
                                {products_sold?.map((product, index) => (
                                    <TableRow key={product.product_id}>
                                        <TableCell>
                                            {product.product.name}
                                        </TableCell>
                                        <TableCell>
                                            {numberFormat(product.total_qty)}
                                        </TableCell>
                                        <TableCell>
                                            {numberFormat(product.total_price)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableCell>
                                    <b>TOTAL</b>
                                </TableCell>
                                <TableCell>{numberFormat(totalSold)}</TableCell>
                                <TableCell>
                                    {numberFormat(totalSales)}
                                </TableCell>
                            </TableFooter>
                        </Table>
                    </div>
                </div>
            </section>
        </Authenticated>
    );
};

export default SalesHistory;
