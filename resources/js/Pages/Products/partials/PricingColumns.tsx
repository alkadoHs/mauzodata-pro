import { Product } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export const pricingColumns: ColumnDef<Product>[] = [
    {
        accessorKey: "name",
        header: "NAME",
        cell: ({ row }) => {

            return `${row.original.name} / ${row.original.unit}`;
        },
    },

    {
        accessorKey: "sale_price",
        header: () => <div className="text-right">S.PRICE</div>,
        cell: ({ row }) => {
            const sale_price = parseFloat(row.getValue("sale_price"));
            const formatted = numberFormat(sale_price);

            return <div className="text-right font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: "stock",
        header: () => <div className="text-right">STOCK</div>,
        cell: ({ row }) => {
            const stock = parseFloat(row.getValue("stock"));
            const formatted = numberFormat(stock);

            if (row.original.stock < row.original.stock_alert) {
                return (
                    <div className="text-right font-medium text-amber-800 bg-amber-100 px-3 py-1 rounded-3xl w-fit float-end">
                        <span className="">{formatted}</span>
                    </div>
                );
            } else if (row.original.stock <= 0) {
                return (
                    <div className="text-right font-medium text-red-600">
                        {formatted}
                    </div>
                );
            }

            return <div className="text-right font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: "whole_sale",
        header: () => <div className="text-right">W.S.Stock</div>,
        cell: ({ row }) => {
            const whole_sale = parseFloat(row.getValue("whole_sale"));
            const formatted = numberFormat(whole_sale);

            return <div className="text-right font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: "whole_price",
        header: () => <div className="text-right">W.PRICE</div>,
        cell: ({ row }) => {
            const whole_price = parseFloat(row.getValue("whole_price"));
            const formatted = numberFormat(whole_price);

            return <div className="text-right font-medium">{formatted}</div>;
        },
    },
];
