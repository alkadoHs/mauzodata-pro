import { FormEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Product, Supplier } from "@/lib/schemas";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { numberFormat } from "@/lib/utils";
import InputError from "@/Components/InputError";
import { ArrowLeft, PackagePlus, Plus, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { ProductPicker } from "./Partials/ProductPicker";
import { SupplierFormDialog } from "@/Pages/Suppliers/Partials/SupplierFormDialog";

type POItem = {
    product_id: number;
    name: string;
    unit: string;
    /** Kept as strings so the inputs can be emptied while typing. */
    quantity: string;
    cost: string;
};

const toNumber = (v: string) => parseFloat(v) || 0;

export default function PurchaseOrderCreate({
    auth,
    suppliers,
    products,
}: PageProps<{ suppliers: Supplier[]; products: Product[] }>) {
    const [items, setItems] = useState<POItem[]>([]);
    const [supplierDialog, setSupplierDialog] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        supplier_id: "",
        notes: "",
        items: [] as { product_id: number; quantity: number; cost: number }[],
    });

    // Remember which suppliers existed when the dialog opened, so that when the
    // refreshed props come back we can pick out the new one and select it.
    const knownSupplierIds = useRef<number[] | null>(null);

    const openSupplierDialog = () => {
        knownSupplierIds.current = suppliers.map((s) => s.id);
        setSupplierDialog(true);
    };

    useEffect(() => {
        if (!knownSupplierIds.current) return;
        const created = suppliers.find(
            (s) => !knownSupplierIds.current!.includes(s.id)
        );
        if (created) {
            setData("supplier_id", String(created.id));
            knownSupplierIds.current = null;
        }
    }, [suppliers]);

    // Keep the payload in sync with the editable string rows.
    const sync = (rows: POItem[]) => {
        setItems(rows);
        setData(
            "items",
            rows.map((r) => ({
                product_id: r.product_id,
                quantity: toNumber(r.quantity),
                cost: toNumber(r.cost),
            }))
        );
    };

    const addProduct = (product: Product) => {
        if (items.some((i) => i.product_id === product.id)) {
            toast.warning(`${product.name} is already on this order.`);
            return;
        }
        sync([
            ...items,
            {
                product_id: product.id,
                name: product.name,
                unit: product.unit,
                quantity: "1",
                cost: String(product.buy_price ?? 0),
            },
        ]);
    };

    const changeItem = (index: number, field: "quantity" | "cost", value: string) => {
        // Digits with at most one decimal point (allows an empty field while typing).
        if (!/^\d*\.?\d*$/.test(value)) return;
        const rows = [...items];
        rows[index] = { ...rows[index], [field]: value };
        sync(rows);
    };

    const removeItem = (index: number) => sync(items.filter((_, i) => i !== index));

    const totals = useMemo(() => {
        const value = items.reduce(
            (acc, i) => acc + toNumber(i.quantity) * toNumber(i.cost),
            0
        );
        const units = items.reduce((acc, i) => acc + toNumber(i.quantity), 0);
        return { value, units };
    }, [items]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("purchase-orders.store"));
    };

    const noSuppliers = suppliers.length === 0;
    // Products must already exist in this branch — nothing to order otherwise.
    const noProducts = products.length === 0;

    return (
        <Authenticated user={auth.user}>
            <Head title="New purchase order" />

            <section className="space-y-4">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            New purchase order
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Order stock from a supplier. Stock only moves when you
                            receive it.
                        </p>
                    </div>
                    <Link href={route("purchase-orders.index")}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <ArrowLeft className="size-4" /> Back
                        </Button>
                    </Link>
                </header>

                {noProducts ? (
                    <div className="rounded-xl border border-border bg-card p-8 text-center">
                        <PackagePlus className="mx-auto mb-3 size-8 text-muted-foreground" />
                        <h2 className="font-medium">No products in this branch</h2>
                        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                            Add products to this branch before ordering stock for it.
                        </p>
                        <Link href={route("products.index")} className="mt-4 inline-block">
                            <Button>Go to products</Button>
                        </Link>
                    </div>
                ) : (
                    <form
                        onSubmit={submit}
                        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
                    >
                        {/* Items */}
                        <div className="space-y-4 lg:col-span-2">
                            <div className="rounded-xl border border-border bg-card p-4">
                                <Label className="mb-2 block">Add products</Label>
                                <ProductPicker
                                    products={products}
                                    selectedIds={items.map((i) => i.product_id)}
                                    onSelect={addProduct}
                                />
                                <InputError message={errors.items} className="mt-2" />
                            </div>

                            <div className="rounded-xl border border-border bg-card">
                                {items.length === 0 ? (
                                    <p className="p-8 text-center text-sm text-muted-foreground">
                                        No products yet — search above to add some.
                                    </p>
                                ) : (
                                    <ul className="divide-y divide-border">
                                        {items.map((item, index) => {
                                            const qtyError = (errors as Record<string, string>)[
                                                `items.${index}.quantity`
                                            ];
                                            const costError = (errors as Record<string, string>)[
                                                `items.${index}.cost`
                                            ];

                                            return (
                                                <li key={item.product_id} className="p-3">
                                                    {/* Stacks on mobile, single row from sm up */}
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate font-medium">
                                                                {item.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                per {item.unit}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-end gap-2">
                                                            <div className="w-24 space-y-1">
                                                                <Label
                                                                    className="text-xs text-muted-foreground"
                                                                    htmlFor={`qty-${index}`}
                                                                >
                                                                    Qty
                                                                </Label>
                                                                <Input
                                                                    id={`qty-${index}`}
                                                                    inputMode="decimal"
                                                                    value={item.quantity}
                                                                    onChange={(e) =>
                                                                        changeItem(
                                                                            index,
                                                                            "quantity",
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="w-32 space-y-1">
                                                                <Label
                                                                    className="text-xs text-muted-foreground"
                                                                    htmlFor={`cost-${index}`}
                                                                >
                                                                    Cost / unit
                                                                </Label>
                                                                <Input
                                                                    id={`cost-${index}`}
                                                                    inputMode="decimal"
                                                                    value={item.cost}
                                                                    onChange={(e) =>
                                                                        changeItem(
                                                                            index,
                                                                            "cost",
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="w-28 text-right">
                                                                <p className="text-xs text-muted-foreground">
                                                                    Subtotal
                                                                </p>
                                                                <p className="font-medium tabular-nums">
                                                                    {numberFormat(
                                                                        toNumber(item.quantity) *
                                                                            toNumber(item.cost)
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive"
                                                                onClick={() => removeItem(index)}
                                                                aria-label={`Remove ${item.name}`}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    {(qtyError || costError) && (
                                                        <InputError
                                                            message={qtyError || costError}
                                                            className="mt-1"
                                                        />
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Details + summary */}
                        <div className="space-y-4">
                            <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="supplier_id">Supplier *</Label>

                                    {noSuppliers ? (
                                        <button
                                            type="button"
                                            onClick={openSupplierDialog}
                                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                        >
                                            <Plus className="size-4" />
                                            Add your first supplier
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Select
                                                value={data.supplier_id}
                                                onValueChange={(v) =>
                                                    setData("supplier_id", v)
                                                }
                                            >
                                                <SelectTrigger id="supplier_id">
                                                    <SelectValue placeholder="Select a supplier" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {suppliers.map((s) => (
                                                        <SelectItem
                                                            key={s.id}
                                                            value={String(s.id)}
                                                        >
                                                            {s.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0"
                                                onClick={openSupplierDialog}
                                                aria-label="Add a new supplier"
                                                title="Add a new supplier"
                                            >
                                                <Plus className="size-4" />
                                            </Button>
                                        </div>
                                    )}
                                    <InputError message={errors.supplier_id} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData("notes", e.target.value)}
                                        placeholder="Optional — reference, delivery details…"
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                            </div>

                            <div className="space-y-3 rounded-xl border border-border bg-card p-4 lg:sticky lg:top-20">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Products</span>
                                    <span className="tabular-nums">{items.length}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Total units</span>
                                    <span className="tabular-nums">{totals.units}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-border pt-3 text-lg font-semibold">
                                    <span>Total</span>
                                    <span className="tabular-nums">
                                        {numberFormat(totals.value)}
                                    </span>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full gap-2"
                                    disabled={processing || items.length === 0}
                                >
                                    <Truck className="size-4" />
                                    {processing ? "Saving…" : "Create purchase order"}
                                </Button>
                                <p className="text-center text-xs text-muted-foreground">
                                    Creating this order does not change stock.
                                </p>
                            </div>
                        </div>
                    </form>
                )}
            </section>

            <SupplierFormDialog
                open={supplierDialog}
                onOpenChange={setSupplierDialog}
            />
        </Authenticated>
    );
}
