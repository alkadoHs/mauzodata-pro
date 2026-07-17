import { Order } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ArrowLeft, Printer } from "lucide-react";

dayjs.extend(relativeTime);

/**
 * Print-ready receipt. Deliberately outside the app layout and committed to a
 * light look — it's meant for paper. `print:` utilities strip the on-screen
 * chrome so only the receipt lands on the page.
 */
const Index = ({ auth, invoice }: PageProps<{ invoice: Order }>) => {
    const items = invoice.order_items ?? [];
    const totalPrice = items.reduce((acc, item) => acc + Number(item.total), 0);
    const totalQuantity = items.reduce((acc, item) => acc + Number(item.quantity), 0);
    const paid = invoice.status === "paid" ? totalPrice : Number(invoice.paid);
    const due = Math.max(totalPrice - paid, 0);

    useEffect(() => {
        // Give the layout a tick to settle before the print dialog snapshots it.
        const t = setTimeout(() => window.print(), 300);
        return () => clearTimeout(t);
    }, []);

    const address = [invoice.branch?.address, invoice.branch?.city]
        .filter(Boolean)
        .join(", ");

    return (
        <>
            <Head title={`Invoice ${invoice.id}`} />

            <div className="min-h-dvh bg-neutral-100 py-6 text-neutral-900 print:bg-white print:py-0">
                {/* Screen-only controls — hidden on paper */}
                <div className="mx-auto mb-4 flex max-w-2xl items-center justify-between px-4 print:hidden">
                    <Link
                        href={route("orders.invoice", invoice.id)}
                        className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
                    >
                        <ArrowLeft className="size-4" /> Back
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800"
                    >
                        <Printer className="size-4" /> Print again
                    </button>
                </div>

                <section className="mx-auto max-w-2xl bg-white p-6 text-xs shadow-sm print:max-w-none print:p-0 print:shadow-none">
                    <header className="text-center">
                        <p className="text-2xl font-bold">{invoice.branch?.name}</p>
                        {address && <p>{address}</p>}
                        {invoice.branch?.phone && <p>{invoice.branch.phone}</p>}
                    </header>

                    <hr className="my-3 border-neutral-300" />

                    <div className="flex justify-between">
                        <div>
                            <p>
                                <b>INVOICE NO:</b> #{String(invoice.id).padStart(2, "0")}
                            </p>
                            <p>
                                <b>DATE:</b>{" "}
                                {dayjs(invoice.created_at).format("DD/MM/YYYY HH:mm")}
                            </p>
                        </div>
                        <div className="text-right">
                            <p>
                                <b>CUSTOMER:</b>{" "}
                                {invoice.customer?.name ?? "________"}
                            </p>
                            <p>
                                <b>CONTACT:</b>{" "}
                                {invoice.customer?.contact ?? "________"}
                            </p>
                        </div>
                    </div>

                    <hr className="my-3 border-neutral-300" />

                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-neutral-800 text-left">
                                <th className="py-1.5">Product</th>
                                <th className="py-1.5 text-right">Qty</th>
                                <th className="py-1.5 text-right">Price</th>
                                <th className="py-1.5 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-b border-neutral-200">
                                    <td className="py-1.5">{item.product?.name ?? "—"}</td>
                                    <td className="py-1.5 text-right tabular-nums">
                                        {numberFormat(item.quantity)}
                                    </td>
                                    <td className="py-1.5 text-right tabular-nums">
                                        {numberFormat(item.price)}
                                    </td>
                                    <td className="py-1.5 text-right tabular-nums">
                                        {numberFormat(item.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-neutral-800">
                            <tr>
                                <th className="py-1.5 text-left">TOTAL</th>
                                <td className="py-1.5 text-right tabular-nums">
                                    {numberFormat(totalQuantity)}
                                </td>
                                <td />
                                <th className="py-1.5 text-right tabular-nums">
                                    {numberFormat(totalPrice)}
                                </th>
                            </tr>
                            <tr>
                                <th className="py-1.5 text-left">PAID</th>
                                <td />
                                <td />
                                <th className="py-1.5 text-right tabular-nums">
                                    {numberFormat(paid)}
                                </th>
                            </tr>
                            {due > 0 && (
                                <tr>
                                    <th className="py-1.5 text-left">DUE</th>
                                    <td />
                                    <td />
                                    <th className="py-1.5 text-right tabular-nums">
                                        {numberFormat(due)}
                                    </th>
                                </tr>
                            )}
                        </tfoot>
                    </table>

                    <p className="pt-5 text-center italic">
                        Thank you for trusting us, welcome again!
                    </p>
                    <p className="text-center italic">
                        Issued by: <b>{auth.user.name.toUpperCase()}</b>
                    </p>
                </section>
            </div>
        </>
    );
};

export default Index;
