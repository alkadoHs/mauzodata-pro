import { PropsWithChildren, ReactNode } from "react";
import { User as AuthUser } from "@/types";
import {
    Bell,
    CircleUser,
    Menu,
    Package,
    Package2,
    Search,
} from "lucide-react";
import { Link, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModToggle";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { SheetTrigger, SheetContent, Sheet } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import SidebarItems from "@/components/SidebarItems";

export default function Authenticated({
    user,
    header,
    children,
}: PropsWithChildren<{ user: AuthUser; header?: ReactNode, }>) {
    const iconClasses =
        "text-2xl stroke-2 text-green-400 text-default-500 pointer-events-none flex-shrink-0";

    // const auth = PageProps
    return (
        <div className="grid items-start min-h-screen w-full bg-gray-100 dark:bg-gray-900 md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            {/* Sidebar start */}
            <div className="sticky top-0 hidden border-r dark:border-muted/80 bg-muted/40 md:block">
                <div className="flex h-dvh max-h-screen flex-col gap-2">
                    {/* sidebar header copilot */}
                    <div className="flex h-14 items-center border-b dark:border-muted/80 px-4 lg:h-[60px] lg:px-6">
                        <Link
                            as="button"
                            href=""
                            className="flex items-center gap-2 font-semibold"
                        >
                            <Package2 className="h-6 w-6" />
                            <span className="">Mauzodata Ad</span>
                        </Link>
                        <Button
                            variant="outline"
                            size="icon"
                            className="ml-auto h-8 w-8"
                        >
                            <Bell className="h-4 w-4" />
                            <span className="sr-only">
                                Toggle notifications
                            </span>
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {/* Sidebar List  */}
                        <nav className="grid gap-2 items-start px-2 text-sm font-medium lg:px-4">
                            <SidebarItems user={user} />
                        </nav>
                    </div>
                    {/* <div className="mt-auto p-4">
                        <Card x-chunk="dashboard-02-chunk-0">
                            <CardHeader className="p-2 pt-0 md:p-4">
                                <CardTitle>Upgrade to Pro</CardTitle>
                                <CardDescription>
                                    Unlock all features and get unlimited access
                                    to our support team.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                                <Button size="sm" className="w-full">
                                    Upgrade
                                </Button>
                            </CardContent>
                        </Card>
                    </div> */}
                </div>
            </div>
            <div className="max-w-full overflow-hidden flex flex-col">
                <header className="sticky top-0 print:hidden flex h-14 items-center gap-4 border-b dark:border-muted/80 bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">
                                    Toggle navigation menu
                                </span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <nav className="grid gap-2 text-lg font-medium">
                                <SidebarItems user={user} />
                            </nav>
                            <div className="mt-auto">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Upgrade to Pro</CardTitle>
                                        <CardDescription>
                                            Unlock all features and get
                                            unlimited access to our support
                                            team.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button size="sm" className="w-full">
                                            Upgrade
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                        <form>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search products..."
                                    className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                                />
                            </div>
                        </form>
                    </div>
                    <ModeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full"
                            >
                                <CircleUser className="h-5 w-5" />
                                <span className="sr-only">
                                    Toggle user menu
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() =>
                                    router.get(route("profile.edit"))
                                }
                            >
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem>Support</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => router.post(route("logout"))}
                            >
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="over flex flex-1 flex-col gap-4 p-4 print:p-0 lg:gap-6 lg:p-6">
                    { children }
                </main>
            </div>
        </div>
    );
}
