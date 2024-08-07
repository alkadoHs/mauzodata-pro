import { Product } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import DeleteProductAction from "../Actions/DeleteProductAction";
import UpdateProductAction from "../Actions/UpdateProductAction";
import ViewProductAction from "../Actions/ViewProductAction";
import { Badge } from "@/components/ui/badge";
import { TrendingDown } from "lucide-react";

export const productColumns: ColumnDef<Product>[] = [
    {
        accessorKey: "name",
        header: "NAME",
        cell: ({ row }) => {
            return `${row.original.name} / ${row.original.unit}`;
        },
    },
    {
        accessorKey: "stock",
        header: () => <div className="text-right">STOCK</div>,
        cell: ({ row }) => {
            const stock = parseFloat(row.getValue("stock"));
            const formatted = numberFormat(stock);

            if (row.original.stock <= 0) {
                return (
                    <div className="flex justify-end">
                        <TrendingDown className="size-4 text-destructive mr-1" />
                        <Badge variant={"destructive"}>{formatted}</Badge>
                    </div>
                );
            } else if (row.original.stock < row.original.stock_alert) {
                return (
                    <div className="flex justify-end">
                        <TrendingDown className="size-4 text-primary mr-1" />
                        <Badge variant={"secondary"}>{formatted}</Badge>
                    </div>
                );
            }

            return <div className="text-right font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: "buy_price",
        header: () => <div className="text-right">B.PRICE</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("buy_price"));
            const formatted = numberFormat(amount);

            return <div className="text-right font-medium">{formatted}</div>;
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
    {
        accessorKey: "Action",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
            return (
                <div className="relative flex items-center justify-center gap-2">
                    <ViewProductAction product={row.original} />
                    <UpdateProductAction product={row.original} />
                    <DeleteProductAction product={row.original} />
                </div>
            );
        },
    },
];
