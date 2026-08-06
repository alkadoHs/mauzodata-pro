import InputError from "@/Components/InputError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { numberFormat } from "@/lib/utils";
import { Link, useForm } from "@inertiajs/react";
import { Plus, Settings2, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

export type ExpenseCategory = { id: number; name: string };

type Line = { expense_category_id: string; cost: string };

const blank = (): Line => ({ expense_category_id: "", cost: "" });

const ExpenseForm = ({
    categories,
    canManageCategories,
}: {
    categories: ExpenseCategory[];
    canManageCategories: boolean;
}) => {
    const [lines, setLines] = useState<Line[]>([blank()]);

    const { data, setData, post, processing, errors, reset } = useForm<{
        expenses: Line[];
    }>({ expenses: [] });

    const sync = (next: Line[]) => {
        setLines(next);
        setData("expenses", next);
    };

    const change = (index: number, field: keyof Line, value: string) => {
        // Copy the row too — spreading the array alone still shares the row object.
        const next = lines.map((l, i) =>
            i === index ? { ...l, [field]: value } : l
        );
        sync(next);
    };

    const addLine = () => sync([...lines, blank()]);
    const removeLine = (index: number) =>
        sync(lines.filter((_, i) => i !== index));

    const filled = (l: Line) =>
        l.expense_category_id !== "" && l.cost.trim() !== "";
    const canAdd = lines.length === 0 || filled(lines[lines.length - 1]);
    const total = lines.reduce((acc, l) => acc + (parseFloat(l.cost) || 0), 0);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (lines.length === 0 || lines.some((l) => !filled(l))) {
            toast.error("Choose a category and a cost on every line.");
            return;
        }

        post(route("expenses.store"), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Expenses recorded.");
                reset();
                sync([blank()]);
            },
            onError: (errs) => toast.error(errs.expenses ?? "Could not save."),
        });
    };

    // Nothing to file an expense under yet. Say so plainly rather than showing
    // a form that cannot be submitted.
    if (categories.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
                <p className="font-medium">No expense categories yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Expenses are filed under a category — Chakula, Mafuta and so
                    on.{" "}
                    {canManageCategories
                        ? "Add the first one to get started."
                        : "Ask an admin or manager to add them."}
                </p>
                {canManageCategories && (
                    <Link href={route("expense-categories.index")}>
                        <Button className="mt-3 gap-2" variant="outline">
                            <Settings2 className="size-4" /> Manage categories
                        </Button>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <form
            onSubmit={submit}
            className="space-y-4 rounded-xl border border-border bg-card p-4"
        >
            <div className="space-y-2">
                {lines.map((line, index) => {
                    const categoryErr = (errors as Record<string, string>)[
                        `expenses.${index}.expense_category_id`
                    ];
                    const costErr = (errors as Record<string, string>)[
                        `expenses.${index}.cost`
                    ];

                    return (
                        <div key={index}>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={line.expense_category_id}
                                    onValueChange={(v) =>
                                        change(index, "expense_category_id", v)
                                    }
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="What was it for?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category.id}
                                                value={String(category.id)}
                                            >
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    inputMode="decimal"
                                    placeholder="Cost"
                                    value={line.cost}
                                    onChange={(e) => {
                                        // Digits + one decimal point; no negatives.
                                        if (!/^\d*\.?\d*$/.test(e.target.value))
                                            return;
                                        change(index, "cost", e.target.value);
                                    }}
                                    className="w-32"
                                />
                                {/* type="button" — without it these submit the form */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 text-destructive"
                                    aria-label="Remove line"
                                    disabled={lines.length === 1}
                                    onClick={() => removeLine(index)}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                            <InputError
                                message={categoryErr || costErr}
                                className="mt-1"
                            />
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={addLine}
                    disabled={!canAdd}
                >
                    <Plus className="size-4" /> Add line
                </Button>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                        Total{" "}
                        <b className="text-foreground tabular-nums">
                            {numberFormat(total)}
                        </b>
                    </span>
                    <Button type="submit" disabled={processing || total <= 0}>
                        {processing ? "Saving…" : "Save expenses"}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default ExpenseForm;
