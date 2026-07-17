import { PageProps } from "@/types";
import { cn, numberFormat } from "@/lib/utils";
import { Column, ReportView } from "./partials/ReportView";

type Row = {
    id: number;
    product: string;
    unit: string;
    orders: number;
    qty: number;
    sales: number;
    cost: number;
    gp: number;
};

const columns: Column<Row>[] = [
    { key: "product", label: "Product", className: "font-medium" },
    { key: "unit", label: "Unit", className: "text-muted-foreground" },
    { key: "orders", label: "Orders", numeric: true },
    { key: "qty", label: "Qty sold", numeric: true },
    { key: "sales", label: "Sales", numeric: true },
    { key: "cost", label: "Cost", numeric: true },
    {
        key: "gp",
        label: "GP",
        numeric: true,
        // A negative margin is worth seeing immediately.
        render: (row) => (
            <span className={cn(row.gp < 0 && "font-medium text-destructive")}>
                {numberFormat(row.gp)}
            </span>
        ),
    },
];

export default function ProductSalesReport({
    rows,
    totals,
    filters,
    sellers,
    branchLabel,
}: PageProps<{
    rows: Row[];
    totals: { qty: number; sales: number; cost: number; gp: number; count: number };
    filters: { from_date?: string; to_date?: string; user_id?: number | string };
    sellers: { id: number; name: string }[];
    branchLabel: string;
}>) {
    return (
        <ReportView
            title="Sales by Product"
            description="What sold, and what it earned — best sellers first"
            rows={rows}
            columns={columns}
            totalsLabel="Products"
            totalsRow={{
                qty: numberFormat(totals.qty),
                sales: numberFormat(totals.sales),
                cost: numberFormat(totals.cost),
                gp: numberFormat(totals.gp),
            }}
            filters={filters}
            sellers={sellers}
            branchLabel={branchLabel}
            indexRoute="reports.productSales"
            excelRoute="reports.productSales.excel"
            pdfRoute="reports.productSales.pdf"
        />
    );
}
