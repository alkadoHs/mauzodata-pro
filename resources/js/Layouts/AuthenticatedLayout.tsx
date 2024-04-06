import { PropsWithChildren, ReactNode } from "react";
import { User as AuthUser } from "@/types";
import { Badge, Button, Card, CardBody } from "@nextui-org/react";
import { PanelRight, ShoppingBagIcon } from "lucide-react";
import UserProfile from "@/Components/UserProfile";
import Sidebar from "./Sidebar";
import { Link } from "@inertiajs/react";

export default function Authenticated({
    user,
    header,
    children,
}: PropsWithChildren<{ user: AuthUser; header?: ReactNode }>) {
    const iconClasses =
        "text-xl text-default-500 pointer-events-none flex-shrink-0";

    return (
        <div className="min-h-screen max-w-7xl mx-auto flex items-start">
            <Sidebar user={user} />
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

                            <div className="flex items-center gap-4">
                                <Link href={route("cart.index")} as="button">
                                    <Badge
                                        color="primary"
                                        content={50}
                                        size="sm"
                                        shape="circle"
                                    >
                                        <ShoppingBagIcon
                                            size={24}
                                            className="text-default-400"
                                        />
                                    </Badge>
                                </Link>
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
