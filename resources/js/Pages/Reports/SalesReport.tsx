import { PageProps } from "@/types";
import { useState } from "react";
import { OrderItemsDialog } from "./partials/OrderItemsDialog";
import SalesReportView, {
    CollectionRow,
    ExpenseRow,
    ReportRow,
    ReportSummary,
    ReportTotals,
} from "./partials/SalesReportView";

type Props = {
    rows: ReportRow[];
    totals: ReportTotals;
    collections: CollectionRow[];
    expenses: ExpenseRow[];
    summary: ReportSummary;
    filters: { from_date?: string; to_date?: string; user_id?: string | number };
    sellers: { id: number; name: string }[];
    branchLabel: string;
};

export default function SalesReport(props: PageProps<Props>) {
    // Which sale's line items are open in the dialog — a click on a report
    // row is what a client follows up a discount total with: which products
    // did it actually come from?
    const [openFor, setOpenFor] = useState<ReportRow | null>(null);

    return (
        <>
            <SalesReportView
                {...props}
                title="Sales Report"
                indexRoute="reports.salesReport"
                excelRoute="reports.salesReport.excel"
                pdfRoute="reports.salesReport.pdf"
                onRowClick={setOpenFor}
            />

            <OrderItemsDialog row={openFor} onClose={() => setOpenFor(null)} />
        </>
    );
}
