import { PageProps } from "@/types";
import SalesReportView, {
    ReportRow,
    ReportTotals,
} from "./partials/SalesReportView";

type Props = {
    rows: ReportRow[];
    totals: ReportTotals;
    filters: { from_date?: string; to_date?: string; user_id?: string | number };
    sellers: { id: number; name: string }[];
    branchLabel: string;
};

export default function CreditSalesReport(props: PageProps<Props>) {
    return (
        <SalesReportView
            {...props}
            title="Credit Sales Report"
            indexRoute="reports.creditReport"
            excelRoute="reports.creditReport.excel"
            pdfRoute="reports.creditReport.pdf"
        />
    );
}
