import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageProps, User } from "@/types";
import { Branch } from "@/lib/schemas";
import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
    MoreHorizontal,
    Pencil,
    Plus,
    SearchIcon,
    Trash2,
    UserCheck,
    UserX,
    Users as UsersIcon,
} from "lucide-react";
import { UserFormDialog } from "./Partials/UserFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";

type UserRow = User & {
    branch?: Branch | null;
    orders_count: number;
    expenses_count: number;
    purchase_orders_count: number;
};

const roleVariant = (role: string) =>
    role === "admin" || role === "manager" ? "default" : "secondary";

const UsersIndex = ({
    auth,
    users,
    branches,
}: PageProps<{ users: UserRow[]; branches: Branch[] }>) => {
    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<UserRow | null>(null);
    const [deleting, setDeleting] = useState<UserRow | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) =>
            [u.name, u.email, u.phone, u.role, u.branch?.name]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [users, search]);

    const historyOf = (u: UserRow) =>
        u.orders_count + u.expenses_count + u.purchase_orders_count;

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (user: UserRow) => {
        setEditing(user);
        setFormOpen(true);
    };

    const toggleActive = (user: UserRow) => {
        router.patch(
            route("users.toggle-active", user.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        user.isActive ? "Employee deactivated" : "Employee activated"
                    ),
                onError: (errors) =>
                    toast.error(errors.isActive ?? "Could not update this employee."),
            }
        );
    };

    const confirmDelete = () => {
        if (!deleting) return;
        setProcessing(true);
        setError(undefined);

        router.delete(route("users.destroy", deleting.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Employee deleted");
                setDeleting(null);
            },
            onError: (errors) =>
                setError(errors.delete ?? "Could not delete this employee."),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Authenticated user={auth.user}>
            <Head title="Employees" />

            <section className="space-y-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Employees
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {users.length} employee{users.length === 1 ? "" : "s"} ·{" "}
                            {users.filter((u) => u.isActive).length} active
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="size-4" /> Add employee
                    </Button>
                </header>

                <div className="relative max-w-sm">
                    <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search employees…"
                        className="pl-8"
                    />
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Sales</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-28 text-center text-muted-foreground"
                                        >
                                            {users.length === 0 ? (
                                                <span className="flex flex-col items-center gap-2">
                                                    <UsersIcon className="size-6 opacity-50" />
                                                    No employees yet.
                                                </span>
                                            ) : (
                                                "No employees match your search."
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {filtered.map((user) => {
                                    const isSelf = user.id === auth.user.id;
                                    const hasHistory = historyOf(user) > 0;

                                    return (
                                        <TableRow
                                            key={user.id}
                                            className={cn(!user.isActive && "opacity-60")}
                                        >
                                            <TableCell className="font-medium">
                                                {user.name}
                                                {isSelf && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        (you)
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                <div>{user.email}</div>
                                                <div>{user.phone || ""}</div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {user.branch?.name ?? (
                                                    <span className="text-destructive">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={roleVariant(user.role)}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                                                        user.isActive
                                                            ? "bg-accent text-accent-foreground"
                                                            : "bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            "size-1.5 rounded-full",
                                                            user.isActive
                                                                ? "bg-current"
                                                                : "bg-current opacity-50"
                                                        )}
                                                    />
                                                    {user.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {user.orders_count.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                            <span className="sr-only">
                                                                Actions
                                                            </span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => openEdit(user)}
                                                            className="gap-2"
                                                        >
                                                            <Pencil className="size-4" />{" "}
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            disabled={isSelf}
                                                            onClick={() =>
                                                                toggleActive(user)
                                                            }
                                                            className="gap-2"
                                                        >
                                                            {user.isActive ? (
                                                                <>
                                                                    <UserX className="size-4" />{" "}
                                                                    Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserCheck className="size-4" />{" "}
                                                                    Activate
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            disabled={isSelf || hasHistory}
                                                            onClick={() => {
                                                                setError(undefined);
                                                                setDeleting(user);
                                                            }}
                                                            className="gap-2 text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="size-4" />{" "}
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    Employees with sales history can't be deleted — deactivate them
                    instead. A deactivated employee keeps their history but can no
                    longer sign in.
                </p>
            </section>

            <UserFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                branches={branches}
                user={editing}
                actor={auth.user}
            />

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.name ?? "employee"}?`}
                description="This permanently removes their login. This cannot be undone."
                confirmLabel="Delete employee"
                processing={processing}
                error={error}
                onConfirm={confirmDelete}
            />
        </Authenticated>
    );
};

export default UsersIndex;
