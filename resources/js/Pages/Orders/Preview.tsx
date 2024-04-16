import CartLayout from "@/Layouts/CartLayout";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { Button } from "@/components/ui/button";
import { Order } from "@/lib/schemas";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import { DownloadCloud, Printer } from "lucide-react";
import { numberFormat } from "@/lib/utils";

dayjs.extend(relativeTime);

export default function Preview({ auth, order }: PageProps<{ order: Order }>) {
    return (
        <CartLayout user={auth.user}>
            <Head title="Invoice preview" />

            <section>
                <div className="flex items-center justify-between px-4">
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight ">
                        Invoice
                    </h3>

                    <div className="flex items-center gap-4">
                        <a
                            href={route("invoices.download", order.id)}
                            target="_blank"
                        >
                            <Button variant={"outline"}>
                                <DownloadCloud className="mr-2 " />
                                Download
                            </Button>
                        </a>
                        <Button>
                            <Printer className="mr-2" /> Print
                        </Button>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg p-8 my-8">
                    <header className="grid grid-cols-2 justify-between">
                        <h2 className=" w-fit h-fit scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 p-3 bg-indigo-500">
                            Invoice #{`0${order.id}`}
                        </h2>

                        <div className="text-right space-y-1.5">
                            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                                {order.branch.name}
                            </h4>
                            <p className="text-sm text-gray-300">
                                {order.branch.address}, {order.branch.city}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {dayjs(order.created_at).format(
                                    "DD MMM YYYY HH:mm"
                                )}
                            </p>
                        </div>
                    </header>

                    <div>
                        <h3 className="scroll-m-20 text-xl font-semibold tracking-tight my-4">
                            BILL TO
                        </h3>

                        <div className="grid gap-2">
                            <p>
                                <span>Name: </span>{" "}
                                <span className="text-muted-foreground inline-block underline uppercase pb-1">
                                    {order?.customer?.name}
                                </span>
                            </p>
                            <p>
                                <span>Contact: </span>{" "}
                                {order?.customer?.contact ? (
                                    <span className="text-muted-foreground inline-block underline pb-1">
                                        {order.customer.contact}
                                    </span>
                                ) : (
                                    <span>___________</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="relative overflow-x-auto my-4">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-200 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">
                                        Product name
                                    </th>
                                    <th scope="col" className="px-6 py-3">
                                        Qty
                                    </th>
                                    <th scope="col" className="px-6 py-3">
                                        Price
                                    </th>
                                    <th scope="col" className="px-6 py-3">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="h last:border-b border-gray-700">
                                {order.order_items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="bg-white dark:bg-gray-800 dark:border-gray-700"
                                    >
                                        <th
                                            scope="row"
                                            className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                                        >
                                            {item.product.name}
                                        </th>
                                        <td className="px-6 py-4">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4">
                                            {numberFormat(item.price)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {numberFormat(
                                                item.quantity * item.price
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end mt-3">
                            <div className="table w-full max-w-xs space-y-3">
                                <div className="table-row ">
                                    <div className="table-cell text-lg text-muted-foreground">
                                        TOTAL PRICE
                                    </div>
                                    <div className="table-cell font-bold">
                                        {numberFormat(
                                            order.order_items.reduce(
                                                (acc, item) =>
                                                    acc +
                                                    item.price * item.quantity,
                                                0
                                            )
                                        )}
                                    </div>
                                </div>
                                <div className="table-row">
                                    <div className="table-cell text-muted-foreground">
                                        PAID AMOUNT{" "}
                                    </div>
                                    <div className="table-cell font-bold">
                                        {numberFormat(order.paid)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </CartLayout>
    );
}
