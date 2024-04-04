import { useState, PropsWithChildren, ReactNode } from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { Link, router } from "@inertiajs/react";
import { User as AuthUser } from "@/types";
import {
    Avatar,
    Button,
    Card,
    CardBody,
    ScrollShadow,
    User,
} from "@nextui-org/react";
import { Listbox, ListboxSection, ListboxItem } from "@nextui-org/react";
import { ArrowBigDownDash, ArrowUpDownIcon, BookTextIcon, CircleAlert, CircleMinus, ClipboardListIcon, CopyCheckIcon, CreditCardIcon, DeleteIcon, FileEditIcon, FileLineChart, HomeIcon, Layers3Icon, ListTodo, PanelLeft, PanelRight, Settings, Users } from "lucide-react";
import UserProfile from "@/Components/UserProfile";
import { cn } from "@/lib/utils";

export default function Authenticated({
    user,
    header,
    children,
}: PropsWithChildren<{ user: AuthUser; header?: ReactNode }>) {
    const iconClasses =
        "text-xl text-default-500 pointer-events-none flex-shrink-0";

    return (
        <div className="min-h-screen max-w-7xl mx-auto flex items-start">
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
                            src: "https://github.com/alkadoHs.png",
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
                            onPress={() =>
                                router.visit(route("dashboard"))
                            }
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
                            onPress={() =>
                                router.visit(route("products.index"))
                            }
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
                            startContent={
                                <BookTextIcon className={iconClasses} />
                            }
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
                            startContent={
                                <Layers3Icon className={iconClasses} />
                            }
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
                            startContent={
                                <FileLineChart className={iconClasses} />
                            }
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
            <main className="w-full p-4">
                <Card className="z-30 mb-4 sticky top-0">
                    <CardBody>
                        <div className="flex justify-end">
                            <div className="flex items-center gap-2 mr-auto">
                                <Button size="sm" variant={"flat"} isIconOnly>
                                    <PanelRight className={iconClasses} />
                                </Button>
                                <span className="font-medium text-default-500">
                                    Mauzodata
                                </span>
                            </div>

                            <div>
                                <UserProfile user={user} />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {children}
            </main>
        </div>
    );
}
