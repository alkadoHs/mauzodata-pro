import { Button } from "@/components/ui/button";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import dayjs from "dayjs";
import { Printer } from "lucide-react";

type Item = {
    id: number;
    stock: number;
    received_stock: number | null;
    product: { id: number; name: string; unit: string } | null;
    to_product: { id: number; name: string; unit: string } | null;
};

type Transfer = {
    id: number;
    status: "pending" | "transferred" | "received";
    created_at: string;
    received_at: string | null;
    branch: { id: number; name: string } | null;
    from_branch: { id: number; name: string } | null;
    user: { id: number; name: string } | null;
    received_by: { id: number; name: string } | null;
    product_transfer_items: Item[];
};

const statusLabel: Record<string, string> = {
    pending: "Not sent",
    transferred: "In transit — awaiting confirmation",
    received: "Received",
};

/** The delivery note: what left, where it is going, and what landed. */
const Show = ({
    auth,
    productTransfer,
}: PageProps<{ productTransfer: Transfer }>) => {
    const items = productTransfer.product_transfer_items ?? [];
    const received = productTransfer.status === "received";

    return (
        <Authenticated user={auth.user}>
            <Head title={`Transfer #${productTransfer.id}`} />

            <section className="mx-auto w-full max-w-3xl rounded-lg border bg-card p-6 print:border-0 print:p-0">
                <div className="text-center">
                    <h1 className="text-xl font-semibold uppercase">
                        Stock transfer note
                    </h1>
                    <p className="text-lg uppercase">
                        {productTransfer.from_branch?.name ?? "—"} &rarr;{" "}
                        {productTransfer.branch?.name ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        #{productTransfer.id} ·{" "}
                        {dayjs(productTransfer.created_at).format(
                            "DD MMM YYYY HH:mm"
                        )}{" "}
                        · sent by {productTransfer.user?.name ?? "—"}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                        {statusLabel[productTransfer.status] ??
                            productTransfer.status}
                        {received && productTransfer.received_at && (
                            <>
                                {" "}
                                by{" "}
                                {productTransfer.received_by?.name ?? "—"} on{" "}
                                {dayjs(productTransfer.received_at).format(
                                    "DD MMM YYYY HH:mm"
                                )}
                            </>
                        )}
                    </p>
                </div>

                <table className="mt-5 w-full text-sm">
                    <thead>
                        <tr className="border-y text-left">
                            <th className="py-2">Product</th>
                            <th className="py-2">Added to</th>
                            <th className="py-2 text-right">Sent</th>
                            {received && (
                                <th className="py-2 text-right">Received</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => {
                            const short =
                                received &&
                                Number(item.received_stock) < Number(item.stock);

                            return (
                                <tr key={item.id} className="border-b">
                                    <td className="py-2">
                                        {item.product?.name ?? "—"}
                                    </td>
                                    <td className="py-2 text-muted-foreground">
                                        {item.to_product?.name ?? "—"}
                                    </td>
                                    <td className="py-2 text-right tabular-nums">
                                        {numberFormat(item.stock)}{" "}
                                        {item.product?.unit}
                                    </td>
                                    {received && (
                                        <td
                                            className={`py-2 text-right tabular-nums ${
                                                short
                                                    ? "font-semibold text-red-600"
                                                    : ""
                                            }`}
                                        >
                                            {numberFormat(
                                                item.received_stock ?? 0
                                            )}{" "}
                                            {item.product?.unit}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="mt-6 flex justify-center print:hidden">
                    <Button onClick={() => window.print()} className="gap-2">
                        <Printer className="size-4" /> Print
                    </Button>
                </div>
            </section>
        </Authenticated>
    );
};

export default Show;
