import React, { ReactNode } from "react";
import Authenticated from "./AuthenticatedLayout";
import { User } from "@/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import CartNavLink from "@/components/CartNavLink";
import { FileBarChart2, History, SquareDashedKanban, SwatchBook, TicketPlusIcon } from "lucide-react";

export default function CartLayout({
    children,
    user,
}: {
    user: User;
    children: ReactNode;
}) {
    return (
        <Authenticated user={user}>
            <ScrollArea className="w-full whitespace-nowrap border-b dark:border-gray-800 mb-3 bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-gray-400">
                <nav className="flex w-max space-x-4 px-4 pt-4">
                    <CartNavLink
                        label="New sale"
                        url="cart.index"
                        icon={<TicketPlusIcon className="size-5" />}
                    />

                    <CartNavLink
                        label="Sales history"
                        url="cart.sales"
                        icon={<History className="size-5" />}
                    />

                    <CartNavLink
                        label="Expenses"
                        url="cart.expenses"
                        icon={<SwatchBook className="size-5" />}
                    />

                    <CartNavLink
                        label="Pricing"
                        url="cart.pricing"
                        icon={<FileBarChart2 className="size-5" />}
                    />

                    <CartNavLink
                        label="Credit sales"
                        url="cart.credits"
                        icon={<SquareDashedKanban className="size-5" />}
                    />
                </nav>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {children}
        </Authenticated>
    );
}
