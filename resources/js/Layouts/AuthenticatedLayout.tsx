import { PropsWithChildren, ReactNode } from "react";
import { User as AuthUser } from "@/types";
import { PanelRight, ShoppingBagIcon } from "lucide-react";
import UserProfile from "@/Components/UserProfile";
import Sidebar from "./Sidebar";
import { Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModToggle";

export default function Authenticated({
    user,
    header,
    children,
}: PropsWithChildren<{ user: AuthUser; header?: ReactNode }>) {
    const iconClasses =
        "text-xl text-default-500 pointer-events-none flex-shrink-0";

    return (
        <div className="min-h-screen mx-auto flex items-start bg-gray-100 dark:bg-gray-900">
            <Sidebar user={user} />
            <main className="w-full">
                <nav className="z-30 bg-gray-200 dark:bg-gray-700/50 py-2 px-2 sticky top-0">
                    <ul className="flex justify-end">
                        <li className="flex items-center gap-2 mr-auto">
                            <Button size="sm" variant={"ghost"}>
                                <PanelRight className={iconClasses} />
                            </Button>
                            <span className="font-medium text-default-500">
                                Mauzodata
                            </span>
                        </li>

                        <li className="flex items-center gap-4">
                            <ModeToggle />
                            <Link href={route("cart.index")} as="button">
                                <ShoppingBagIcon
                                    size={24}
                                    className="text-default-400"
                                />
                            </Link>
                            <UserProfile user={user} />
                        </li>
                    </ul>
                </nav>
                <div>{children}</div>
            </main>
        </div>
    );
}
