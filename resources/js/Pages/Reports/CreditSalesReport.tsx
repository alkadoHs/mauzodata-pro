import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn, numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import axios from "axios";
import { FileDown, HandCoins, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SalesReportView, {
    ReportRow,
    ReportTotals,
} from "./partials/SalesReportView";

/**
 * Credit sales only — who owes what. No collections, expenses or net-sales
 * figures: those belong to the sales report, where the day's cash is counted.
 */
type Props = {
    rows: ReportRow[];
    totals: ReportTotals;
    filters: {
        from_date?: string;
        to_date?: string;
        user_id?: string | number;
        search?: string;
    };
    sellers: { id: number; name: string }[];
    branchLabel: string;
};

type Payment = {
    id: number;
    date: string | null;
    amount: number;
    received_by: string | null;
    balance_after: number;
};

type History = {
    order: {
        id: number;
        invoice: string | null;
        date: string | null;
        customer: string;
        customer_id: number | null;
        contact: string | null;
        seller: string | null;
        status: string;
    };
    billed: number;
    paid: number;
    balance: number;
    payments: Payment[];
};

export default function CreditSalesReport(props: PageProps<Props>) {
    const [openFor, setOpenFor] = useState<ReportRow | null>(null);

    return (
        <>
            <SalesReportView
                {...props}
                title="Credit Sales Report"
                indexRoute="reports.creditReport"
                excelRoute="reports.creditReport.excel"
                pdfRoute="reports.creditReport.pdf"
                onRowClick={setOpenFor}
            />

            <PaymentHistoryDialog
                row={openFor}
                onClose={() => setOpenFor(null)}
            />
        </>
    );
}

/**
 * A credit sale's payments, loaded when the dialog opens rather than shipped
 * with every row of the report.
 */
function PaymentHistoryDialog({
    row,
    onClose,
}: {
    row: ReportRow | null;
    onClose: () => void;
}) {
    const [history, setHistory] = useState<History | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!row) return;

        setHistory(null);
        setLoading(true);

        axios
            .get(route("reports.creditReport.payments", row.id))
            .then((r) => setHistory(r.data))
            .catch(() => toast.error("Could not load the payment history."))
            .finally(() => setLoading(false));
    }, [row?.id]);

    return (
        <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {history?.order.customer ?? row?.customer ?? "Credit sale"}
                    </DialogTitle>
                    <DialogDescription>
                        {history
                            ? `Receipt ${history.order.invoice ?? history.order.id} · ${history.order.date}${history.order.seller ? ` · sold by ${history.order.seller}` : ""}`
                            : "Loading payment history…"}
                        {history?.order.contact ? ` · ${history.order.contact}` : ""}
                    </DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
                    </div>
                )}

                {history && (
                    <>
                        <div className="grid grid-cols-3 gap-3">
                            <Figure label="Sale value" value={history.billed} />
                            <Figure label="Paid" value={history.paid} tone="in" />
                            <Figure
                                label="Still owed"
                                value={history.balance}
                                tone={history.balance > 0 ? "out" : "in"}
                            />
                        </div>

                        <div className="max-h-[320px] overflow-y-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-muted/60">
                                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="px-3 py-2 font-medium">When</th>
                                        <th className="px-3 py-2 font-medium">Received by</th>
                                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                                        <th className="px-3 py-2 text-right font-medium">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.payments.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-3 py-8 text-center text-muted-foreground"
                                            >
                                                <HandCoins className="mx-auto mb-2 size-5 opacity-50" />
                                                Nothing has been paid on this sale yet.
                                            </td>
                                        </tr>
                                    )}
                                    {history.payments.map((p) => (
                                        <tr key={p.id} className="border-t">
                                            <td className="whitespace-nowrap px-3 py-2">
                                                {p.date}
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground">
                                                {p.received_by ?? "—"}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                                                {numberFormat(p.amount)}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {numberFormat(p.balance_after)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                                The statement covers every credit sale this
                                customer has, not just this one.
                            </p>
                            {history.order.customer_id ? (
                                <a
                                    href={route(
                                        "reports.creditReport.statement",
                                        history.order.customer_id
                                    )}
                                >
                                    <Button className="gap-2">
                                        <FileDown className="size-4" />
                                        Download statement
                                    </Button>
                                </a>
                            ) : (
                                <Button disabled className="gap-2">
                                    <FileDown className="size-4" />
                                    No customer on this sale
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function Figure({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone?: "in" | "out";
}) {
    return (
        <div className="rounded-lg border bg-card p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div
                className={cn(
                    "text-lg font-semibold tabular-nums",
                    tone === "in" && "text-emerald-700 dark:text-emerald-400",
                    tone === "out" && "text-red-700 dark:text-red-400"
                )}
            >
                {numberFormat(value)}
            </div>
        </div>
    );
}
