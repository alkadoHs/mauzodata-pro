import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Product } from "@/lib/schemas";
import { cn, numberFormat } from "@/lib/utils";

/**
 * Product search for the till. Replaces ReactSearchAutocomplete, which shipped
 * light-only styling and ignored the app's tokens/dark mode.
 *
 * Results render as an overlay and only while typing, so the cart underneath
 * stays visible. Note the Command root is h-full by default — it must be
 * overridden or it swallows the whole column.
 */
export function CartProductPicker({ products }: { products: Product[] }) {
    const [query, setQuery] = useState("");
    const open = query.trim().length > 0;

    const add = (product: Product) => {
        router.post(
            route("cart.add"),
            { product_id: product.id },
            {
                preserveScroll: true,
                // Reset state so the box clears and refocuses, ready for the next item.
                preserveState: false,
                onError: (errors) =>
                    toast.error(
                        errors.quantity ?? errors.product_id ?? "Could not add that product."
                    ),
            }
        );
    };

    return (
        <Command
            // h-auto/overflow-visible override the primitive's h-full + overflow-hidden
            // so this stays an input-sized box and the dropdown isn't clipped.
            // The last selector drops CommandInput's own border-b, which would
            // otherwise double up with this box's border.
            className="relative h-auto overflow-visible rounded-xl border border-border bg-card [&_[cmdk-input-wrapper]]:border-0"
        >
            <CommandInput
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder="Search a product to add…"
                className="border-0"
            />

            {open && (
                <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                    <CommandList className="max-h-72">
                        <CommandEmpty>No product found.</CommandEmpty>
                        <CommandGroup>
                            {products.map((product) => {
                                const low =
                                    product.stock <= (product.stock_alert ?? 0);

                                return (
                                    <CommandItem
                                        key={product.id}
                                        value={product.name}
                                        onSelect={() => add(product)}
                                        className="flex items-center gap-2"
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
                                            {product.stock} left
                                        </span>
                                        <span className="w-24 shrink-0 text-right text-xs font-medium tabular-nums">
                                            {numberFormat(product.sale_price)}
                                        </span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </div>
            )}
        </Command>
    );
}
