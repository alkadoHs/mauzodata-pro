import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "@inertiajs/react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { User } from "@/types";
import { Label } from "@/components/ui/label";
import InputError from "@/Components/InputError";
import { numberFormat } from "@/lib/utils";

type Line = { item: string; cost: string };

const ExpenseForm = ({ user, vendors }: { user: User; vendors: User[] }) => {
    const [lines, setLines] = useState<Line[]>([{ item: "", cost: "" }]);

    const { data, setData, post, processing, errors, reset } = useForm<{
        user_id: string;
        expenses: Line[];
    }>({
        user_id: String(user.id),
        expenses: [],
    });

    const sync = (next: Line[]) => {
        setLines(next);
        setData("expenses", next);
    };

    const change = (index: number, field: keyof Line, value: string) => {
        // Copy the row too — spreading the array alone still shares the row object.
        const next = lines.map((l, i) => (i === index ? { ...l, [field]: value } : l));
        sync(next);
    };

    const addLine = () => sync([...lines, { item: "", cost: "" }]);
    const removeLine = (index: number) => sync(lines.filter((_, i) => i !== index));

    const filled = (l: Line) => l.item.trim() !== "" && l.cost.trim() !== "";
    const canAdd = lines.length === 0 || filled(lines[lines.length - 1]);
    const total = lines.reduce((acc, l) => acc + (parseFloat(l.cost) || 0), 0);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (lines.length === 0 || lines.some((l) => !filled(l))) {
            toast.error("Fill in every item and cost first.");
            return;
        }

        post(route("expenses.store"), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Expenses recorded.");
                reset();
                setLines([{ item: "", cost: "" }]);
            },
            onError: (errs) =>
                toast.error(errs.user_id ?? errs.expenses ?? "Could not save."),
        });
    };

    const forVendor = data.user_id !== String(user.id);

    return (
        <form
            onSubmit={submit}
            className="space-y-4 rounded-xl border border-border bg-card p-4"
        >
            <div className="space-y-1.5 sm:max-w-xs">
                <Label htmlFor="user_id">Logged for</Label>
                <Select
                    value={data.user_id}
                    onValueChange={(v) => setData("user_id", v)}
                >
                    <SelectTrigger id="user_id">
                        <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                        {vendors.map((v) => (
                            <SelectItem key={v.id} value={String(v.id)}>
                                {v.id === user.id ? `${v.name} (you)` : v.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {forVendor && (
                    <p className="text-xs text-muted-foreground">
                        These expenses will be recorded against this vendor, not you.
                    </p>
                )}
                <InputError message={errors.user_id} />
            </div>

            <div className="space-y-2">
                {lines.map((line, index) => {
                    const itemErr = (errors as Record<string, string>)[
                        `expenses.${index}.item`
                    ];
                    const costErr = (errors as Record<string, string>)[
                        `expenses.${index}.cost`
                    ];

                    return (
                        <div key={index}>
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="What was it for?"
                                    value={line.item}
                                    onChange={(e) => change(index, "item", e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    inputMode="decimal"
                                    placeholder="Cost"
                                    value={line.cost}
                                    onChange={(e) => {
                                        // Digits + one decimal point; no negatives.
                                        if (!/^\d*\.?\d*$/.test(e.target.value)) return;
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
                            <InputError message={itemErr || costErr} className="mt-1" />
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
