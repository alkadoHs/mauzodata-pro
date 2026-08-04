import { Order } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import dayjs from "dayjs";

/**
 * The customer-facing receipt, used everywhere a sale is shown on paper or
 * pretending to be on paper: the print page, the after-sale preview and the
 * invoice screen.
 *
 * Sized in millimetres so it lands the same on an 80mm till roll as on A4, and
 * colours are forced to print — browsers drop background and text colour by
 * default, which would silently lose the CREDIT stamp.
 */

/** Browsers strip colour when printing unless asked not to. */
const keepColour = {
    WebkitPrintColorAdjust: "exact",
    printColorAdjust: "exact",
} as const;

type Props = {
    order: Order;
    /** Falls back to the order's own seller when not given. */
    agent?: string;
};

export default function Receipt({ order, agent }: Props) {
    const items = order.order_items ?? [];
    const gross = items.reduce((acc, item) => acc + Number(item.total), 0);

    // A credit sale only ever banked its down payment; anything else is settled
    // in full by definition (orders.paid is unreliable for non-credit sales).
    const cash = order.status === "credit" ? Number(order.paid ?? 0) : gross;
    const balance = Math.max(gross - cash, 0);

    const branch = order.branch;
    const company = branch?.company;

    // The branch's own details win; the company's stand in when it has none.
    const address =
        [branch?.address, branch?.city].filter(Boolean).join(", ") ||
        company?.address ||
        "";
    const phone = branch?.phone || company?.phone || "";
    const title = company?.name || branch?.name || "";

    return (
        <article
            className="mx-auto w-full max-w-[340px] bg-white px-4 py-5 font-sans text-[11px] leading-snug text-neutral-900 print:max-w-[80mm] print:px-2 print:py-0"
            style={keepColour}
        >
            <header className="text-center">
                <h1 className="text-base font-bold uppercase tracking-wide">
                    {title}
                </h1>
                {address && (
                    <p className="mt-0.5">
                        <span className="font-medium">Address :</span> {address}
                    </p>
                )}
                {phone && (
                    <p>
                        <span className="font-medium">Tel :</span> {phone}
                    </p>
                )}
            </header>

            <Rule />

            <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                <Field label="Rcpt_No." value={`#${order.invoice_number ?? order.id}`} />
                <Field
                    label="Date"
                    value={dayjs(order.created_at).format("DD/MM/YY")}
                />
                <Field
                    label="Time."
                    value={dayjs(order.created_at).format("HH:mm:ss")}
                />
                <Field label="Agent" value={agent ?? order.user?.name ?? "—"} />
            </dl>

            <Rule />

            <dl className="space-y-1">
                <Field
                    label="Name :"
                    value={order.customer?.name ?? "Walk-in customer"}
                    uppercase
                />
                <Field label="Branch :" value={branch?.name ?? "—"} uppercase />
            </dl>

            <Rule />

            <table className="w-full">
                <thead>
                    <tr className="text-left align-bottom">
                        <th className="pb-1 font-bold">Items</th>
                        <th className="pb-1 text-right font-bold">Qty</th>
                        <th className="pb-1 text-right font-bold">Price</th>
                        <th className="pb-1 text-right font-bold">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={4} className="py-3 text-center">
                                No items on this sale.
                            </td>
                        </tr>
                    )}
                    {items.map((item) => (
                        <tr key={item.id} className="align-top">
                            <td className="py-1 pr-2 font-semibold">
                                {item.product?.name ?? "—"}
                            </td>
                            <td className="py-1 whitespace-nowrap text-right tabular-nums">
                                {numberFormat(item.quantity)}{" "}
                                {item.product?.unit?.toUpperCase() ?? ""}
                            </td>
                            <td className="py-1 text-right tabular-nums">
                                {numberFormat(item.price)}
                            </td>
                            <td className="py-1 text-right tabular-nums">
                                {numberFormat(item.total)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Rule />

            {/* The stamp sits over the totals, as on a stamped paper receipt. */}
            <section className="relative">
                <div className="flex items-baseline justify-between">
                    <span className="text-[13px] font-bold">Gross_Total:</span>
                    <span className="text-[13px] font-bold tabular-nums">
                        {numberFormat(gross)}
                    </span>
                </div>

                <div className="mt-1.5 flex items-baseline justify-between border-b border-neutral-200 pb-1.5">
                    <span>Cash</span>
                    <span
                        className="tabular-nums text-emerald-600"
                        style={keepColour}
                    >
                        {numberFormat(cash)}
                    </span>
                </div>

                {balance > 0 && (
                    <div
                        className="mt-1.5 flex items-baseline justify-between border-t border-red-300 pt-1.5"
                        style={keepColour}
                    >
                        <span className="text-[13px] font-bold text-red-600">
                            Balance_Due:
                        </span>
                        <span className="text-[13px] font-bold tabular-nums text-red-600">
                            {numberFormat(balance)}
                        </span>
                    </div>
                )}

                <Stamp paid={balance <= 0} />
            </section>

            <p className="pt-6 text-center text-[11px] font-medium italic">
                ********THANK YOU!*******
            </p>
        </article>
    );
}

/** A label/value pair; the label carries the weight, as on the printed slip. */
function Field({
    label,
    value,
    uppercase = false,
}: {
    label: string;
    value: string;
    uppercase?: boolean;
}) {
    return (
        <div className="flex gap-1.5">
            <dt className="shrink-0 font-bold">{label}</dt>
            <dd className={uppercase ? "uppercase" : undefined}>{value}</dd>
        </div>
    );
}

function Rule() {
    return <hr className="my-2 border-t-2 border-neutral-900" />;
}

/**
 * The round stamp over the totals: red CREDIT while money is still owed, green
 * PAID once it is not.
 */
function Stamp({ paid }: { paid: boolean }) {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
            <div
                className={`flex size-[72px] -rotate-12 items-center justify-center rounded-full border-2 ${
                    paid ? "border-emerald-500/35" : "border-red-500/35"
                }`}
                style={keepColour}
            >
                <span
                    className={`text-[10px] font-bold tracking-[0.2em] ${
                        paid ? "text-emerald-600/40" : "text-red-600/40"
                    }`}
                >
                    {paid ? "PAID" : "CREDIT"}
                </span>
            </div>
        </div>
    );
}
