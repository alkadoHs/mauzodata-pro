import { FormEventHandler, useState } from "react";
import { useForm } from "@inertiajs/react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InputError from "@/Components/InputError";
import { Product } from "@/lib/schemas";
import { cn, numberFormat } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { PackagePlus } from "lucide-react";

export default function NewStockForm({ products }: { products: Product[] }) {
    const [query, setQuery] = useState("");
    const [picked, setPicked] = useState<Product | null>(null);

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        product_id: "",
        new_stock: "",
    });

    // Only show results while searching, so the list below stays visible.
    const open = query.trim().length > 0 && !picked;

    const choose = (product: Product) => {
        setPicked(product);
        setData("product_id", String(product.id));
        setQuery("");
        clearErrors();
    };

    const onsubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("newstocks.store"), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setPicked(null);
                setQuery("");
            },
        });
    };

    const added = parseFloat(data.new_stock) || 0;

    return (
        <form
            onSubmit={onsubmit}
            className="space-y-4 rounded-xl border border-border bg-card p-4"
        >
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="space-y-1.5">
                    <Label>Product</Label>

                    {picked ? (
                        <div className="flex items-center justify-between gap-3 rounded-md border border-input bg-background px-3 py-2">
                            <span className="min-w-0 truncate text-sm">
                                <b>{picked.name}</b>
                                <span className="ml-1 text-muted-foreground">
                                    / {picked.unit}
                                </span>
                                <span className="ml-2 text-muted-foreground">
                                    {picked.stock} in stock
                                </span>
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setPicked(null);
                                    setData("product_id", "");
                                }}
                            >
                                Change
                            </Button>
                        </div>
                    ) : (
                        <Command className="relative h-auto overflow-visible rounded-md border border-input bg-background [&_[cmdk-input-wrapper]]:border-0">
                            <CommandInput
                                autoFocus
                                value={query}
                                onValueChange={setQuery}
                                placeholder="Search a product…"
                            />
                            {open && (
                                <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
                                    <CommandList className="max-h-64">
                                        <CommandEmpty>No product found.</CommandEmpty>
                                        <CommandGroup>
                                            {products.map((product) => {
                                                const low =
                                                    product.stock <=
                                                    (product.stock_alert ?? 0);
                                                return (
                                                    <CommandItem
                                                        key={product.id}
                                                        value={product.name}
                                                        onSelect={() => choose(product)}
                                                        className="gap-2"
                                                    >
                                                        <span className="min-w-0 flex-1 truncate">
                                                            {product.name}
                                                            <span className="ml-1 text-xs text-muted-foreground">
                                                                / {product.unit}
                                                            </span>
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "shrink-0 text-xs tabular-nums",
                                                                low
                                                                    ? "text-destructive"
                                                                    : "text-muted-foreground"
                                                            )}
                                                        >
                                                            {numberFormat(product.stock)}{" "}
                                                            in stock
                                                        </span>
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </div>
                            )}
                        </Command>
                    )}
                    <InputError message={errors.product_id} />
                </div>

                <div className="space-y-1.5 sm:w-40">
                    <Label htmlFor="new_stock">Quantity to add</Label>
                    <Input
                        id="new_stock"
                        inputMode="decimal"
                        value={data.new_stock}
                        onChange={(e) => {
                            // Digits + one decimal point — never a negative.
                            if (!/^\d*\.?\d*$/.test(e.target.value)) return;
                            setData("new_stock", e.target.value);
                        }}
                        placeholder="0"
                    />
                    <InputError message={errors.new_stock} />
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <p className="text-sm text-muted-foreground">
                    {picked && added > 0 ? (
                        <>
                            {picked.name}: {numberFormat(picked.stock)} →{" "}
                            <b className="text-foreground tabular-nums">
                                {numberFormat(Number(picked.stock) + added)}
                            </b>{" "}
                            {picked.unit}
                        </>
                    ) : (
                        "Pick a product and the amount received."
                    )}
                </p>
                <Button
                    type="submit"
                    className="gap-2"
                    disabled={processing || !picked || added <= 0}
                >
                    <PackagePlus className="size-4" />
                    {processing ? "Adding…" : "Add stock"}
                </Button>
            </div>
        </form>
    );
}
