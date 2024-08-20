import { Order } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import { useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const Index = ({ auth, invoice }: PageProps<{ invoice: Order}>) => {
    const totalPrice = invoice.order_items.reduce((acc, item) => acc + Number(item.total), 0 )
    const totalQuantity = invoice.order_items.reduce((acc, item) => acc + Number(item.quantity), 0)

    useEffect(() => {
        print()
    }, [])

    return (
        <>
            <Head title={`Invoice ${invoice.id}`} />

            <section className="bg-gray-100 text-gray-900 min-h-dvh">
                <div className="max-w-2xl mx-auto py-10">
                    <div>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">
                            {invoice?.branch?.name}
                        </p>
                        <p>{`${invoice?.branch?.address}, ${invoice.branch.city}`}</p>
                        <p>{`${auth?.user?.phone}`}</p>
                    </div>
                    <hr />
                    <div className="py-2">
                        <p className="text-lg"></p>
                        <p>
                            <b>INVOICE NO: </b>{" "}
                            <span>#{invoice?.id < 100 ? `0${invoice.id}` :  invoice.id}</span>
                        </p>
                        <p>
                            <b>DATE: </b>{" "}
                            <span>
                                {dayjs(invoice.created_at).format("DD/MM/YYYY")}
                            </span>
                        </p>
                    </div>
                    <hr />
                    <div className="py-2">
                        <p className="text-lg">Customer Information</p>
                        <p>
                            <b>Name: </b>{" "}
                            <span>
                                {invoice?.customer
                                    ? invoice.customer.name
                                    : "________"}
                            </span>
                        </p>
                        <p>
                            <b>Contact: </b>{" "}
                            <span>
                                {invoice?.customer
                                    ? invoice.customer.contact
                                    : "________"}
                            </span>
                        </p>
                    </div>
                    <hr />
                    <div className="pt-4">
                        <table className="collpsible w-full">
                            <thead className="text-white">
                                <tr>
                                    <th className="bg-indigo-500 p-2 text-left">
                                        Product
                                    </th>
                                    <th className="bg-indigo-500 p-2 text-right">
                                        Qty
                                    </th>
                                    <th className="bg-indigo-500 p-2 text-right">
                                        Price
                                    </th>
                                    <th className="bg-indigo-500 p-2 text-right">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600">
                                {invoice?.order_items.map((item, index) => (
                                    <tr className="border-b border-gray-300">
                                        <td className="text-left px-2 py-2">
                                            {item.product.name}
                                        </td>
                                        <td className="text-right px-2 py-2">
                                            {numberFormat(item.quantity)}
                                        </td>
                                        <td className="text-right px-2 py-2">
                                            {numberFormat(item.price)}
                                        </td>
                                        <td className="text-right px-2 py-2">
                                            {numberFormat(item.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th className="text-left">TOTAL</th>
                                    <td className="text-right">
                                        {numberFormat(totalQuantity)}
                                    </td>
                                    <td className="text-right">---</td>
                                    <th className="text-right">
                                        {numberFormat(totalPrice)}
                                    </th>
                                </tr>
                                <tr>
                                    <th className="text-left">PAID</th>
                                    <td className="text-right"> ---</td>
                                    <td className="text-right">---</td>
                                    <th className="text-right">
                                        {invoice.status == "paid"
                                            ? numberFormat(totalPrice)
                                            : numberFormat(invoice.paid)}
                                    </th>
                                </tr>
                            </tfoot>
                        </table>
                        <p className="text-center pt-5">
                            <i>Thank you for trusting us, welcome again!</i>
                        </p>
                        <p className="text-center">
                            <i>
                                Issued by: <b>{auth.user.name.toUpperCase()}</b>
                            </i>
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Index;
