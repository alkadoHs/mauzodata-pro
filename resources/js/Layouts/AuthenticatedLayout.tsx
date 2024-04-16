import { PropsWithChildren, ReactNode } from "react";
import { User as AuthUser } from "@/types";
import { PanelRight, ShoppingBagIcon, ShoppingCartIcon } from "lucide-react";
import UserProfile from "@/Components/UserProfile";
import Sidebar from "./Sidebar";
import { Link, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModToggle";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { Input } from "@/components/ui/input";

export default function Authenticated({
    user,
    header,
    children,
}: PropsWithChildren<{ user: AuthUser; header?: ReactNode }>) {
    const iconClasses =
        "text-2xl stroke-2 text-green-400 text-default-500 pointer-events-none flex-shrink-0";

    return (
        <div className="min-h-screen mx-auto flex items-start bg-gray-100 dark:bg-slate-900">
            <Sidebar user={user} />
            <main className="w-full">
                <nav className="z-30 bg-zinc-200 text-slate-900 dark:text-slate-100 dark:bg-slate-950/50 py-2 px-2 sticky top-0">
                    <ul className="flex justify-end gap-4">
                        <li className="flex items-center gap-2 mr-auto">
                            <span className="p-1.5 rounded-s-xl bg-green-950/30">
                                <ApplicationLogo className={iconClasses} />
                            </span>
                            <span className="font-medium text-default-500 hidden lg:inline-block">
                                Mauzodata
                            </span>
                        </li>

                        <li className="flex-1">
                            <Input
                                className="bg-slate-100 dark:bg-transparent"
                                type="search"
                                placeholder="Find invoice"
                            />
                        </li>

                        <li className="flex items-center gap-4">
                            <ModeToggle />
                            <Button
                                size={"icon"}
                                variant={"outline"}
                                onClick={() =>
                                    router.visit(route("cart.index"))
                                }
                            >
                                <ShoppingCartIcon className="text-default-400 size-5" />
                            </Button>
                            <UserProfile user={user} />
                        </li>
                    </ul>
                </nav>
                <div>{children}</div>
            </main>
        </div>
    );
}
