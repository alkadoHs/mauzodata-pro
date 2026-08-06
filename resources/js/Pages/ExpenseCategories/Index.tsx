import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Heading4 } from "@/components/Typography/Heading4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";

type Category = {
    id: number;
    name: string;
    is_active: boolean;
};

/**
 * Two things per category — a name, and whether staff should still be offered
 * it. Adding one is a single field and a switch, nothing else.
 */
export default function ExpenseCategories({
    auth,
    categories,
}: PageProps<{ categories: Category[] }>) {
    const [deleting, setDeleting] = useState<Category | null>(null);
    const [editing, setEditing] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        is_active: true,
    });

    const add: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("expense-categories.store"), {
            preserveScroll: true,
            onSuccess: () => {
                reset("name");
                // Stays on for the next one — adding a run of categories
                // shouldn't mean re-flicking the switch each time.
                setData("is_active", true);
                toast.success("Category added.");
            },
        });
    };

    const toggle = (category: Category) =>
        router.patch(
            route("expense-categories.toggle", category.id),
            {},
            { preserveScroll: true }
        );

    const active = categories.filter((c) => c.is_active).length;

    return (
        <Authenticated user={auth.user}>
            <Head title="Expense categories" />

            <section className="mx-auto flex w-full max-w-2xl flex-col gap-5">
                <div>
                    <Heading4>Expense categories</Heading4>
                    <p className="text-sm text-muted-foreground">
                        What the shop spends money on — Chakula, Mafuta and the
                        rest. {active} of {categories.length} in use.
                    </p>
                </div>

                <form
                    onSubmit={add}
                    className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3"
                >
                    <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
                        <span className="text-sm font-medium">Category name</span>
                        <Input
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="e.g. Chakula"
                            autoFocus
                        />
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium">Visible</span>
                        <div className="flex h-10 items-center gap-2">
                            <ToggleSwitch
                                checked={data.is_active}
                                onChange={(v) => setData("is_active", v)}
                                label="Visible to staff"
                            />
                            <span className="text-sm text-muted-foreground">
                                {data.is_active ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </label>

                    <Button
                        type="submit"
                        disabled={processing || !data.name.trim()}
                        className="gap-2"
                    >
                        <Plus className="size-4" /> Add
                    </Button>

                    {errors.name && (
                        <p className="w-full text-sm text-red-600">
                            {errors.name}
                        </p>
                    )}
                </form>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead className="w-[150px]">
                                    Visible
                                </TableHead>
                                <TableHead className="w-[100px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={3}
                                        className="py-10 text-center text-muted-foreground"
                                    >
                                        No categories yet. Add your first one
                                        above.
                                    </TableCell>
                                </TableRow>
                            )}
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell>
                                        {editing === category.id ? (
                                            <RenameField
                                                category={category}
                                                onDone={() => setEditing(null)}
                                            />
                                        ) : (
                                            <span
                                                className={
                                                    category.is_active
                                                        ? "font-medium"
                                                        : "text-muted-foreground line-through"
                                                }
                                            >
                                                {category.name}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <ToggleSwitch
                                                checked={category.is_active}
                                                onChange={() =>
                                                    toggle(category)
                                                }
                                                label={`Show ${category.name}`}
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {category.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {editing !== category.id && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Rename ${category.name}`}
                                                    onClick={() =>
                                                        setEditing(category.id)
                                                    }
                                                >
                                                    <Pencil className="size-4 text-muted-foreground" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Delete ${category.name}`}
                                                    onClick={() =>
                                                        setDeleting(category)
                                                    }
                                                >
                                                    <Trash2 className="size-4 text-muted-foreground" />
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <p className="text-xs text-muted-foreground">
                    Switching a category off hides it from staff without
                    touching expenses already filed under it. That's usually
                    what you want instead of deleting.
                </p>
            </section>

            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.name ?? ""}?`}
                description="Switching it off keeps your records tidier. Delete only if it was added by mistake."
                confirmLabel="Delete"
                onConfirm={() => {
                    if (!deleting) return;
                    router.delete(
                        route("expense-categories.destroy", deleting.id),
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                toast.success("Category deleted.");
                                setDeleting(null);
                            },
                        }
                    );
                }}
            />
        </Authenticated>
    );
}

/** Inline rename — no dialog for a one-field change. */
function RenameField({
    category,
    onDone,
}: {
    category: Category;
    onDone: () => void;
}) {
    const { data, setData, patch, processing, errors } = useForm({
        name: category.name,
        is_active: category.is_active,
    });

    const save = () =>
        patch(route("expense-categories.update", category.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Category updated.");
                onDone();
            },
        });

    return (
        <div className="flex items-center gap-1.5">
            <Input
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") save();
                    if (e.key === "Escape") onDone();
                }}
                className="h-8 max-w-[220px]"
                autoFocus
            />
            <Button
                size="icon"
                variant="ghost"
                className="size-8"
                disabled={processing}
                onClick={save}
                aria-label="Save"
            >
                <Check className="size-4 text-emerald-600" />
            </Button>
            <Button
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={onDone}
                aria-label="Cancel"
            >
                <X className="size-4 text-muted-foreground" />
            </Button>
            {errors.name && (
                <span className="text-xs text-red-600">{errors.name}</span>
            )}
        </div>
    );
}
