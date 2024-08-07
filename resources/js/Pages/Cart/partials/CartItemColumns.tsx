import { numberFormat } from "@/lib/utils";
import { DeleteIcon } from "@/Components/icons/DeleteIcon";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CartItem } from "@/types";
import { ColumnDef } from "@tanstack/react-table";

export const cartItemColumns: ColumnDef<CartItem>[] = [
    {
        accessorKey: "product",
        header: "PRODUCT",
        cell: ({ row }) => {
            return row.original.product.name;
        },
    },
    {
        accessorKey: "price",
        header: () => <div className="text-right">PRICE</div>,
        cell: ({ row }) => {
            const price = parseFloat(row.getValue("price"));
            const formatted = numberFormat(price);

            return <div className="text-right font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: "quantity",
        header: () => <div className="text-center">Qty</div>,
        cell: ({ row }) => {
            return (
                <div className="flex justify-center items-center">
                    <Input
                        type="number"
                        defaultValue={row.original.quantity}
                        className="max-w-20"
                        onBlur={(e) => {
                            router.patch(
                                route("cart.update", row.original.id),
                                {
                                    quantity:
                                        e.target.value == ""
                                            ? 0
                                            : e.target.value,
                                },
                                {
                                    onSuccess: () => {
                                        toast.success("Cart item updated");
                                    },
                                    onError: (errors) => {
                                        toast.error(errors.quantity);
                                        e.target.value =
                                            row.original.quantity.toString();
                                    },
                                    preserveScroll: true,
                                }
                            );
                        }}
                    />
                </div>
            );
        },
    },
    {
        accessorKey: "total",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => {
            const formatted = numberFormat(
                row.original.price * row.original.quantity
            );

            return <div className="text-right font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: "cancel",
        header: () => <div className="text-center"></div>,
        cell: ({ row }) => {
            return (
                <span
                    onClick={() => {
                        router.delete(route("cart.remove", row.original.id), {
                            onSuccess: () =>
                                toast.success("Deleted successfully."),
                            preserveScroll: true,
                        });
                    }}
                    className="text-xl text-red-500 cursor-pointer active:opacity-50"
                >
                    <DeleteIcon />
                </span>
            );
        },
    },
];
