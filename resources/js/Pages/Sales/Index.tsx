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
import { paginatedOrder, product_sold } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps, User } from "@/types";
import { Head, router } from "@inertiajs/react";
import relativeTime from "dayjs/plugin/relativeTime";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Filter, OrderFilter } from "./Partials/OrderFilter";
import CategoryFilter from "./Partials/CategoryFilter";
import dayjs from "dayjs";

dayjs.extend(relativeTime);

export default function SalesHistory({
    auth,
    orders,
    filters,
    users,
    products_sold,
}: PageProps<{
    orders: paginatedOrder;
    filters: Filter;
    users: User[];
    products_sold: product_sold[];
}>) {
    const totalSales = products_sold.reduce(
        (acc, item) => acc + Number(item.total_price),
        0
    );
    const totalSold = products_sold.reduce(
        (acc, item) => acc + Number(item.total_qty),
        0
    );

    const totalCurrentStock = products_sold.reduce(
        (acc, item) => acc + Number(item.product.stock),
        0
    );

    const totalPrevStock = products_sold.reduce(
        (acc, item) =>
            acc + (Number(item.total_qty) + Number(item.product.stock)),
        0
    );

    const totalProfit = products_sold.reduce(
        (acc, product) => acc + Number(product.total_profit),
        0
    );

    const onSearchChange = useDebouncedCallback(
        (value?: ChangeEvent<HTMLInputElement>) => {
            if (value && value?.target.value) {
                router.visit(route("orders.index"), {
                    data: { search: value.target.value },
                    only: ["products_sold"],
                    preserveScroll: true,
                    preserveState: true,
                });
            } else {
                router.visit(route("orders.index"));
            }
        },
        1000
    );

    return (
        <Authenticated user={auth.user}>
            <Head title="Sales History" />

            <section className="max-w-full">
                <div className="lg:px-4 space-y-4">
                    <div className="rounded-md whitespace-nowrap border bg-slate-50 dark:bg-transparent dark:border-gray-800">
                        <div className="flex gap-4 py-3 justify-between items-center border-x border-t px-3 rounded-t-md dark:border-slate-800">
                            <CategoryFilter />
                            <div className="w-full flex gap-2 items-center justify-end">
                                <Input
                                    type="search"
                                    value={filters?.search}
                                    placeholder="Search product"
                                    className="bg-slate-50 dark:bg-transparent sm:max-w-[44%]"
                                    onChange={onSearchChange}
                                />
                                <OrderFilter
                                    orders={orders}
                                    filters={filters}
                                    users={users}
                                />
                                <Button
                                    size={"icon"}
                                    onClick={() =>
                                        router.visit(route("orders.index"))
                                    }
                                >
                                    <ReloadIcon className="size-5" />
                                    {/* <span className="hidden md:inline-block">Reload</span> */}
                                </Button>
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableHead>PRODUCT</TableHead>
                                <TableHead className="text-right bg-green-600/50">
                                    TOTAL SOLD
                                </TableHead>
                                <TableHead className="text-right">
                                    CURRENT STOCK
                                </TableHead>
                                <TableHead className="text-right bg-indigo-600/50">
                                    PREV STOCK
                                </TableHead>
                                <TableHead className="text-right  bg-green-600/50">
                                    TOTAL PRICE
                                </TableHead>
                                <TableHead className="text-right  bg-orange-900/40">
                                    PROFIT
                                </TableHead>
                            </TableHeader>
                            <TableBody>
                                {products_sold?.map((product, index) => (
                                    <TableRow key={index + 1}>
                                        <TableCell>
                                            {product.product.name}
                                        </TableCell>
                                        <TableCell className="text-right bg-green-800/20">
                                            {numberFormat(product.total_qty)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {numberFormat(
                                                product.product.stock
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right bg-indigo-800/10">
                                            {numberFormat(
                                                Number(product.product.stock) +
                                                    Number(product.total_qty)
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right bg-green-800/20">
                                            {numberFormat(product.total_price)}
                                        </TableCell>

                                        <TableCell className="text-right bg-orange-900/10">
                                            {numberFormat(
                                                product.total_price -
                                                    product.total_buy_price
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableCell>
                                    <b>TOTAL</b>
                                </TableCell>
                                <TableCell className="text-right">
                                    {numberFormat(totalSold)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {numberFormat(totalPrevStock)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {numberFormat(totalCurrentStock)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {numberFormat(totalSales)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {numberFormat(totalProfit)}
                                </TableCell>
                            </TableFooter>
                        </Table>
                        {/* <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SELLER</TableHead>
                                    <TableHead>INV-NO</TableHead>
                                    <TableHead>STATUS</TableHead>
                                    <TableHead>PRICE</TableHead>
                                    <TableHead>PAID</TableHead>
                                    <TableHead>DATE</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <p className="px-2 dark:border-slate-800">
                                                {order?.user?.name}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="px-2 border-x dark:border-slate-800">{`0${order.id}`}</p>
                                        </TableCell>
                                        <TableCell>
                                            <OrderStatus order={order} />
                                        </TableCell>
                                        <TableCell>
                                            <p className="px-2  dark:border-slate-800">
                                                {numberFormat(
                                                    order?.order_items.reduce(
                                                        (acc, item) =>
                                                            acc +
                                                            Number(item.price) *
                                                                item.quantity,
                                                        0
                                                    )
                                                )}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="px-2 border-l dark:border-slate-800">
                                                {numberFormat(order.paid)}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            <p className="px-2 border-l flex gap-2 items-center dark:border-slate-800">
                                                <History className="size-4 " />
                                                {dayjs(order.created_at).format(
                                                    "DD/MM/YYYY HH:mm"
                                                )}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <OrderDetail order={order} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table> */}
                    </div>
                </div>
            </section>
        </Authenticated>
    );
}
