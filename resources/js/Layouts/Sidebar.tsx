import SideLink from "@/components/SideLink";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User as AuthUser } from "@/types";
import { Link, router } from "@inertiajs/react";

import {
    ArrowUpDownIcon,
    BookOpenText,
    BookTextIcon,
    CircleAlert,
    CircleMinus,
    ClipboardListIcon,
    CreditCardIcon,
    DeleteIcon,
    FileLineChart,
    HomeIcon,
    Layers3Icon,
    ListTodo,
    Settings,
    Users,
} from "lucide-react";
import React from "react";

const Sidebar = ({ user }: { user: AuthUser }) => {
    const iconClasses =
        "text-xl text-default-500 pointer-events-none flex-shrink-0";

    return (
        <aside className="sticky w-full top-0 bg-slate-800 text-slate-400 min-h-dvh py-4 hidden md:block   md:w-[350px]">
            <section className="space-y-6"></section>

            <ScrollArea className="max-h-[400px] my-3 px-4">
                <ul className="grid gap-1.5">
                    <li className="">
                        <SideLink
                            label="Dashboard"
                            url="dashboard"
                            icon={<HomeIcon className="size-5 " />}
                        />
                    </li>
                    <li>
                        <SideLink
                            label="Products"
                            url="products.index"
                            icon={<BookOpenText className="size-5 " />}
                        />
                    </li>
                </ul>
            </ScrollArea>
            <section className="px-4">
                <ul className="space-y-4">
                    <li className="flex gap-2">
                        <CircleAlert className="text-default-500 size-6" />
                        <span className="text-default-500">
                            Guide information
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <CircleMinus className="text-default-500 size-6" />
                        <span className="text-default-500">Logout</span>
                    </li>
                </ul>
            </section>
        </aside>
    );
};

export default Sidebar;
