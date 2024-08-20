import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Table,
    TableBody,
    TableCell, TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { paginatedOrder } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import relativeTime from "dayjs/plugin/relativeTime";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import { ChangeEvent } from "react";
import dayjs from "dayjs";
import { ExternalLink, History } from "lucide-react";
import { OrderDetail } from "./Partials/OrderDetail";
import OrderStatus from "./Partials/OrderStatus";
import DeleteOrderAction from "./Partials/DeleteOrderAction";

dayjs.extend(relativeTime);

export default function SalesHistory({
    auth,
    orders,
}: // filters,
// users,
// products_sold,
PageProps<{
    orders: paginatedOrder;
    // filters: Filter;
    // users: User[];
    // products_sold: product_sold[];
}>) {
    const onSearchChange = useDebouncedCallback(
        (value?: ChangeEvent<HTMLInputElement>) => {
            if (value && value?.target.value) {
                router.visit(route("orders.invoices"), {
                    data: { search: value.target.value },
                    preserveScroll: true,
                    preserveState: true,
                });
            } else {
                router.visit(route("orders.invoices"));
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
                            <div className="text-default-400 text-lg font-semibold">
                                Invoices
                                <span className="text-primary">
                                    ({orders.total})
                                </span>{" "}
                            </div>

                            <Input
                                type="search"
                                placeholder="search by invoice no..."
                                className="max-w-sm"
                                onChange={onSearchChange}
                            />
                            {/* <div className="w-full flex gap-2 items-center justify-end">
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
                                </Button>
                            </div> */}
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SELLER</TableHead>
                                    <TableHead>INV-NO</TableHead>
                                    <TableHead>STATUS</TableHead>
                                    <TableHead>PRICE</TableHead>
                                    <TableHead>DATE</TableHead>
                                    <TableHead></TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders?.data.map((order) => (
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
                                                            Number(item.total),
                                                        0
                                                    )
                                                )}
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
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <a
                                                    href={route(
                                                        "orders.invoice",
                                                        order.id
                                                    )}
                                                    className="text-green-500"
                                                >
                                                    <ExternalLink className="size-5" />
                                                </a>

                                                <DeleteOrderAction order={order}  />
                                            </div>
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
