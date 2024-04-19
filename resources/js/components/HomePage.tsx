import { Link, router } from "@inertiajs/react";
import {
    Bell,
    CircleUser,
    Home,
    LineChart,
    Menu,
    Package,
    Package2,
    Search,
    ShoppingCart,
    Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ApplicationLogo from "@/Components/ApplicationLogo";

export function HomePage() {
    return (
        <div className="grid min-h-screen w-full">
            <>
                <main className="w-full flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    <div className="flex items-center w-full">
                        <h1 className="text-lg font-semibold md:text-2xl flex gap-2 items-center">
                            <ApplicationLogo />  <span>Mauzodata</span>
                        </h1>
                    </div>
                    <div
                        className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
                        x-chunk="dashboard-02-chunk-1"
                    >
                        <div className="flex flex-col items-center gap-1 text-center">
                            <h3 className="text-2xl font-bold tracking-tight">
                                We'are working on some awesome features!
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                You can access the demo account only if you have credentials, we plan to release the public demo soon.
                            </p>
                            <Button className="mt-4" onClick={() => router.visit(route('login'))}>Watch the demo</Button>
                        </div>
                    </div>
                </main>
            </>
        </div>
    );
}
