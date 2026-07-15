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

export default function SalesReport(props: PageProps<Props>) {
    return (
        <SalesReportView
            {...props}
            title="Sales Report"
            indexRoute="reports.salesReport"
            excelRoute="reports.salesReport.excel"
            pdfRoute="reports.salesReport.pdf"
        />
    );
}
