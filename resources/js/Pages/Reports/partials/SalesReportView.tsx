import { Heading4 } from "@/components/Typography/Heading4";
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
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { numberFormat, cn } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import {
    ArrowLeft,
    ArrowRight,
    FileSpreadsheet,
    FileText,
    SearchIcon,
} from "lucide-react";
import { FormEventHandler, useEffect, useState } from "react";

export interface ReportRow {
    id: number;
    date: string | null;
    branch: string | null;
    customer: string | null;
    seller: string | null;
    status: string;
    total: number;
    paid: number;
    due: number;
    gp: number;
}

export interface ReportTotals {
    total: number;
    paid: number;
    due: number;
    gp: number;
    count: number;
}

/** A repayment banked in this period against a credit sale made before it. */
export interface CollectionRow {
    id: number;
    date: string | null;
    branch: string | null;
    customer: string | null;
    received_by: string | null;
    invoice: string | null;
    sale_date: string | null;
    amount: number;
}

export interface ReportSummary {
    sales: number;
    collected_on_sales: number;
    collected_on_previous: number;
    collected_total: number;
    outstanding: number;
    gp: number;
    collections_count: number;
}

interface Seller {
    id: number;
    name: string;
}

type Props = {
    title: string;
    indexRoute: string;
    excelRoute: string;
    pdfRoute: string;
    rows: ReportRow[];
    totals: ReportTotals;
    collections: CollectionRow[];
    summary: ReportSummary;
    filters: { from_date?: string; to_date?: string; user_id?: string | number };
    sellers: Seller[];
    branchLabel: string;
};

const ALL_SELLERS = "all";

const statusClass = (status: string) => {
    switch (status) {
        case "paid":
            return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
        case "onprogresss":
            return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
        case "credit":
            return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300";
        default:
            return "bg-muted text-muted-foreground";
    }
};

const statusLabel = (status: string) =>
    status === "onprogresss" ? "Outstanding" : status;

export default function SalesReportView({
    auth,
    title,
    indexRoute,
    excelRoute,
    pdfRoute,
    rows,
    totals,
    collections = [],
    summary,
    filters,
    sellers,
    branchLabel,
}: PageProps<Props>) {
    const { data, setData, processing } = useForm({
        from_date: filters.from_date || "",
        to_date: filters.to_date || "",
        user_id: filters.user_id ? String(filters.user_id) : ALL_SELLERS,
    });

    // Only send real values — never the "all" sentinel or empty strings, which
    // would fail the backend's `user_id => integer` validation and silently
    // reject the whole filter request.
    const cleanParams = () => ({
        from_date: data.from_date || undefined,
        to_date: data.to_date || undefined,
        user_id: data.user_id !== ALL_SELLERS ? data.user_id : undefined,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(route(indexRoute), cleanParams(), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // dompdf can't render huge documents (~0.4MB/row); Excel has no limit.
    // Keep in step with BuildsSalesReports::PDF_MAX_ROWS — the collections table
    // prints in the same document, so it counts too.
    const pdfTooBig = rows.length + collections.length > 750;

    // Client-side pagination (50 per page); totals below are always the full set.
    const PER_PAGE = 50;
    const [page, setPage] = useState(1);
    useEffect(() => setPage(1), [rows]);
    const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    const start = (page - 1) * PER_PAGE;
    const pageRows = rows.slice(start, start + PER_PAGE);

    return (
        <Authenticated user={auth.user}>
            <Head title={title} />

            <section className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <Heading4>{title}</Heading4>
                        <p className="text-sm text-muted-foreground">
                            {branchLabel}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href={route(excelRoute, cleanParams())}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <FileSpreadsheet className="size-4 text-emerald-600" />
                                Excel
                            </Button>
                        </a>
                        {pdfTooBig ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                disabled
                                title={`Too many rows (${rows.length}) for a PDF — narrow the dates or use Excel.`}
                            >
                                <FileText className="size-4" />
                                PDF
                            </Button>
                        ) : (
                            <a href={route(pdfRoute, cleanParams())}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <FileText className="size-4 text-red-600" />
                                    PDF
                                </Button>
                            </a>
                        )}
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-end sm:flex-wrap"
                >
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        From
                        <Input
                            type="date"
                            value={data.from_date}
                            onChange={(e) => setData("from_date", e.target.value)}
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        To
                        <Input
                            type="date"
                            value={data.to_date}
                            onChange={(e) => setData("to_date", e.target.value)}
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        Seller
                        <Select
                            value={data.user_id}
                            onValueChange={(v) => setData("user_id", v)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All sellers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_SELLERS}>
                                    All sellers
                                </SelectItem>
                                {sellers.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>
                    <Button type="submit" disabled={processing} className="gap-2">
                        <SearchIcon className="size-4" />
                        Apply
                    </Button>
                </form>

                {summary && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <SummaryCard
                            label="Sales billed"
                            value={summary.sales}
                            hint="Value of sales made in this period"
                        />
                        <SummaryCard
                            label="Collected on these sales"
                            value={summary.collected_on_sales}
                            hint="Cash + down payments received in this period"
                        />
                        <SummaryCard
                            label="Collected on earlier credit"
                            value={summary.collected_on_previous}
                            hint={`${summary.collections_count} repayment(s) on sales made before this period`}
                        />
                        <SummaryCard
                            label="Total money collected"
                            value={summary.collected_total}
                            hint="What the till should hold for this period"
                            accent
                        />
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    <b>Paid</b> is money actually received during the selected
                    period — a repayment made on a later day is reported on that
                    day, not on the sale date. <b>Due</b> is the balance left at
                    the end of the period.
                </p>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Seller</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right">Due</TableHead>
                                <TableHead className="text-right">GP</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
                                        className="py-10 text-center text-muted-foreground"
                                    >
                                        No records for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                            {pageRows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {row.date}
                                    </TableCell>
                                    <TableCell>{row.branch}</TableCell>
                                    <TableCell>{row.customer}</TableCell>
                                    <TableCell>{row.seller}</TableCell>
                                    <TableCell>
                                        <span
                                            className={cn(
                                                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                                                statusClass(row.status)
                                            )}
                                        >
                                            {statusLabel(row.status)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {numberFormat(row.total)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {numberFormat(row.paid)}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            "text-right tabular-nums",
                                            row.due > 0 && "font-semibold text-red-600 dark:text-red-400"
                                        )}
                                    >
                                        {numberFormat(row.due)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {numberFormat(row.gp)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        {rows.length > 0 && (
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={5} className="font-semibold">
                                        Totals ({totals.count} orders)
                                    </TableCell>
                                    <TableCell className="text-right font-semibold tabular-nums">
                                        {numberFormat(totals.total)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold tabular-nums">
                                        {numberFormat(totals.paid)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold tabular-nums">
                                        {numberFormat(totals.due)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold tabular-nums">
                                        {numberFormat(totals.gp)}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </div>

                {rows.length > PER_PAGE && (
                    <div className="flex items-center justify-center gap-3 text-sm">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            <ArrowLeft className="size-4" /> Prev
                        </Button>
                        <span className="text-muted-foreground">
                            {start + 1}–{Math.min(start + PER_PAGE, rows.length)} of{" "}
                            {rows.length} &middot; page <b>{page}</b> / {pageCount}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={page >= pageCount}
                            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        >
                            Next <ArrowRight className="size-4" />
                        </Button>
                    </div>
                )}

                {collections.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div>
                            <Heading4>
                                Credit collections received in this period
                            </Heading4>
                            <p className="text-sm text-muted-foreground">
                                Repayments banked in this period against credit
                                sales made earlier — the sale itself was counted
                                on its own day.
                            </p>
                        </div>

                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Paid on</TableHead>
                                        <TableHead>Branch</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Received by</TableHead>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Sale date</TableHead>
                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {collections.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {c.date}
                                            </TableCell>
                                            <TableCell>{c.branch}</TableCell>
                                            <TableCell>{c.customer}</TableCell>
                                            <TableCell>
                                                {c.received_by}
                                            </TableCell>
                                            <TableCell>{c.invoice}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {c.sale_date}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {numberFormat(c.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="font-semibold"
                                        >
                                            Total collected (
                                            {collections.length} payments)
                                        </TableCell>
                                        <TableCell className="text-right font-semibold tabular-nums">
                                            {numberFormat(
                                                collections.reduce(
                                                    (acc, c) =>
                                                        acc + Number(c.amount),
                                                    0
                                                )
                                            )}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    </div>
                )}
            </section>
        </Authenticated>
    );
}

function SummaryCard({
    label,
    value,
    hint,
    accent = false,
}: {
    label: string;
    value: number;
    hint?: string;
    accent?: boolean;
}) {
    return (
        <div
            className={cn(
                "rounded-lg border bg-card p-3",
                accent && "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10"
            )}
        >
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div
                className={cn(
                    "text-xl font-semibold tabular-nums",
                    accent && "text-emerald-700 dark:text-emerald-400"
                )}
            >
                {numberFormat(value)}
            </div>
            {hint && (
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {hint}
                </div>
            )}
        </div>
    );
}
