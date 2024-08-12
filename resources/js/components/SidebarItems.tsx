import {
    Home,
    ShoppingCart,
    Package,
    Users,
    LineChart,
    ShoppingBasket,
    Hourglass,
    Scale,
    FileCheck2,
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "./ui/badge";
import { Link } from "@inertiajs/react";
import { User } from "@/types";

const SidebarItems = ({ user }: { user: User }) => {
    return (
        <>
            <Link
                as="button"
                href={route("dashboard")}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
                <Home className="size-5" />
                Dashboard
            </Link>
            <Accordion
                type="single"
                collapsible
                className="w-full"
                defaultValue={user.role !== 'admin' ? "item-2BG": ""}
            >
                <AccordionItem value="item-2BG" className="border-none">
                    <AccordionTrigger className="py-1.5 my-1 text-muted-foreground">
                        <div className="flex gap-2 items-center">
                            <Scale className="size-5" />
                            <p>Seller activities</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="pl-2">
                            <Link
                                as="button"
                                href={route("cart.sales")}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <ShoppingBasket className="size-5" />
                                My Sales
                            </Link>
                            <Link
                                as="button"
                                href={route("cart.index")}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <ShoppingBasket className="size-5" />
                                Sell product
                            </Link>
                            <Link
                                as="button"
                                href={route("cart.pricing")}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <ShoppingBasket className="size-5" />
                                Pricing List
                            </Link>
                            <Link
                                as="button"
                                href={route("cart.expenses")}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <ShoppingBasket className="size-5" />
                                Add Expenses
                            </Link>
                            <Link
                                as="button"
                                href={route("cart.credits")}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <ShoppingBasket className="size-5" />
                                Credit Sales
                            </Link>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            {user.role == "admin" && (
                <>
                    <Link
                        as="button"
                        href={route("orders.index")}
                        className="flex items-center bg-indigo-500 text-white gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <ShoppingCart className="size-5" />
                        Orders
                        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                            6
                        </Badge>
                    </Link>
                    <Link
                        as="button"
                        href={route("products.index")}
                        className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
                    >
                        <Package className="size-5" />
                        Products{" "}
                    </Link>
                    <Link
                        as="button"
                        href={route("newstocks.index")}
                        className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
                    >
                        <Package className="size-5" />
                        New Stocks
                    </Link>
                    <Link
                        as="button"
                        href={route("users.index")}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <Users className="size-5" />
                        Employees
                    </Link>
                </>
            )}
            <Accordion
                type="single"
                collapsible
                className="w-full"
                defaultValue="item-10"
            >
                <AccordionItem value="item-10" className="border-none">
                    <AccordionTrigger className="py-1.5 my-1 text-muted-foreground">
                        <div className="flex gap-2 items-center">
                            <Scale className="size-5" />
                            <p>Vendor Activities</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="pl-2">
                            <Link
                                as="button"
                                href={route("vendorproducts.index")}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <ShoppingBasket className="size-5" />
                                Vendor products
                            </Link>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {user.role == "admin" && (
                <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    defaultValue="item-20"
                >
                    <AccordionItem value="item-20" className="border-none">
                        <AccordionTrigger className="py-1.5 my-1 text-muted-foreground">
                            <div className="flex gap-2 items-center">
                                <Scale className="size-5" />
                                <p>Reports</p>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="pl-2">
                                <Link
                                    as="button"
                                    href={route("reports.sales")}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                                >
                                    <FileCheck2 className="size-5" />
                                    Sellers Reports
                                </Link>
                                <Link
                                    as="button"
                                    href={route("reports.outstock")}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                                >
                                    <FileCheck2 className="size-5" />
                                    Out of stock
                                </Link>
                                <Link
                                    as="button"
                                    href={route("reports.zerostock")}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                                >
                                    <FileCheck2 className="size-5" />
                                    Zero stock
                                </Link>
                                {/* <Link
                                as="button"
                                href={route("cart.expenses")}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <ShoppingBasket className="size-5" />
                                Add Expenses
                            </Link>
                            <Link
                                as="button"
                                href={route("cart.credits")}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <ShoppingBasket className="size-5" />
                                Credit Sales
                            </Link> */}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </>
    );
};

export default SidebarItems;
