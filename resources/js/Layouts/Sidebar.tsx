import SideLink from "@/components/SideLink";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { User as AuthUser } from "@/types";
import { router } from "@inertiajs/react";
import { EnvelopeClosedIcon } from "@radix-ui/react-icons";

import {
    ArrowRight,
    BarChart3Icon,
    BookOpenText,
    CircleAlert,
    CircleMinus,
    DatabaseZap,
    HomeIcon,
    UserCheck,
    Users,
} from "lucide-react";

const Sidebar = ({ user }: { user: AuthUser }) => {
    const iconClasses =
        "text-xl text-default-500 pointer-events-none flex-shrink-0";

    return (
        <aside className="sticky w-full top-0 bg-slate-950 text-slate-400 min-h-dvh pb-8 hidden md:block   md:w-[320px]">
            <section className="space-y-2 py-3 bg-slate-950 flex flex-col justify-center items-center">
                <div className="rounded-full flex items-center justify-center bg-indogo-400 border size-10 dark:border-primary dark:bg-slate-500">
                    <UserCheck className="size-8" />
                </div>
                <div>
                    <p>{user.name}</p>
                    <p></p>
                </div>
            </section>

            <ScrollArea className="max-h-[400px] overflow-y-auto my-3 px-4">
                <ul className="grid gap-1.5">
                    <li className="">
                        <SideLink
                            label="Dashboard"
                            url="dashboard"
                            icon={<HomeIcon className="size-5 " />}
                        />
                    </li>
                    <li className="">
                        <SideLink
                            label="Sales"
                            url="orders.index"
                            icon={<BarChart3Icon className="size-5 " />}
                        />
                    </li>
                    <li>
                        <SideLink
                            label="Users"
                            url="users.index"
                            icon={<Users className="size-5 " />}
                        />
                    </li>
                    <li>
                        <SideLink
                            label="Products"
                            url="products.index"
                            icon={<BookOpenText className="size-5 " />}
                        />
                    </li>
                    <li>
                        <SideLink
                            label="Store"
                            url="stores.products"
                            icon={<DatabaseZap className="size-5 " />}
                        />
                    </li>
                    <li>
                        <Accordion type="multiple" className="w-full">
                            <AccordionItem key="reports" value="Report">
                                <AccordionTrigger className="bg-slate-800/50">
                                    Reports
                                </AccordionTrigger>
                                <AccordionContent>
                                    <ul>
                                        <li>
                                            <SideLink
                                                label="Sellers report"
                                                url="reports.sales"
                                                icon={
                                                    <ArrowRight className="size-5 " />
                                                }
                                            />
                                        </li>
                                        <li>
                                            <SideLink
                                                label="Out of stock"
                                                url="reports.outstock"
                                                icon={
                                                    <ArrowRight className="size-5 " />
                                                }
                                            />
                                        </li>
                                        <li>
                                            <SideLink
                                                label="Zero Stock"
                                                url="reports.zerostock"
                                                icon={
                                                    <ArrowRight className="size-5 " />
                                                }
                                            />
                                        </li>
                                        <li>
                                            <SideLink
                                                label="Shops sales"
                                                url="stores.products"
                                                icon={
                                                    <ArrowRight className="size-5 " />
                                                }
                                            />
                                        </li>
                                        <li>
                                            <SideLink
                                                label="Store products"
                                                url="stores.products"
                                                icon={
                                                    <ArrowRight className="size-5 " />
                                                }
                                            />
                                        </li>
                                        <li>
                                            <SideLink
                                                label="Credit sales"
                                                url="stores.products"
                                                icon={
                                                    <ArrowRight className="size-5 " />
                                                }
                                            />
                                        </li>
                                        <li>
                                            <SideLink
                                                label="Expenses report"
                                                url="stores.products"
                                                icon={
                                                    <ArrowRight className="size-5 " />
                                                }
                                            />
                                        </li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </li>
                </ul>
                <ScrollBar orientation="vertical" />
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
