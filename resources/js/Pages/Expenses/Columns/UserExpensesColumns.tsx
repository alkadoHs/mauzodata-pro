import { ExpenseItem } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { History } from "lucide-react";

dayjs.extend(relativeTime);

export const userExpenseColumns: ColumnDef<ExpenseItem>[] = [
    {
        accessorKey: "item",
        header: "ITEM",
    },
    {
        accessorKey: "cost",
        header: () => <div className="">COST</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("cost"));
            const formatted = numberFormat(amount);

            return <div className="font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: "created_at",
        header: () => <div className="">DATE</div>,
        cell: ({ row }) => {
            const formatted = dayjs(row.original.created_at).fromNow();

            return (
                <div className="flex gap-2">
                    <History className="size-4 text-muted-foreground" />
                    {formatted}
                </div>
            );
        },
    },
];
