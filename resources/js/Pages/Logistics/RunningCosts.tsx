import { Button } from "@/components/ui/button";
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
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import { Info, Plus, SearchIcon, Trash2, Wallet } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";

/** Radix Select needs a value for "the business, not one lorry". */
const WHOLE_BUSINESS = "business";

type Cost = {
    id: number;
    category: string;
    category_label: string;
    amount: number;
    description: string | null;
    spent_at: string | null;
    truck: string | null;
};

/**
 * Insurance, licences, servicing, salaries — the costs of being in business
 * rather than of any one journey.
 *
 * Without these the profit figure is trip margin wearing a bigger word, which
 * is the whole reason this screen exists.
 */
export default function RunningCosts({
    auth,
    costs,
    total,
    categories,
    trucks,
    filters,
}: PageProps<{
    costs: Cost[];
    total: number;
    categories: Record<string, string>;
    trucks: { id: number; plate_number: string; name: string | null }[];
    filters: { from_date: string | null; to_date: string | null };
}>) {
    const [from, setFrom] = useState(filters.from_date ?? "");
    const [to, setTo] = useState(filters.to_date ?? "");

    const form = useForm({
        category: "insurance",
        amount: "",
        description: "",
        spent_at: new Date().toISOString().slice(0, 10),
        truck_id: WHOLE_BUSINESS as string,
    });

    const apply: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            route("logistics.running-costs.index"),
            { from_date: from || undefined, to_date: to || undefined },
            { preserveState: true, replace: true }
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.transform((d) => ({
            ...d,
            truck_id: d.truck_id === WHOLE_BUSINESS ? "" : d.truck_id,
        }));
        form.post(route("logistics.running-costs.store"), {
            preserveScroll: true,
            onSuccess: () => {
                form.setData("amount", "");
                form.setData("description", "");
                toast.success("Running cost recorded");
            },
        });
    };

    const remove = (id: number) =>
        router.delete(route("logistics.running-costs.destroy", id), {
            preserveScroll: true,
            onSuccess: () => toast.success("Removed"),
        });

    const errors = Object.values(form.errors);

    return (
        <Authenticated user={auth.user}>
            <Head title="Running costs" />

            <section className="flex flex-col gap-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Running costs
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            What the business costs between journeys.
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-2 text-right">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            Shown here
                        </div>
                        <div className="text-xl font-semibold tabular-nums">
                            {numberFormat(total)}
                        </div>
                    </div>
                </header>

                <form onSubmit={submit} className="rounded-lg border bg-card p-3">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                        <Select
                            value={form.data.category}
                            onValueChange={(v) => form.setData("category", v)}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(categories).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <NumericFormat
                            customInput={Input}
                            value={form.data.amount}
                            onValueChange={({ value }) => form.setData("amount", value)}
                            thousandSeparator=","
                            allowNegative={false}
                            placeholder="Amount"
                        />
                        <Select
                            value={form.data.truck_id}
                            onValueChange={(v) => form.setData("truck_id", v)}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={WHOLE_BUSINESS}>
                                    Whole business
                                </SelectItem>
                                {trucks.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                        {t.plate_number}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            value={form.data.description}
                            onChange={(e) => form.setData("description", e.target.value)}
                            placeholder="Note (optional)"
                        />
                        <Input
                            type="date"
                            value={form.data.spent_at}
                            onChange={(e) => form.setData("spent_at", e.target.value)}
                        />
                        <Button type="submit" disabled={form.processing} className="gap-1">
                            <Plus className="size-4" /> Add
                        </Button>
                    </div>
                    {errors.length > 0 && (
                        <p className="mt-2 text-sm text-destructive">{errors[0]}</p>
                    )}
                </form>

                <form
                    onSubmit={apply}
                    className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3"
                >
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        From
                        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        To
                        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                    </label>
                    <Button type="submit" variant="outline" className="gap-2">
                        <SearchIcon className="size-4" /> Filter
                    </Button>
                </form>

                <div className="overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cost</TableHead>
                                <TableHead>Belongs to</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {costs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                                        <span className="flex flex-col items-center gap-2">
                                            <Wallet className="size-6 opacity-50" />
                                            Nothing recorded for this period.
                                        </span>
                                    </TableCell>
                                </TableRow>
                            )}

                            {costs.map((cost) => (
                                <TableRow key={cost.id} className="group">
                                    <TableCell>
                                        <div className="font-medium">{cost.category_label}</div>
                                        {cost.description && (
                                            <div className="text-xs text-muted-foreground">
                                                {cost.description}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {cost.truck ?? "Whole business"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {cost.spent_at}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {numberFormat(cost.amount)}
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            type="button"
                                            onClick={() => remove(cost.id)}
                                            className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus:opacity-100 group-hover:opacity-100"
                                            aria-label="Remove"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex gap-2 rounded-md border bg-card p-3 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <p>
                        Costs tied to one lorry — its insurance, its service —
                        come off that lorry's net in the profit report. Costs
                        marked <b>whole business</b> come off the bottom line but
                        are not split across the fleet, because any split would
                        be a guess.
                    </p>
                </div>
            </section>
        </Authenticated>
    );
}
