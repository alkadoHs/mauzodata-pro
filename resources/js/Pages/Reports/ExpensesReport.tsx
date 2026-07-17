import { PageProps } from "@/types";
import { numberFormat } from "@/lib/utils";
import { Column, ReportView } from "./partials/ReportView";

type Row = {
    id: number;
    date: string;
    branch: string | null;
    user: string | null;
    item: string;
    cost: number;
};

const columns: Column<Row>[] = [
    { key: "date", label: "Date", className: "whitespace-nowrap" },
    { key: "branch", label: "Branch" },
    { key: "user", label: "Spent by" },
    { key: "item", label: "Item" },
    { key: "cost", label: "Cost", numeric: true },
];

export default function ExpensesReport({
    rows,
    totals,
    filters,
    sellers,
    branchLabel,
}: PageProps<{
    rows: Row[];
    totals: { cost: number; count: number };
    filters: { from_date?: string; to_date?: string; user_id?: number | string };
    sellers: { id: number; name: string }[];
    branchLabel: string;
}>) {
    return (
        <ReportView
            title="Expenses Report"
            description="Every expense line, with who spent it"
            rows={rows}
            columns={columns}
            totalsRow={{ cost: numberFormat(totals.cost) }}
            filters={filters}
            sellers={sellers}
            branchLabel={branchLabel}
            sellerLabel="Spent by"
            indexRoute="reports.expensesReport"
            excelRoute="reports.expensesReport.excel"
            pdfRoute="reports.expensesReport.pdf"
        />
    );
}
