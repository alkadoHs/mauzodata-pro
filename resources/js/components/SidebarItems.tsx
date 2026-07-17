import {
    Home,
    ShoppingCart,
    Package,
    Users,
    ShoppingBasket,
    Scale,
    FileCheck2,
    BotIcon,
    SearchCheckIcon,
    BookOpen,
    Settings,
    ArrowRight,
    BarChart,
    LucideIcon,
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
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/** Is the given route name / pattern (supports `*`) the current page? */
const isCurrent = (pattern: string): boolean =>
    (route().current(pattern) as boolean) ?? false;

const isAnyCurrent = (patterns: string[]): boolean =>
    patterns.some((p) => isCurrent(p));

const NavLink = ({
    routeName,
    icon: Icon,
    label,
    pattern,
    trailing,
}: {
    routeName: string;
    icon: LucideIcon;
    label: string;
    /** Route pattern used for the active check (defaults to routeName). */
    pattern?: string;
    trailing?: ReactNode;
}) => {
    const active = isCurrent(pattern ?? routeName);

    return (
        <Link
            as="button"
            href={route(routeName)}
            aria-current={active ? "page" : undefined}
            className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            <Icon className="size-5 shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            {trailing}
        </Link>
    );
};

/** Accordion section that opens itself when one of its child routes is active. */
const NavGroup = ({
    value,
    label,
    icon: Icon,
    active,
    children,
}: {
    value: string;
    label: string;
    icon: LucideIcon;
    active: boolean;
    children: ReactNode;
}) => (
    <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue={active ? value : ""}
    >
        <AccordionItem value={value} className="border-none">
            <AccordionTrigger
                className={cn(
                    "py-1.5 my-1 hover:no-underline",
                    active ? "text-primary font-medium" : "text-muted-foreground"
                )}
            >
                <div className="flex gap-2 items-center">
                    <Icon className="size-5" />
                    <p>{label}</p>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="pl-2 flex flex-col gap-0.5">{children}</div>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
);

const SidebarItems = ({ user }: { user: User }) => {
    // Managers currently share the admin's menu; permissions can be narrowed later.
    const isAdminLike = user.role === "admin" || user.role === "manager";
    // Authorization keys are admin-only — a manager who could issue keys could
    // authorize themselves for the actions those keys are meant to gate.
    const isAdmin = user.role === "admin";

    return (
        <>
            <NavLink routeName="dashboard" icon={Home} label="Dashboard" />

            {isAdminLike && (
                <NavGroup
                    value="setup"
                    label="Setup"
                    icon={Settings}
                    active={isAnyCurrent([
                        "company.*",
                        "branches.*",
                        "payments.*",
                        "suppliers.*",
                        "authorization-keys.*",
                    ])}
                >
                    <NavLink
                        routeName="company.edit"
                        icon={ArrowRight}
                        label="Company"
                        pattern="company.*"
                    />
                    <NavLink
                        routeName="branches.index"
                        icon={ArrowRight}
                        label="Branches"
                        pattern="branches.*"
                    />
                    <NavLink
                        routeName="payments.index"
                        icon={ArrowRight}
                        label="Payment Methods"
                        pattern="payments.*"
                    />
                    <NavLink
                        routeName="suppliers.index"
                        icon={ArrowRight}
                        label="Suppliers"
                        pattern="suppliers.*"
                    />
                    {isAdmin && (
                        <NavLink
                            routeName="authorization-keys.index"
                            icon={ArrowRight}
                            label="Authorization keys"
                            pattern="authorization-keys.*"
                        />
                    )}
                </NavGroup>
            )}

            <NavGroup
                value="seller"
                label="Seller activities"
                icon={Scale}
                active={isCurrent("cart.*")}
            >
                <NavLink
                    routeName="cart.sales"
                    icon={ShoppingBasket}
                    label="My Sales"
                />
                <NavLink
                    routeName="cart.index"
                    icon={ShoppingBasket}
                    label="Sell product"
                />
                <NavLink
                    routeName="cart.pricing"
                    icon={ShoppingBasket}
                    label="Pricing List"
                />
                <NavLink
                    routeName="cart.expenses"
                    icon={ShoppingBasket}
                    label="Add Expenses"
                />
                <NavLink
                    routeName="cart.credits"
                    icon={ShoppingBasket}
                    label="Credit Sales"
                />
            </NavGroup>

            {isAdminLike && (
                <>
                    <NavLink
                        routeName="orders.index"
                        icon={ShoppingCart}
                        label="Orders"
                        pattern="orders.index"
                        trailing={
                            <Badge
                                variant="secondary"
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                            >
                                6
                            </Badge>
                        }
                    />
                    <NavLink
                        routeName="orders.invoices"
                        icon={SearchCheckIcon}
                        label="Invoices"
                        pattern="orders.invoice*"
                    />
                    <NavLink
                        routeName="products.index"
                        icon={BookOpen}
                        label="Products"
                        pattern="products.*"
                    />
                    <NavLink
                        routeName="newstocks.index"
                        icon={Package}
                        label="New Stocks"
                        pattern="newstocks.*"
                    />
                    <NavLink
                        routeName="purchase-orders.index"
                        icon={ShoppingCart}
                        label="Purchase Orders"
                        pattern="purchase-orders.*"
                    />
                    <NavLink
                        routeName="users.index"
                        icon={Users}
                        label="Employees"
                        pattern="users.*"
                    />
                    <NavLink
                        routeName="product-transfers.index"
                        icon={BotIcon}
                        label="Stock Transfers"
                        pattern="product-transfers.*"
                    />
                </>
            )}

            {isAdminLike && (
                <NavGroup
                    value="reports"
                    label="Reports"
                    icon={Scale}
                    active={isCurrent("reports.*")}
                >
                    <NavLink
                        routeName="reports.salesReport"
                        icon={FileCheck2}
                        label="Sales Report"
                    />
                    <NavLink
                        routeName="reports.creditReport"
                        icon={FileCheck2}
                        label="Credit Sales Report"
                    />
                    <NavLink
                        routeName="reports.productSales"
                        icon={BarChart}
                        label="Sales by Product"
                    />
                    <NavLink
                        routeName="reports.expensesReport"
                        icon={FileCheck2}
                        label="Expenses Report"
                    />
                    <NavLink
                        routeName="reports.sales"
                        icon={FileCheck2}
                        label="Sellers Reports"
                    />
                    <NavLink
                        routeName="reports.expenses"
                        icon={FileCheck2}
                        label="Daily Expenses"
                    />
                    <NavLink
                        routeName="reports.stocktransfers"
                        icon={FileCheck2}
                        label="Transfered stocks"
                    />
                    <NavLink
                        routeName="reports.legacyStockTransfers"
                        icon={FileCheck2}
                        label="Legacy Transfered stocks"
                    />
                    <NavLink
                        routeName="reports.newstocks"
                        icon={FileCheck2}
                        label="New stocks reports"
                    />
                    <NavLink
                        routeName="reports.outstock"
                        icon={FileCheck2}
                        label="Out of stock"
                    />
                    <NavLink
                        routeName="reports.zerostock"
                        icon={FileCheck2}
                        label="Zero stock"
                    />
                    <NavLink
                        routeName="reports.inventory"
                        icon={BarChart}
                        label="Inventory system"
                        pattern="reports.inventory*"
                    />
                    <NavLink
                        routeName="reports.index"
                        icon={BarChart}
                        label="Charts"
                    />
                </NavGroup>
            )}
        </>
    );
};

export default SidebarItems;
