import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    ArrowRight,
    FileSpreadsheet,
    FileText,
    SearchIcon,
} from "lucide-react";
import { FormEventHandler, ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn, numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";

const ALL_SELLERS = "all";
const PER_PAGE = 50;
/** Keep in step with BuildsSalesReports::PDF_MAX_ROWS. */
const PDF_MAX_ROWS = 750;

export type Column<T> = {
    key: keyof T & string;
    label: string;
    /** Right-align + tabular numerals; formatted with numberFormat by default. */
    numeric?: boolean;
    /** Custom cell renderer. */
    render?: (row: T) => ReactNode;
    className?: string;
};

type Props<T> = {
    title: string;
    description: string;
    rows: T[];
    columns: Column<T>[];
    /** Cells for the footer, keyed by column key. */
    totalsRow?: Partial<Record<string, ReactNode>>;
    totalsLabel?: string;
    filters: { from_date?: string; to_date?: string; user_id?: number | string };
    sellers: { id: number; name: string }[];
    branchLabel: string;
    indexRoute: string;
    excelRoute: string;
    pdfRoute: string;
    /** Label for the seller filter — "Seller" for sales, "Spent by" for expenses. */
    sellerLabel?: string;
};

/**
 * Shared shell for the exportable reports (filters + export links + table +
 * client-side pagination), so each report only declares its columns.
 */
export function ReportView<T extends { id: number | string }>({
    title,
    description,
    rows,
    columns,
    totalsRow,
    totalsLabel = "Total",
    filters,
    sellers,
    branchLabel,
    indexRoute,
    excelRoute,
    pdfRoute,
    sellerLabel = "Seller",
}: Props<T>) {
    const { auth } = usePage<PageProps>().props;

    const { data, setData, processing } = useForm({
        from_date: filters.from_date || "",
        to_date: filters.to_date || "",
        user_id: filters.user_id ? String(filters.user_id) : ALL_SELLERS,
    });

    // Never send the "all" sentinel or empty strings — they fail the backend's
    // integer/date validation and silently drop the whole filter request.
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

    const pdfTooBig = rows.length > PDF_MAX_ROWS;

    const [page, setPage] = useState(1);
    useEffect(() => setPage(1), [rows]);
    const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    const start = (page - 1) * PER_PAGE;
    const pageRows = rows.slice(start, start + PER_PAGE);

    return (
        <Authenticated user={auth.user}>
            <Head title={title} />

            <section className="space-y-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                        <p className="text-sm text-muted-foreground">
                            {description} · {branchLabel}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href={route(excelRoute, cleanParams())}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <FileSpreadsheet className="size-4 text-emerald-600" />
                                Excel
                            </Button>
                        </a>
                        {/* dompdf can't render huge documents; Excel has no limit. */}
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
                </header>

                <form
                    onSubmit={submit}
                    className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    <div className="space-y-1.5">
                        <Label htmlFor="from_date">From</Label>
                        <Input
                            id="from_date"
                            type="date"
                            value={data.from_date}
                            onChange={(e) => setData("from_date", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="to_date">To</Label>
                        <Input
                            id="to_date"
                            type="date"
                            value={data.to_date}
                            onChange={(e) => setData("to_date", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="user_id">{sellerLabel}</Label>
                        <Select
                            value={data.user_id}
                            onValueChange={(v) => setData("user_id", v)}
                        >
                            <SelectTrigger id="user_id">
                                <SelectValue placeholder="Everyone" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_SELLERS}>Everyone</SelectItem>
                                {sellers.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button type="submit" className="w-full gap-2" disabled={processing}>
                            <SearchIcon className="size-4" /> Apply
                        </Button>
                    </div>
                </form>

                <div className="rounded-xl border border-border bg-card">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    {columns.map((c) => (
                                        <TableHead
                                            key={c.key}
                                            className={cn(c.numeric && "text-right", c.className)}
                                        >
                                            {c.label}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length + 1}
                                            className="h-28 text-center text-muted-foreground"
                                        >
                                            No records for this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pageRows.map((row, i) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="tabular-nums text-muted-foreground">
                                                {start + i + 1}
                                            </TableCell>
                                            {columns.map((c) => (
                                                <TableCell
                                                    key={c.key}
                                                    className={cn(
                                                        c.numeric && "text-right tabular-nums",
                                                        c.className
                                                    )}
                                                >
                                                    {c.render
                                                        ? c.render(row)
                                                        : c.numeric
                                                          ? numberFormat(Number(row[c.key]))
                                                          : String(row[c.key] ?? "—")}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                            {totalsRow && rows.length > 0 && (
                                <TableFooter>
                                    <TableRow>
                                        <TableCell />
                                        {columns.map((c, i) => (
                                            <TableCell
                                                key={c.key}
                                                className={cn(
                                                    "font-semibold",
                                                    c.numeric && "text-right tabular-nums"
                                                )}
                                            >
                                                {totalsRow[c.key] ??
                                                    (i === 0 ? `${totalsLabel} (${rows.length})` : "")}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                    </div>
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
                            {rows.length} · page <b>{page}</b> / {pageCount}
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
            </section>
        </Authenticated>
    );
}
