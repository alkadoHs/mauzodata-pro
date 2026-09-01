import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn, numberFormat } from "@/lib/utils";
import { useForm, router } from "@inertiajs/react";
import { Banknote, Plus, Receipt, Trash2 } from "lucide-react";
import { FormEventHandler } from "react";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { TripExpense, TripPayment } from "./types";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * What this journey cost.
 *
 * The add form sits at the top of the panel rather than behind a dialog:
 * costs come in fives and sixes per trip — mafuta, kupakia, kushusha, posho —
 * and opening a dialog for each would be four extra clicks a time.
 */
export function ExpensePanel({
    tripId,
    expenses,
    byCategory,
    categories,
    total,
}: {
    tripId: number;
    expenses: TripExpense[];
    byCategory: { category: string; label: string; total: number }[];
    categories: Record<string, string>;
    total: number;
}) {
    const form = useForm({
        category: "fuel",
        amount: "",
        description: "",
        spent_at: today(),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route("logistics.trips.expenses.store", tripId), {
            preserveScroll: true,
            onSuccess: () => {
                // Keep the date and category — the next cost is usually from
                // the same journey, and often the same day.
                form.setData("amount", "");
                form.setData("description", "");
                toast.success("Expense added");
            },
        });
    };

    const remove = (id: number) =>
        router.delete(route("logistics.trips.expenses.destroy", id), {
            preserveScroll: true,
            onSuccess: () => toast.success("Expense removed"),
        });

    return (
        <Panel
            title="Expenses"
            icon={Receipt}
            total={total}
            tone="out"
            subtitle="What this journey cost on the road"
        >
            <form onSubmit={submit} className="grid gap-2 border-b p-3 sm:grid-cols-[1fr_auto]">
                <div className="grid gap-2 sm:grid-cols-2">
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
                </div>
                <Button type="submit" disabled={form.processing} className="gap-1 sm:self-stretch">
                    <Plus className="size-4" /> Add
                </Button>
                <FormErrors errors={form.errors} />
            </form>

            {byCategory.length > 1 && (
                <div className="flex flex-wrap gap-1.5 border-b bg-muted/30 p-3">
                    {byCategory.map((row) => (
                        <span
                            key={row.category}
                            className="rounded-md border bg-background px-2 py-1 text-xs"
                        >
                            {row.label.replace(/\s*\(.*\)$/, "")}{" "}
                            <b className="tabular-nums">{numberFormat(row.total)}</b>
                        </span>
                    ))}
                </div>
            )}

            <LedgerList
                rows={expenses.map((e) => ({
                    id: e.id,
                    primary: e.category_label,
                    secondary: [e.spent_at, e.description].filter(Boolean).join(" · "),
                    amount: e.amount,
                }))}
                emptyIcon={Receipt}
                empty="Nothing spent on this trip yet."
                onRemove={remove}
                tone="out"
            />
        </Panel>
    );
}

/** What the client has actually handed over. */
export function PaymentPanel({
    tripId,
    payments,
    total,
    balance,
}: {
    tripId: number;
    payments: TripPayment[];
    total: number;
    balance: number;
}) {
    const form = useForm({
        amount: "",
        paid_at: today(),
        method: "",
        note: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route("logistics.trips.payments.store", tripId), {
            preserveScroll: true,
            onSuccess: () => {
                form.setData("amount", "");
                form.setData("note", "");
                toast.success("Payment recorded");
            },
        });
    };

    const remove = (id: number) =>
        router.delete(route("logistics.trips.payments.destroy", id), {
            preserveScroll: true,
            onSuccess: () => toast.success("Payment removed"),
        });

    return (
        <Panel
            title="Payments"
            icon={Banknote}
            total={total}
            tone="in"
            subtitle={
                balance > 0
                    ? `${numberFormat(balance)} still owed`
                    : "Fully settled"
            }
        >
            <form onSubmit={submit} className="grid gap-2 border-b p-3 sm:grid-cols-[1fr_auto]">
                <div className="grid gap-2 sm:grid-cols-2">
                    <NumericFormat
                        customInput={Input}
                        value={form.data.amount}
                        onValueChange={({ value }) => form.setData("amount", value)}
                        thousandSeparator=","
                        allowNegative={false}
                        placeholder="Amount"
                    />
                    <Input
                        type="date"
                        value={form.data.paid_at}
                        onChange={(e) => form.setData("paid_at", e.target.value)}
                    />
                    <Input
                        value={form.data.method}
                        onChange={(e) => form.setData("method", e.target.value)}
                        placeholder="Cash, M-Pesa, bank…"
                    />
                    <Input
                        value={form.data.note}
                        onChange={(e) => form.setData("note", e.target.value)}
                        placeholder="Note (optional)"
                    />
                </div>
                <Button type="submit" disabled={form.processing} className="gap-1 sm:self-stretch">
                    <Plus className="size-4" /> Add
                </Button>
                <FormErrors errors={form.errors} />
            </form>

            <LedgerList
                rows={payments.map((p) => ({
                    id: p.id,
                    primary: p.method || "Payment",
                    secondary: [p.paid_at, p.note].filter(Boolean).join(" · "),
                    amount: p.amount,
                }))}
                emptyIcon={Banknote}
                empty="Nothing paid yet."
                onRemove={remove}
                tone="in"
            />
        </Panel>
    );
}

function Panel({
    title,
    subtitle,
    icon: Icon,
    total,
    tone,
    children,
}: {
    title: string;
    subtitle: string;
    icon: typeof Receipt;
    total: number;
    tone: "in" | "out";
    children: React.ReactNode;
}) {
    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-start justify-between gap-3 border-b p-3">
                <div>
                    <h2 className="flex items-center gap-2 font-medium">
                        <Icon className="size-4 text-muted-foreground" />
                        {title}
                    </h2>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
                <div
                    className={cn(
                        "text-lg font-semibold tabular-nums",
                        tone === "in"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-red-700 dark:text-red-400"
                    )}
                >
                    {numberFormat(total)}
                </div>
            </div>
            {children}
        </div>
    );
}

function LedgerList({
    rows,
    empty,
    emptyIcon: EmptyIcon,
    onRemove,
    tone,
}: {
    rows: { id: number; primary: string; secondary: string; amount: number }[];
    empty: string;
    emptyIcon: typeof Receipt;
    onRemove: (id: number) => void;
    tone: "in" | "out";
}) {
    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 p-8 text-sm text-muted-foreground">
                <EmptyIcon className="size-5 opacity-50" />
                {empty}
            </div>
        );
    }

    return (
        <ul className="max-h-[320px] divide-y overflow-y-auto">
            {rows.map((row) => (
                <li key={row.id} className="group flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{row.primary}</div>
                        {row.secondary && (
                            <div className="truncate text-xs text-muted-foreground">
                                {row.secondary}
                            </div>
                        )}
                    </div>
                    <div
                        className={cn(
                            "tabular-nums",
                            tone === "in"
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-red-700 dark:text-red-400"
                        )}
                    >
                        {tone === "out" ? "−" : "+"}
                        {numberFormat(row.amount)}
                    </div>
                    <button
                        type="button"
                        onClick={() => onRemove(row.id)}
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus:opacity-100 group-hover:opacity-100"
                        aria-label="Remove"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </li>
            ))}
        </ul>
    );
}

function FormErrors({ errors }: { errors: Record<string, string> }) {
    const messages = Object.values(errors);
    if (messages.length === 0) return null;

    return (
        <p className="text-sm text-destructive sm:col-span-2">{messages[0]}</p>
    );
}
