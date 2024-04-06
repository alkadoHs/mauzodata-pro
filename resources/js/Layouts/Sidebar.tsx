import { User as AuthUser } from "@/types";
import { router } from "@inertiajs/react";
import {
    User,
    ScrollShadow,
    Listbox,
    ListboxItem,
    cn,
} from "@nextui-org/react";
import {
    ArrowUpDownIcon,
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
        <aside className="sticky top-0 min-h-dvh py-4 hidden md:block w-[320px] px-3 border-r border-default">
            <section className="space-y-6">
                <User
                    name="MDS"
                    description="Branch you work on"
                    classNames={{
                        name: "font-bold text-lg text-primary",
                    }}
                    avatarProps={{
                        src: "/logo.svg",
                    }}
                />
                <User
                    name={user.name}
                    description="Mauzodata store admin"
                    avatarProps={{
                        size: "sm",
                        isBordered: true,
                    }}
                />
            </section>

            <ScrollShadow className="max-h-[400px] my-3">
                <Listbox
                    variant="faded"
                    aria-label="Listbox menu with icons"
                    className="p-0"
                >
                    <ListboxItem
                        key="new"
                        startContent={<HomeIcon className={iconClasses} />}
                        onPress={() => router.visit(route("dashboard"))}
                    >
                        Dashboard
                    </ListboxItem>
                    <ListboxItem
                        key="copy"
                        startContent={<Settings className={iconClasses} />}
                    >
                        Settings
                    </ListboxItem>
                    <ListboxItem
                        key="products"
                        startContent={<ListTodo className={iconClasses} />}
                        onPress={() => router.visit(route("products.index"))}
                    >
                        Products
                    </ListboxItem>
                    <ListboxItem
                        key="users"
                        startContent={<Users className={iconClasses} />}
                    >
                        System Users
                    </ListboxItem>
                    <ListboxItem
                        key="customers"
                        startContent={<BookTextIcon className={iconClasses} />}
                    >
                        Customers History
                    </ListboxItem>
                    <ListboxItem
                        key="expenses"
                        startContent={
                            <ClipboardListIcon className={iconClasses} />
                        }
                    >
                        Expenses
                    </ListboxItem>
                    <ListboxItem
                        key="vendor"
                        startContent={<Layers3Icon className={iconClasses} />}
                    >
                        Vendor Products
                    </ListboxItem>
                    <ListboxItem
                        key="transfers"
                        startContent={
                            <ArrowUpDownIcon className={iconClasses} />
                        }
                    >
                        Transfers
                    </ListboxItem>
                    <ListboxItem
                        key="credits"
                        startContent={
                            <CreditCardIcon className={iconClasses} />
                        }
                    >
                        Credit Sales
                    </ListboxItem>
                    <ListboxItem
                        key="reports"
                        startContent={<FileLineChart className={iconClasses} />}
                    >
                        Reports
                    </ListboxItem>
                    <ListboxItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        startContent={
                            <DeleteIcon
                                className={cn(iconClasses, "text-danger")}
                            />
                        }
                    >
                        Delete file
                    </ListboxItem>
                </Listbox>
            </ScrollShadow>
            <section>
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
