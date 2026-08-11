import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingCart, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CartItem } from "@/types";
import { cn, numberFormat } from "@/lib/utils";

/** Mirrors the backend rule in CartController::isWholesale(). */
const isWholesaleQty = (product: CartItem["product"], quantity: number) =>
    !!product?.whole_sale && product.whole_sale > 0 && quantity >= product.whole_sale;

const patchQty = (item: CartItem, quantity: number) => {
    // Tell the seller the moment the price switches — otherwise the line total
    // just changes under them with no explanation.
    const crossing =
        isWholesaleQty(item.product, quantity) &&
        !isWholesaleQty(item.product, Number(item.quantity));

    router.patch(
        route("cart.update", item.id),
        { quantity },
        {
            preserveScroll: true,
            onSuccess: () => {
                if (crossing) {
                    toast.info(`Wholesale price applied to ${item.product?.name ?? "item"}.`);
                }
            },
            onError: (errors) => toast.error(errors.quantity ?? "Could not update."),
        }
    );
};

/**
 * One line of the sale. Its own component so the quantity box can hold local
 * state — an uncontrolled defaultValue would keep showing the old number after
 * the +/- buttons changed it server-side.
 */
function CartLine({ item }: { item: CartItem }) {
    const product = item.product;
    const qty = Number(item.quantity);
    const stock = Number(product?.stock ?? 0);
    const isWholesale = isWholesaleQty(product, qty);
    const overStock = stock < qty;

    // Free-text while typing; re-synced whenever the server confirms a new qty.
    const [qtyText, setQtyText] = useState(String(item.quantity));
    useEffect(() => setQtyText(String(item.quantity)), [item.quantity]);

    const discount = Number(item.discount ?? 0);
    const lineValue = Number(item.price) * qty;

    const [discountText, setDiscountText] = useState(discount ? String(discount) : "");
    useEffect(
        () => setDiscountText(discount ? String(discount) : ""),
        [item.discount]
    );

    // A fixed amount off this line, never a percentage.
    const commitDiscount = (raw: string) => {
        const next = raw.trim() === "" ? 0 : parseFloat(raw);

        if (isNaN(next) || next < 0) {
            setDiscountText(discount ? String(discount) : "");
            return;
        }

        if (next === discount) return;

        router.patch(
            route("cart.discount", item.id),
            { discount: next },
            {
                preserveScroll: true,
                onError: (errors) => {
                    toast.error(errors.discount ?? "Could not apply that discount.");
                    setDiscountText(discount ? String(discount) : "");
                },
            }
        );
    };

    const step = (next: number) => {
        setQtyText(String(next)); // instant feedback, confirmed by the response
        patchQty(item, next);
    };

    const commit = (raw: string) => {
        const next = parseFloat(raw);
        if (!next || next <= 0 || next === qty) {
            setQtyText(String(item.quantity)); // reject junk, restore the real value
            return;
        }
        patchQty(item, next);
    };

    return (
        <li className="p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                        {product?.name ?? "—"}
                        {product?.unit && (
                            <span className="ml-1 text-xs text-muted-foreground">
                                / {product.unit}
                            </span>
                        )}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                            {numberFormat(item.price)} each
                        </span>
                        {isWholesale && (
                            <Badge variant="secondary" className="h-5">
                                Wholesale
                            </Badge>
                        )}
                        <span
                            className={cn(
                                "tabular-nums",
                                overStock && "font-medium text-destructive"
                            )}
                        >
                            {stock} in stock
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Stepper — faster than typing at a till */}
                    <div className="flex items-center">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9 rounded-r-none"
                            aria-label="Decrease quantity"
                            disabled={qty <= 1}
                            onClick={() => step(qty - 1)}
                        >
                            <Minus className="size-3.5" />
                        </Button>
                        <Input
                            inputMode="decimal"
                            value={qtyText}
                            aria-label="Quantity"
                            className="h-9 w-16 rounded-none border-x-0 text-center tabular-nums"
                            onChange={(e) => setQtyText(e.target.value)}
                            onBlur={(e) => commit(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                            }}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9 rounded-l-none"
                            aria-label="Increase quantity"
                            disabled={qty + 1 > stock}
                            onClick={() => step(qty + 1)}
                        >
                            <Plus className="size-3.5" />
                        </Button>
                    </div>

                    <span className="w-28 text-right font-medium tabular-nums">
                        {discount > 0 && (
                            <span className="block text-xs font-normal text-muted-foreground line-through">
                                {numberFormat(lineValue)}
                            </span>
                        )}
                        {numberFormat(lineValue - discount)}
                    </span>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 text-destructive"
                        aria-label={`Remove ${product?.name ?? "item"}`}
                        onClick={() =>
                            router.delete(route("cart.remove", item.id), {
                                preserveScroll: true,
                                onSuccess: () => toast.success("Removed"),
                            })
                        }
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Tag className="size-3.5" />
                    Discount
                </label>
                <Input
                    inputMode="decimal"
                    value={discountText}
                    aria-label={`Discount on ${product?.name ?? "item"}`}
                    placeholder="0"
                    className="h-8 w-28 text-right tabular-nums"
                    onChange={(e) => setDiscountText(e.target.value)}
                    onBlur={(e) => commitDiscount(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />
                {discount > 0 && (
                    <span className="text-xs text-emerald-600">
                        −{numberFormat(discount)} off this line
                    </span>
                )}
            </div>

            {overStock && (
                <p className="mt-2 text-xs text-destructive">
                    Only {stock} left — reduce the quantity before selling.
                </p>
            )}
        </li>
    );
}

/**
 * The sale's line items. Stacks into readable rows on mobile rather than
 * forcing a horizontal scroll.
 */
export function CartLines({ items }: { items: CartItem[] }) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-10 text-center">
                <ShoppingCart className="size-7 text-muted-foreground opacity-60" />
                <p className="font-medium">No items yet</p>
                <p className="text-sm text-muted-foreground">
                    Search a product to start this sale.
                </p>
            </div>
        );
    }

    return (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {items.map((item) => (
                <CartLine key={item.id} item={item} />
            ))}
        </ul>
    );
}
