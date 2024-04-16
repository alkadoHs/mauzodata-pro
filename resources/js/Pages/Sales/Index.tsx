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

dayjs.extend(relativeTime);

export default function SalesHistory({
    auth,
    orders,
}: PageProps<{
    orders: paginatedOrder;
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

            <section className="p-4">
                <div className="lg:px-4">
                    <div className="rounded-md whitespace-nowrap border bg-slate-50 dark:bg-slate-800/50 dark:border-gray-800">
                        <div className="flex py-3 justify-between items-center border-x border-t px-3 rounded-t-md dark:border-slate-800">
                            <div className="text-default-400 text-lg font-semibold">
                                Sales
                                <span className="text-green-600">
                                    ({orders.total})
                                </span>{" "}
                            </div>
                            <div className="w-full flex gap-2 items-center justify-end">
                                <Input
                                    type="search"
                                    placeholder="Search "
                                    className="bg-slate-50 dark:bg-transparent sm:max-w-[44%]"
                                    onChange={onSearchChange}
                                />
                                <Button variant={"outline"} size={"sm"}>
                                    <FilterIcon className="size-5 mr-2" /> Filter
                                </Button>

                                <Button size={"sm"} onClick={() => router.visit(route('orders.index'))}>
                                    {" "}
                                    <ReloadIcon className="size-5 mr-2" />
                                    Reload
                                </Button>
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SELLER</TableHead>
                                    <TableHead>INV-NO</TableHead>
                                    <TableHead>PRICE</TableHead>
                                    <TableHead>PAID</TableHead>
                                    <TableHead>DATE</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.map((order) => (
                                    <TableRow key={order.id} onClick={() => alert(`Clicked order with id - 0${order.id}`)}>
                                        <TableCell>
                                            <p className="px-2 dark:border-slate-800">
                                                { order?.user?.name}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="px-2 border-x dark:border-slate-800">{`0${order.id}`}</p>
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
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableHead>TOTAL PRICE</TableHead>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableHead className="bg-violet-500/30">
                                        {/* {numberFormat(
                                        order.order_items.reduce(
                                            (acc, item) =>
                                                acc +
                                                item.price * item.quantity,
                                            0
                                        )
                                    )} */}
                                    </TableHead>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </div>
            </section>
        </Authenticated>
    );
}
