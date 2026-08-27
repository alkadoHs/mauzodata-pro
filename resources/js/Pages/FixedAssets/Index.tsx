import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Branch, FixedAsset } from "@/lib/schemas";
import { cn, numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import {
    Landmark,
    MoreHorizontal,
    Pencil,
    Plus,
    SearchIcon,
    Trash2,
    Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FixedAssetFormDialog } from "./Partials/FixedAssetFormDialog";

const ALL = "all";
const COMPANY = "company";

type Totals = {
    active_value: number;
    active_count: number;
    broken_value: number;
    broken_count: number;
};

type Props = {
    assets: FixedAsset[];
    branches: Branch[];
    totals: Totals;
    filters: { branch: string; search: string };
};

/**
 * The company's register of fixed assets — a way to answer "what is this
 * business actually worth", not just "what's in the till today". Each item
 * is recorded on its own, with its own value, because two of the same
 * computer can be worth two different amounts.
 */
export default function FixedAssets({
    auth,
    assets,
    branches,
    totals,
    filters,
}: PageProps<Props>) {
    const [branchFilter, setBranchFilter] = useState(filters.branch || ALL);
    const [search, setSearch] = useState(filters.search);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<FixedAsset | null>(null);
    const [deleting, setDeleting] = useState<FixedAsset | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const apply = (next: { branch?: string; search?: string }) => {
        router.get(
            route("fixed-assets.index"),
            {
                branch: next.branch ?? branchFilter,
                search: (next.search ?? search) || undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const onBranchChange = (value: string) => {
        setBranchFilter(value);
        apply({ branch: value });
    };

    const onSearchChange = useDebouncedCallback((value: string) => {
        apply({ search: value });
    }, 400);

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (asset: FixedAsset) => {
        setEditing(asset);
        setFormOpen(true);
    };

    const toggleStatus = (asset: FixedAsset) => {
        const status = asset.status === "broken" ? "active" : "broken";
        router.patch(
            route("fixed-assets.status", asset.id),
            { status },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        status === "broken" ? "Marked as broken" : "Marked as active"
                    ),
                onError: () => toast.error("Could not update this asset."),
            }
        );
    };

    const confirmDelete = () => {
        if (!deleting) return;
        setProcessing(true);
        setError(undefined);

        router.delete(route("fixed-assets.destroy", deleting.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Asset removed");
                setDeleting(null);
            },
            onError: () => setError("Could not remove this asset."),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Authenticated user={auth.user}>
            <Head title="Fixed Assets" />

            <section className="flex flex-col gap-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Fixed Assets
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Computers, printers, vehicles — what the company owns,
                            and what it's worth.
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="size-4" /> Record asset
                    </Button>
                </header>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat
                        label="Company net worth"
                        value={totals.active_value}
                        hint={`${numberFormat(totals.active_count)} active asset(s)`}
                    />
                    <Stat
                        label="Active assets"
                        value={totals.active_count}
                        hint="currently in service"
                    />
                    <Stat
                        label="Broken"
                        value={totals.broken_value}
                        hint={`${numberFormat(totals.broken_count)} item(s) need attention`}
                        tone="out"
                    />
                    <Stat
                        label="Recorded overall"
                        value={totals.active_count + totals.broken_count}
                        hint="assets on file"
                    />
                </div>

                <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        Branch
                        <Select value={branchFilter} onValueChange={onBranchChange}>
                            <SelectTrigger className="w-[220px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>All branches</SelectItem>
                                <SelectItem value={COMPANY}>Company-wide only</SelectItem>
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={String(branch.id)}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <label className="flex flex-1 min-w-[200px] flex-col gap-1 text-xs text-muted-foreground">
                        Search
                        <div className="relative">
                            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="pl-8"
                                placeholder="Search by name or notes…"
                                defaultValue={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    onSearchChange(e.target.value);
                                }}
                            />
                        </div>
                    </label>
                </div>

                <div className="overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Asset</TableHead>
                                <TableHead>Belongs to</TableHead>
                                <TableHead className="text-right">Value</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Acquired</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assets.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        <span className="flex flex-col items-center gap-2">
                                            <Landmark className="size-6 opacity-50" />
                                            {filters.search || filters.branch !== ALL
                                                ? "No assets match this filter."
                                                : "No assets recorded yet."}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            )}

                            {assets.map((asset) => {
                                const broken = asset.status === "broken";
                                return (
                                    <TableRow
                                        key={asset.id}
                                        className={cn(
                                            broken && "bg-red-50/60 dark:bg-red-500/10"
                                        )}
                                    >
                                        <TableCell>
                                            <div className="font-medium">{asset.name}</div>
                                            {asset.notes && (
                                                <div className="max-w-xs truncate text-xs text-muted-foreground">
                                                    {asset.notes}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {asset.branch ? (
                                                <Badge variant="secondary">
                                                    {asset.branch.name}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">Company-wide</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {numberFormat(asset.value)}
                                        </TableCell>
                                        <TableCell>
                                            {broken ? (
                                                <Badge
                                                    variant="destructive"
                                                    className="gap-1"
                                                >
                                                    <Wrench className="size-3" /> Broken
                                                </Badge>
                                            ) : (
                                                <Badge className="border-transparent bg-emerald-600 text-white hover:bg-emerald-600/90">
                                                    Active
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {asset.acquired_at ?? "—"}
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
                                                        <span className="sr-only">Actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => openEdit(asset)}
                                                        className="gap-2"
                                                    >
                                                        <Pencil className="size-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => toggleStatus(asset)}
                                                        className="gap-2"
                                                    >
                                                        <Wrench className="size-4" />
                                                        {broken
                                                            ? "Mark as active"
                                                            : "Mark as broken"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setError(undefined);
                                                            setDeleting(asset);
                                                        }}
                                                        className="gap-2 text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="size-4" /> Delete
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
            </section>

            <FixedAssetFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                branches={branches}
                asset={editing}
            />

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.name ?? "this asset"}?`}
                description="This removes it from the register entirely — its value will no longer count toward the company's net worth. If it's just out of service, consider marking it broken instead."
                confirmLabel="Delete"
                processing={processing}
                error={error}
                onConfirm={confirmDelete}
            />
        </Authenticated>
    );
}

function Stat({
    label,
    value,
    hint,
    tone,
}: {
    label: string;
    value: number;
    hint?: string;
    tone?: "in" | "out";
}) {
    return (
        <div className="rounded-lg border bg-card p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div
                className={cn(
                    "text-xl font-semibold tabular-nums",
                    tone === "in" && "text-emerald-700 dark:text-emerald-400",
                    tone === "out" && "text-red-700 dark:text-red-400"
                )}
            >
                {numberFormat(value)}
            </div>
            {hint && (
                <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
            )}
        </div>
    );
}
