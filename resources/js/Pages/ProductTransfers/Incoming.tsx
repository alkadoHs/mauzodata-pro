import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import dayjs from "dayjs";
import { Check, CheckCheck, PackageCheck, Truck, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Item = {
    id: number;
    stock: number;
    received_stock: number | null;
    returned_stock: number | null;
    received_at: string | null;
    product: { id: number; name: string; unit: string } | null;
    to_product: { id: number; name: string; unit: string; stock: number } | null;
    received_by: { id: number; name: string } | null;
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
 * Deliveries on their way to this branch. A box is unpacked item by item, so
 * each line is confirmed on its own; whatever didn't arrive goes back to the
 * branch that sent it.
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
                        Sent to {branchLabel} and not yet counted in. Confirm
                        each item as you unpack it — anything short goes back to
                        the branch that sent it.
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
    const [saving, setSaving] = useState(false);
    const items = transfer.product_transfer_items;
    const outstanding = items.filter((i) => !i.received_at);

    const confirmAll = () => {
        setSaving(true);
        router.post(
            route("product-transfers.receive", transfer.id),
            {
                items: outstanding.map((i) => ({
                    id: i.id,
                    received_stock: Number(i.stock),
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Delivery received in full."),
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
                        · {items.length - outstanding.length} of {items.length}{" "}
                        confirmed
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="gap-2"
                    disabled={saving || outstanding.length === 0}
                    onClick={confirmAll}
                >
                    <CheckCheck className="size-4" />
                    Confirm all as sent
                </Button>
            </header>

            <div className="divide-y">
                {items.map((item) => (
                    <Line key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}

/** One item on the delivery, confirmed on its own. */
function Line({ item }: { item: Item }) {
    const sent = Number(item.stock);
    const [countedText, setCountedText] = useState(String(sent));
    const [saving, setSaving] = useState(false);

    const counted = Number(countedText);
    const short = !isNaN(counted) && counted < sent;

    const confirm = () => {
        if (isNaN(counted) || counted < 0 || counted > sent) {
            toast.error(`Enter a number between 0 and ${sent}.`);
            return;
        }

        setSaving(true);
        router.post(
            route("product-transfers.receive-item", item.id),
            { received_stock: counted },
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Item confirmed."),
                onError: (e) =>
                    toast.error(Object.values(e)[0] ?? "Could not confirm."),
                onFinish: () => setSaving(false),
            }
        );
    };

    if (item.received_at) {
        const received = Number(item.received_stock ?? 0);
        const returned = Number(item.returned_stock ?? 0);

        return (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                    <p className="font-medium">{item.product?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                        {numberFormat(received)} of {numberFormat(sent)}{" "}
                        {item.product?.unit} counted in
                        {item.received_by ? ` by ${item.received_by.name}` : ""}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {returned > 0 && (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                            <Undo2 className="size-3.5" />
                            {numberFormat(returned)} returned
                        </span>
                    )}
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <Check className="size-3" /> Confirmed
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
                <p className="font-medium">{item.product?.name ?? "—"}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <PackageCheck className="size-3.5 shrink-0 text-emerald-600" />
                    adds to {item.to_product?.name ?? "—"} (
                    {numberFormat(item.to_product?.stock ?? 0)}{" "}
                    {item.to_product?.unit} now)
                </p>
            </div>

            <div className="flex items-end gap-2">
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                    Sent
                    <span className="flex h-9 items-center px-1 text-sm text-foreground tabular-nums">
                        {numberFormat(sent)} {item.product?.unit}
                    </span>
                </label>
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                    Received
                    <Input
                        type="number"
                        step="any"
                        min={0}
                        max={sent}
                        className="h-9 w-24 text-right tabular-nums"
                        value={countedText}
                        onChange={(e) => setCountedText(e.target.value)}
                    />
                </label>
                <Button
                    className="h-9 gap-2"
                    disabled={saving}
                    onClick={confirm}
                >
                    <Check className="size-4" />
                    Confirm
                </Button>
            </div>

            {short && (
                <p className="w-full text-xs text-amber-600">
                    {numberFormat(sent - counted)} {item.product?.unit} will go
                    back to the sending branch.
                </p>
            )}
        </div>
    );
}
