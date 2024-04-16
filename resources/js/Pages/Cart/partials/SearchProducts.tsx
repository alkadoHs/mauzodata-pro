import * as React from "react";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Customer } from "@/lib/schemas";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function SearchCustomer({ customers }: { customers: Customer[] }) {
    const [open, setOpen] = React.useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [selectedCustomer, setSelectedCustomer] =
        React.useState<Customer | null>(null);

    if (selectedCustomer)
        toast(`Selected Customer is:  ${selectedCustomer.id}`);

    if (isDesktop) {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-[150px] justify-start"
                    >
                        {selectedCustomer ? (
                            <>{selectedCustomer.name}</>
                        ) : (
                            <>+ Find Customer</>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <CustomerList
                        setOpen={setOpen}
                        setSelectedCustomer={setSelectedCustomer}
                        customers={customers}
                    />
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button variant="outline" className="w-[150px] justify-start">
                    {selectedCustomer ? (
                        <>{selectedCustomer.name}</>
                    ) : (
                        <>+ Find Customer</>
                    )}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mt-4 border-t">
                    <CustomerList
                        setOpen={setOpen}
                        setSelectedCustomer={setSelectedCustomer}
                        customers={customers}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function CustomerList({
    setOpen,
    setSelectedCustomer,
    customers,
}: {
    setOpen: (open: boolean) => void;
    setSelectedCustomer: (Customer: Customer | null) => void;
    customers: Customer[];
}) {
    return (
        <Command>
            <CommandInput placeholder="Filter Customer..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                    {customers.map((customer) => (
                        <CommandItem
                            key={customer.id}
                            value={customer.id.toString()} // Convert customer.id to a string
                            onSelect={(value) => {
                                setSelectedCustomer(
                                    customers.find(
                                        (customer) =>
                                            customer.id === Number(value) // Convert value to a number
                                    ) || null
                                );
                                setOpen(false);
                            }}
                        >
                            {customer.name}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );
}
