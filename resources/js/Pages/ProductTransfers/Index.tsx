import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Branch, Product } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps, User } from "@/types";
import { Head, router } from "@inertiajs/react";
import { ArrowRight, PackagePlus, Send, Trash } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { productsColumns } from "./transfer-columns";

export interface ProductTransfer {
    id: number;
    branch: Branch;
    from_branch?: Branch;
    user: User;
    product_transfer_items: TransferLine[];
    product_transfer_items_count: number;
    status: "pending" | "transferred" | "received";
    received_at?: string | null;
    created_at: string;
}

type DestinationProduct = {
    id: number;
    name: string;
    unit: string;
    stock: number;
};

export type TransferLine = {
    id: number;
    product: DestinationProduct | null;
    stock: number;
    to_product_id: number | null;
    destination: DestinationProduct | null;
    /** Nothing over there matches, so sending will create it. */
    will_create: boolean;
    /** The sender pinned this line to a specific item. */
    chosen: boolean;
};

type Cart = {
    id: number;
    branch_id: number | null;
    items: TransferLine[];
    destination_products: DestinationProduct[];
};

const AUTO = "auto";

const ProductTransferPage = ({
    auth,
    branches,
    products,
    transfer,
    filters,
}: PageProps<{
    branches: Branch[];
    products: Product[];
    transfer: Cart | null;
    filters: { search: string };
}>) => {
    const [sending, setSending] = useState(false);
    const items = transfer?.items ?? [];
    const destination = transfer?.branch_id ?? null;

    const onSearchChange = useDebouncedCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            router.get(
                route("product-transfers.index"),
                { search: event.target.value },
                { preserveState: true, replace: true }
            );
        },
        500
    );

    // Set immediately rather than on submit, so every line can show where it
    // is going while the cart is still being built.
    const chooseBranch = (value: string) =>
        router.post(
            route("product-transfers.destination"),
            { branch_id: value },
            { preserveScroll: true }
        );

    const mapLine = (line: TransferLine, value: string) =>
        router.patch(
            route("product-transfers.cart.map", line.id),
            { to_product_id: value === AUTO ? null : value },
            { preserveScroll: true }
        );

    const send = () => {
        if (!destination) return;
        setSending(true);
        router.post(
            route("product-transfers.store"),
            { branch_id: String(destination) },
            {
                onError: (e) =>
                    toast.error(Object.values(e)[0] ?? "Transfer failed."),
                onFinish: () => setSending(false),
            }
        );
    };

    const branchName =
        branches.find((b) => b.id === destination)?.name ?? "the other branch";

    return (
        <Authenticated user={auth.user}>
            <Head title="Transfer stock" />

            <section className="grid gap-4 lg:grid-cols-2">
                <div className="grid content-start gap-2">
                    <h1 className="text-2xl font-medium">Your stock</h1>
                    <Input
                        type="search"
                        name="search"
                        placeholder="Search products..."
                        defaultValue={filters.search}
                        onChange={onSearchChange}
                    />
                    <DataTable columns={productsColumns} data={products} />
                </div>

                <div className="space-y-3">
                    <h1 className="text-2xl font-medium">Transfer</h1>

                    <div className="rounded-lg border bg-card p-3">
                        <Label htmlFor="branch">Send to</Label>
                        <Select
                            value={destination ? String(destination) : ""}
                            onValueChange={chooseBranch}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose the receiving branch" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((branch) => (
                                    <SelectItem
                                        key={branch.id}
                                        value={branch.id.toString()}
                                    >
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Pick this first — each product then shows exactly
                            which item it will be added to over there.
                        </p>
                    </div>

                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-3 py-2 font-medium">
                                        Product
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Qty
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Goes to
                                    </th>
                                    <th className="px-3 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-3 py-8 text-center text-muted-foreground"
                                        >
                                            Add products from the left.
                                        </td>
                                    </tr>
                                )}
                                {items.map((line) => (
                                    <tr key={line.id} className="border-b">
                                        <td className="px-3 py-2">
                                            <div className="font-medium">
                                                {line.product?.name ?? "—"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {numberFormat(
                                                    line.product?.stock ?? 0
                                                )}{" "}
                                                {line.product?.unit} in stock
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <QuantityInput line={line} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <DestinationCell
                                                line={line}
                                                cart={transfer}
                                                branchName={branchName}
                                                onChange={(v) =>
                                                    mapLine(line, v)
                                                }
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    router.delete(
                                                        route(
                                                            "product-transfers.cart.destroy",
                                                            line.id
                                                        ),
                                                        {
                                                            preserveScroll: true,
                                                        }
                                                    )
                                                }
                                            >
                                                <Trash className="size-4 text-muted-foreground" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Button
                        className="w-full gap-2"
                        disabled={sending || !destination || items.length === 0}
                        onClick={send}
                    >
                        <Send className="size-4" />
                        {sending ? "Sending…" : "Send stock"}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                        Sending takes the stock off this branch. It is added to{" "}
                        {branchName} only when someone there confirms the
                        delivery.
                    </p>
                </div>
            </section>
        </Authenticated>
    );
};

/** Quantity, saved shortly after it stops changing. */
function QuantityInput({ line }: { line: TransferLine }) {
    const save = useDebouncedCallback((value: string) => {
        const stock = Number(value);
        if (!stock || stock <= 0) return;

        router.patch(
            route("product-transfers.cart.update", line.id),
            { stock },
            {
                preserveScroll: true,
                onError: (e) =>
                    toast.error(Object.values(e)[0] ?? "Not enough stock."),
            }
        );
    }, 400);

    return (
        <Input
            type="number"
            step="any"
            min={0}
            className="w-24"
            defaultValue={line.stock}
            onBlur={(e) => save(e.target.value)}
        />
    );
}

/**
 * Where this line lands. Matched automatically, but the sender can pin it to a
 * specific item — the point being that the choice is made here, by someone
 * looking at the goods, not by whoever unpacks the box later.
 */
function DestinationCell({
    line,
    cart,
    branchName,
    onChange,
}: {
    line: TransferLine;
    cart: Cart | null;
    branchName: string;
    onChange: (value: string) => void;
}) {
    if (!cart?.branch_id) {
        return (
            <span className="text-xs text-muted-foreground">
                Choose a branch first
            </span>
        );
    }

    return (
        <div className="space-y-1">
            <Select
                value={line.to_product_id ? String(line.to_product_id) : AUTO}
                onValueChange={onChange}
            >
                <SelectTrigger className="h-8 w-[190px] text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={AUTO}>
                        {line.will_create
                            ? "Create new item"
                            : `Match: ${line.destination?.name ?? ""}`}
                    </SelectItem>
                    {cart.destination_products.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                            {p.name} ({numberFormat(p.stock)} {p.unit})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {line.will_create ? (
                <span className="flex items-center gap-1 text-[11px] text-amber-600">
                    <PackagePlus className="size-3 shrink-0" />
                    New in {branchName}
                </span>
            ) : (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ArrowRight className="size-3 shrink-0" />
                    {numberFormat(line.destination?.stock ?? 0)}{" "}
                    {line.destination?.unit} there now
                </span>
            )}
        </div>
    );
}

export default ProductTransferPage;
