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
import {
    paginatedOrder
} from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import {
    FilterIcon,
    History
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { OrderDetail } from "./Partials/OrderDetail";
import OrderStatus from "./Partials/OrderStatus";
import { Filter, OrderFilter } from "./Partials/OrderFilter";
import CategoryFilter from "./Partials/CategoryFilter";

dayjs.extend(relativeTime);

export default function SalesHistory({
    auth,
    orders,
    filters
}: PageProps<{
    orders: paginatedOrder;
    filters: Filter
}>) {
    let totalRevenue = orders.data.reduce(
        (acc, order) => acc + Number(order.paid),
        0
    );

    const onSearchChange = useDebouncedCallback(
        (value?: ChangeEvent<HTMLInputElement>) => {
            if (value && value?.target.value.length > 0) {
                router.visit(route("orders.index"), {
                    data: { search: value.target.value },
                    only: ["orders"],
                    preserveScroll: true,
                    preserveState: true,
                });
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
                                    placeholder="Search "
                                    className="bg-slate-50 dark:bg-transparent sm:max-w-[44%]"
                                    onChange={onSearchChange}
                                />
                                <OrderFilter
                                    orders={orders}
                                    filters={filters}
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
                        </Table>
                    </div>
                </div>
            </section>
        </Authenticated>
    );
}
