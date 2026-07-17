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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageProps } from "@/types";
import { Branch } from "@/lib/schemas";
import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
    Building2,
    MoreHorizontal,
    Pencil,
    Plus,
    SearchIcon,
    Trash2,
} from "lucide-react";
import { BranchFormDialog } from "./Partials/BranchFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type BranchRow = Branch & {
    users_count: number;
    products_count: number;
    orders_count: number;
    customers_count: number;
    expenses_count: number;
    purchase_orders_count: number;
    stock_transfers_count: number;
    product_transfers_count: number;
};

/** Rows shown in the delete-impact list (only non-zero ones are rendered). */
const impactOf = (b: BranchRow) => [
    { label: "orders", value: b.orders_count },
    { label: "products", value: b.products_count },
    { label: "customers", value: b.customers_count },
    { label: "expenses", value: b.expenses_count },
    { label: "purchase orders", value: b.purchase_orders_count },
    { label: "stock transfers", value: b.stock_transfers_count },
    { label: "product transfers", value: b.product_transfers_count },
];

const Index = ({ auth, branches }: PageProps<{ branches: BranchRow[] }>) => {
    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<BranchRow | null>(null);
    const [deleting, setDeleting] = useState<BranchRow | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return branches;
        return branches.filter((b) =>
            [b.name, b.city, b.email, b.phone]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [branches, search]);

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (branch: BranchRow) => {
        setEditing(branch);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleting) return;
        setProcessing(true);
        setError(undefined);

        router.delete(route("branches.destroy", deleting.id), {
            data: { confirm_name: deleting.name },
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Branch deleted");
                setDeleting(null);
            },
            onError: (errors) =>
                setError(errors.confirm_name ?? "Could not delete this branch."),
            onFinish: () => setProcessing(false),
        });
    };

    const isLastBranch = branches.length <= 1;

    return (
        <Authenticated user={auth.user}>
            <Head title="Branches" />

            <section className="space-y-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Branches
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {branches.length} branch
                            {branches.length === 1 ? "" : "es"} in your company.
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="size-4" /> Add branch
                    </Button>
                </header>

                <div className="relative max-w-sm">
                    <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search branches…"
                        className="pl-8"
                    />
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead className="text-right">Staff</TableHead>
                                    <TableHead className="text-right">Products</TableHead>
                                    <TableHead className="text-right">Orders</TableHead>
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
                                            {branches.length === 0 ? (
                                                <span className="flex flex-col items-center gap-2">
                                                    <Building2 className="size-6 opacity-50" />
                                                    No branches yet.
                                                </span>
                                            ) : (
                                                "No branches match your search."
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {filtered.map((branch) => (
                                    <TableRow key={branch.id}>
                                        <TableCell className="font-medium">
                                            {branch.name}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <div>{branch.phone || "—"}</div>
                                            <div>{branch.email || ""}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <div>{branch.city || "—"}</div>
                                            <div>{branch.address || ""}</div>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {branch.users_count}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {branch.products_count}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {branch.orders_count.toLocaleString()}
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
                                                        onClick={() => openEdit(branch)}
                                                        className="gap-2"
                                                    >
                                                        <Pencil className="size-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        disabled={isLastBranch}
                                                        onClick={() => {
                                                            setError(undefined);
                                                            setDeleting(branch);
                                                        }}
                                                        className="gap-2 text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="size-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </section>

            <BranchFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                branch={editing}
            />

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.name ?? "branch"}?`}
                description="This permanently deletes the branch and everything recorded against it. This cannot be undone."
                confirmLabel="Delete branch"
                confirmText={deleting?.name}
                processing={processing}
                error={error}
                onConfirm={confirmDelete}
            >
                {deleting && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                        {impactOf(deleting).every((i) => i.value === 0) ? (
                            <p className="text-muted-foreground">
                                This branch has no records attached.
                            </p>
                        ) : (
                            <>
                                <p className="mb-2 font-medium text-destructive">
                                    The following will be permanently deleted:
                                </p>
                                <ul className="flex flex-wrap gap-1.5">
                                    {impactOf(deleting)
                                        .filter((i) => i.value > 0)
                                        .map((i) => (
                                            <li key={i.label}>
                                                <Badge variant="destructive">
                                                    {i.value.toLocaleString()} {i.label}
                                                </Badge>
                                            </li>
                                        ))}
                                </ul>
                            </>
                        )}
                        {deleting.users_count > 0 && (
                            <p className="mt-2 text-muted-foreground">
                                {deleting.users_count} employee
                                {deleting.users_count === 1 ? "" : "s"} will be
                                unassigned from this branch.
                            </p>
                        )}
                    </div>
                )}
            </ConfirmDialog>
        </Authenticated>
    );
};

export default Index;
