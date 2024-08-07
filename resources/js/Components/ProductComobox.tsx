import * as React from "react";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";

import { cn, transformProductsToOptions } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Product } from "@/lib/schemas";

export function ProductCombobox({
    productOptions,
    setSelectedProduct,
}: {
    productOptions: Product[];
    setSelectedProduct: () => void;
}) {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState("");

    const products = transformProductsToOptions(productOptions);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value
                        ? products.find((product) => product.value === value)
                              ?.label
                        : "Select product..."}
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="max-w-full p-0">
                <Command>
                    <CommandInput
                        placeholder="Search product..."
                        className="h-9"
                    />
                    <CommandEmpty>No product found.</CommandEmpty>
                    <CommandGroup>
                        {products.map((product) => (
                            <CommandItem
                                key={product.value}
                                value={product.value}
                                onSelect={(currentValue) => {
                                    setValue(
                                        currentValue === value
                                            ? ""
                                            : currentValue
                                    );
                                    setOpen(false);
                                }}
                            >
                                {product.label}
                                <CheckIcon
                                    className={cn(
                                        "ml-auto h-4 w-4",
                                        value === product.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                    )}
                                />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
