import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import dayjs from "dayjs";
import { Check, PackageCheck, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Item = {
    id: number;
    stock: number;
    product: { id: number; name: string; unit: string } | null;
    to_product: { id: number; name: string; unit: string; stock: number } | null;
};

type Incoming = {
    id: number;
    created_at: string;
    status: string;
    from_branch: { id: number; name: string } | null;
    branch: { id: number; name: string } | null;
    user: { id: number; name: string } | null;
    product_transfer_items: Item[];
};

/**
 * Deliveries on their way to this branch. Confirming one adds the stock — to
 * the item the sender named, so there is nothing to pick and nothing to mistype.
 */
export default function IncomingTransfers({
    auth,
    transfers,
    branchLabel,
}: PageProps<{ transfers: Incoming[]; branchLabel: string }>) {
    return (
        <Authenticated user={auth.user}>
            <Head title="Incoming stock" />

            <section className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-medium">Incoming stock</h1>
                    <p className="text-sm text-muted-foreground">
                        Sent to {branchLabel} and not yet counted in. Stock is
                        added only when you confirm.
                    </p>
                </div>

                {transfers.length === 0 && (
                    <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
                        <Truck className="mx-auto mb-2 size-7 opacity-50" />
                        Nothing on its way right now.
                    </div>
                )}

                {transfers.map((transfer) => (
                    <Delivery key={transfer.id} transfer={transfer} />
                ))}
            </section>
        </Authenticated>
    );
}

function Delivery({ transfer }: { transfer: Incoming }) {
    // Assume everything arrived; the receiver corrects what didn't.
    const [counted, setCounted] = useState<Record<number, string>>(() =>
        Object.fromEntries(
            transfer.product_transfer_items.map((i) => [i.id, String(i.stock)])
        )
    );
    const [saving, setSaving] = useState(false);

    const short = transfer.product_transfer_items.filter(
        (i) => Number(counted[i.id]) < Number(i.stock)
    );

    const confirm = () => {
        setSaving(true);
        router.post(
            route("product-transfers.receive", transfer.id),
            {
                items: transfer.product_transfer_items.map((i) => ({
                    id: i.id,
                    received_stock: Number(counted[i.id] ?? i.stock),
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Stock added to this branch."),
                onError: (e) =>
                    toast.error(Object.values(e)[0] ?? "Could not receive."),
                onFinish: () => setSaving(false),
            }
        );
    };

    return (
        <div className="rounded-lg border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                    <p className="font-medium">
                        From {transfer.from_branch?.name ?? "another branch"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Sent by {transfer.user?.name ?? "—"} ·{" "}
                        {dayjs(transfer.created_at).format("DD MMM YYYY HH:mm")}{" "}
                        · {transfer.product_transfer_items.length} item(s)
                    </p>
                </div>
                <Button
                    className="gap-2"
                    disabled={saving}
                    onClick={confirm}
                >
                    <Check className="size-4" />
                    {saving ? "Adding…" : "Confirm & add to stock"}
                </Button>
            </header>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="px-4 py-2 font-medium">Product</th>
                            <th className="px-4 py-2 font-medium">Adds to</th>
                            <th className="px-4 py-2 text-right font-medium">
                                Sent
                            </th>
                            <th className="px-4 py-2 text-right font-medium">
                                Received
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {transfer.product_transfer_items.map((item) => (
                            <tr key={item.id} className="border-b last:border-0">
                                <td className="px-4 py-2 font-medium">
                                    {item.product?.name ?? "—"}
                                </td>
                                <td className="px-4 py-2">
                                    <span className="flex items-center gap-1.5 text-xs">
                                        <PackageCheck className="size-3.5 shrink-0 text-emerald-600" />
                                        {item.to_product?.name ?? "—"}
                                        <span className="text-muted-foreground">
                                            ({numberFormat(
                                                item.to_product?.stock ?? 0
                                            )}{" "}
                                            {item.to_product?.unit} now)
                                        </span>
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-right tabular-nums">
                                    {numberFormat(item.stock)}{" "}
                                    {item.product?.unit}
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <Input
                                        type="number"
                                        step="any"
                                        min={0}
                                        max={item.stock}
                                        className="ml-auto w-24 text-right"
                                        value={counted[item.id] ?? ""}
                                        onChange={(e) =>
                                            setCounted((c) => ({
                                                ...c,
                                                [item.id]: e.target.value,
                                            }))
                                        }
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {short.length > 0 && (
                <p className="border-t px-4 py-2 text-xs text-amber-600">
                    {short.length} line(s) short of what was sent. Confirming
                    records the shortfall against this delivery.
                </p>
            )}
        </div>
    );
}
