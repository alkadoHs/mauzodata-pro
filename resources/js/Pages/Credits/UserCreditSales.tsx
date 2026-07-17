import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
    Table,
} from "@/components/ui/table";
import { CreditSale, Order } from "@/lib/schemas";
import { cn, numberFormat } from "@/lib/utils";
import { PageProps, User } from "@/types";
import { Head, router } from "@inertiajs/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ArrowLeft, ArrowRight, HandCoins, SearchIcon } from "lucide-react";
import AddCreditPayment from "./Actions/AddCreditPayment";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

dayjs.extend(relativeTime);

/** Totals now arrive precomputed from SQL instead of shipping every order line. */
type CreditRow = CreditSale & {
    paid_total: number | null;
    user?: User;
    customer?: { id: number; name: string; contact: string | null } | null;
    order: Order & { billed_total: number | null };
};

type Paginated = {
    data: CreditRow[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    from: number | null;
    to: number | null;
    total: number;
};

const billedOf = (c: CreditRow) => Number(c.order?.billed_total ?? 0);
const paidOf = (c: CreditRow) => Number(c.paid_total ?? 0);
const debtOf = (c: CreditRow) => billedOf(c) - paidOf(c);

const UserCreditSales = ({
    auth,
    creditSales,
    filters,
    scope,
    outstandingTotal,
}: PageProps<{
    creditSales: Paginated;
    filters: { search: string };
    scope: "branch" | "mine";
    outstandingTotal: number;
}>) => {
    const [search, setSearch] = useState(filters?.search ?? "");

    const onSearchChange = useDebouncedCallback((value: string) => {
        router.get(
            route("cart.credits"),
            value ? { search: value } : {},
            { preserveState: true, preserveScroll: true, replace: true }
        );
    }, 400);

    return (
        <Authenticated user={auth.user}>
            <Head title="Credit sales" />

            <section className="space-y-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Credit sales
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {scope === "branch"
                                ? "Unpaid debts across this branch."
                                : "Debts from sales you made."}
                        </p>
                    </div>
                    <div className="relative w-full sm:max-w-xs">
                        <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            type="search"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                onSearchChange(e.target.value);
                            }}
                            placeholder="Search customer…"
                            className="pl-8"
                        />
                    </div>
                </header>

                {/* Headline: what's still owed across everything matching */}
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <span className="text-sm font-medium text-muted-foreground">
                            Total outstanding
                        </span>
                        <p className="mt-1 text-2xl font-semibold tabular-nums text-destructive">
                            {numberFormat(outstandingTotal)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <span className="text-sm font-medium text-muted-foreground">
                            Open credit sales
                        </span>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                            {creditSales.total}
                        </p>
                    </div>
                </div>

                {creditSales.data.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-12 text-center">
                        <HandCoins className="size-7 text-muted-foreground opacity-60" />
                        <p className="font-medium">No open credit sales</p>
                        <p className="text-sm text-muted-foreground">
                            {search
                                ? "No customer matches that search."
                                : "Everything has been paid off."}
                        </p>
                    </div>
                ) : (
                    <Accordion type="multiple" className="space-y-2">
                        {creditSales.data.map((credit) => {
                            const billed = billedOf(credit);
                            const paid = paidOf(credit);
                            const debt = debtOf(credit);
                            const pct = billed > 0 ? Math.min((paid / billed) * 100, 100) : 0;

                            return (
                                // Keyed by id — invoice_number can be null/duplicated.
                                <AccordionItem
                                    key={credit.id}
                                    value={String(credit.id)}
                                    className="rounded-xl border border-border bg-card px-4"
                                >
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex w-full flex-col gap-2 pr-3 text-left sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">
                                                    {credit.customer?.name ?? "Walk-in"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    INV-{String(credit.order?.id).padStart(2, "0")}
                                                    {scope === "branch" && credit.user?.name
                                                        ? ` · ${credit.user.name}`
                                                        : ""}{" "}
                                                    · {dayjs(credit.order?.created_at).fromNow()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {/* Paid-progress: debt at a glance */}
                                                <div className="hidden w-28 sm:block">
                                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-primary"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                                        {Math.round(pct)}% paid
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">
                                                        Debt
                                                    </p>
                                                    <p
                                                        className={cn(
                                                            "font-semibold tabular-nums",
                                                            debt > 0 && "text-destructive"
                                                        )}
                                                    >
                                                        {numberFormat(debt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>

                                    <AccordionContent className="pb-4">
                                        <dl className="mb-4 grid gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm sm:grid-cols-3">
                                            <div className="flex justify-between sm:block">
                                                <dt className="text-muted-foreground">
                                                    Total price
                                                </dt>
                                                <dd className="font-medium tabular-nums">
                                                    {numberFormat(billed)}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between sm:block">
                                                <dt className="text-muted-foreground">
                                                    Amount paid
                                                </dt>
                                                <dd className="font-medium tabular-nums">
                                                    {numberFormat(paid)}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between sm:block">
                                                <dt className="text-muted-foreground">Debt</dt>
                                                <dd className="font-semibold tabular-nums text-destructive">
                                                    {numberFormat(debt)}
                                                </dd>
                                            </div>
                                            {credit.customer?.contact && (
                                                <div className="flex justify-between sm:block">
                                                    <dt className="text-muted-foreground">
                                                        Contact
                                                    </dt>
                                                    <dd>{credit.customer.contact}</dd>
                                                </div>
                                            )}
                                        </dl>

                                        <div className="mb-2 flex items-center justify-between gap-4">
                                            <h3 className="text-sm font-medium">
                                                Payment statement
                                            </h3>
                                            <AddCreditPayment credit={credit} debt={debt} />
                                        </div>

                                        <div className="overflow-x-auto rounded-lg border border-border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-12">#</TableHead>
                                                        <TableHead>Received by</TableHead>
                                                        <TableHead className="text-right">
                                                            Amount
                                                        </TableHead>
                                                        <TableHead>Date</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {credit.credit_sale_payments.length ===
                                                    0 ? (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={4}
                                                                className="h-20 text-center text-muted-foreground"
                                                            >
                                                                No payments yet.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        credit.credit_sale_payments.map(
                                                            (payment, index) => (
                                                                <TableRow key={payment.id}>
                                                                    <TableCell className="tabular-nums text-muted-foreground">
                                                                        {String(
                                                                            index + 1
                                                                        ).padStart(2, "0")}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {payment.user?.name ??
                                                                            "—"}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-medium tabular-nums">
                                                                        {numberFormat(
                                                                            payment.amount
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                                                        {dayjs(
                                                                            payment.created_at
                                                                        ).format(
                                                                            "DD MMM YYYY HH:mm"
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        )
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}

                {creditSales.last_page > 1 && (
                    <div className="flex items-center justify-center gap-3 text-sm">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={!creditSales.prev_page_url}
                            onClick={() =>
                                creditSales.prev_page_url &&
                                router.get(
                                    creditSales.prev_page_url,
                                    {},
                                    { preserveScroll: true }
                                )
                            }
                        >
                            <ArrowLeft className="size-4" /> Prev
                        </Button>
                        <span className="text-muted-foreground">
                            {creditSales.from ?? 0}–{creditSales.to ?? 0} of{" "}
                            {creditSales.total} · page <b>{creditSales.current_page}</b> /{" "}
                            {creditSales.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={!creditSales.next_page_url}
                            onClick={() =>
                                creditSales.next_page_url &&
                                router.get(
                                    creditSales.next_page_url,
                                    {},
                                    { preserveScroll: true }
                                )
                            }
                        >
                            Next <ArrowRight className="size-4" />
                        </Button>
                    </div>
                )}
            </section>
        </Authenticated>
    );
};

export default UserCreditSales;
