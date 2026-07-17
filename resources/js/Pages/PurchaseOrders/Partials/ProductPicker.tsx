import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";

type Props = {
    products: Product[];
    /** Product ids already on the order — shown as ticked and re-selectable to focus. */
    selectedIds: number[];
    onSelect: (product: Product) => void;
};

/**
 * Theme-aware product search. Replaces react-search-autocomplete, which shipped
 * its own light-only styling and ignored the app's tokens/dark mode.
 */
export function ProductPicker({ products, selectedIds, onSelect }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal text-muted-foreground"
                >
                    <span className="flex items-center gap-2">
                        <Search className="size-4" />
                        Search products by name…
                    </span>
                    <ChevronsUpDown className="size-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
            >
                <Command>
                    <CommandInput placeholder="Type a product name…" />
                    <CommandList>
                        <CommandEmpty>No product found.</CommandEmpty>
                        <CommandGroup>
                            {products.map((product) => {
                                const added = selectedIds.includes(product.id);

                                return (
                                    <CommandItem
                                        key={product.id}
                                        value={product.name}
                                        onSelect={() => {
                                            onSelect(product);
                                            setOpen(false);
                                        }}
                                        className="gap-2"
                                    >
                                        <Check
                                            className={
                                                added
                                                    ? "size-4 shrink-0 opacity-100"
                                                    : "size-4 shrink-0 opacity-0"
                                            }
                                        />
                                        <span className="flex-1 truncate">
                                            {product.name}
                                            <span className="ml-1 text-xs text-muted-foreground">
                                                ({product.unit})
                                            </span>
                                        </span>
                                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                            {product.stock} in stock ·{" "}
                                            {numberFormat(product.buy_price)}
                                        </span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
