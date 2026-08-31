import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableCell, TableRow } from "@/components/ui/table";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { User } from "@/types";
import { Head } from "@inertiajs/react";
import { LucideIcon, MoreHorizontal, Pencil, Plus, SearchIcon, Trash2 } from "lucide-react";
import { ReactNode } from "react";

/**
 * The shell every logistics register shares — trucks, drivers, clients are
 * the same page with different columns, so the chrome lives here once.
 *
 * Filtering is done in the browser on purpose: these lists are a fleet and a
 * handful of names, not a product catalogue, and a round trip per keystroke
 * would be slower than the thing it replaces.
 */
export function Register({
    user,
    title,
    description,
    addLabel,
    onAdd,
    filter,
    onFilter,
    filterPlaceholder,
    showing,
    children,
}: {
    user: User;
    title: string;
    description: string;
    addLabel: string;
    onAdd: () => void;
    filter: string;
    onFilter: (value: string) => void;
    filterPlaceholder: string;
    /** e.g. "4 of 7" — only shown while a filter is narrowing the list. */
    showing?: string;
    children: ReactNode;
}) {
    return (
        <Authenticated user={user}>
            <Head title={title} />

            <section className="flex flex-col gap-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <Button onClick={onAdd} className="gap-2">
                        <Plus className="size-4" /> {addLabel}
                    </Button>
                </header>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-8"
                            placeholder={filterPlaceholder}
                            value={filter}
                            onChange={(e) => onFilter(e.target.value)}
                        />
                    </div>
                    {showing && (
                        <span className="text-xs text-muted-foreground">{showing}</span>
                    )}
                </div>

                <div className="overflow-x-auto rounded-md border">
                    <Table>{children}</Table>
                </div>
            </section>
        </Authenticated>
    );
}

/** The "nothing here" row, which says which of the two nothings it is. */
export function EmptyRow({
    colSpan,
    icon: Icon,
    filtered,
    empty,
    noMatch,
}: {
    colSpan: number;
    icon: LucideIcon;
    filtered: boolean;
    empty: string;
    noMatch: string;
}) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-32 text-center text-muted-foreground">
                <span className="flex flex-col items-center gap-2">
                    <Icon className="size-6 opacity-50" />
                    {filtered ? noMatch : empty}
                </span>
            </TableCell>
        </TableRow>
    );
}

/** Edit / delete, plus whatever else a particular register needs. */
export function RowActions({
    onEdit,
    onDelete,
    extra,
}: {
    onEdit: () => void;
    onDelete: () => void;
    extra?: ReactNode;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit} className="gap-2">
                    <Pencil className="size-4" /> Edit
                </DropdownMenuItem>
                {extra}
                <DropdownMenuItem
                    onClick={onDelete}
                    className="gap-2 text-destructive focus:text-destructive"
                >
                    <Trash2 className="size-4" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
