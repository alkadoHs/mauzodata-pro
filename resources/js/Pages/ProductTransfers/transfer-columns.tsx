import { ColumnDef } from "@tanstack/react-table";
import { ProductTransfer } from "./Index";
import { Product } from "@/lib/schemas";
import { dateFormatFilter, numberFormat } from "@/lib/utils";
import { Link, router } from "@inertiajs/react";
import { ShoppingBag, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import EditTransferCartItem from "./actions/edit-transfer-cart-item";

export type ProductTransferItem = {
    id: number;
    stockTransfer: ProductTransfer;
    product: Product;
    stock: number;
    previous_stock: number;
    created_at: string;
};

export const productTransferColumns: ColumnDef<ProductTransfer>[] = [
    {
        accessorKey: "id",
        header: "S/N",
        cell: ({ row }) => <div className="font-medium">{row.index + 1}</div>,
    },
    {
        accessorKey: "branch.name",
        header: "Branch",
        cell: ({ row }) => (
            <div className="font-medium">{row.original.branch?.name}</div>
        ),
    },
    {
        accessorKey: "user.name",
        header: "User",
        cell: ({ row }) => (
            <div className="font-medium">{row.original.user?.name}</div>
        ),
    },
    {
        accessorKey: "product_transfers_count",
        header: "Products",
        cell: ({ row }) => (
            <div className="font-medium">
                {row.original.product_transfer_items_count}
            </div>
        ),
    },
    {
        accessorKey: "created_at",
        header: "DATE",
        cell: ({ row }) => (
            <div className="font-medium">
                {dateFormatFilter(row.original.created_at)}
            </div>
        ),
    },
    {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
            <div className="flex gap-2">
                <Link
                    href={route("product-transfers.show", row.original.id)}
                    className="text-blue-500 hover:underline"
                >
                    View
                </Link>
            </div>
        ),
    }
];

export const productsColumns: ColumnDef<Product>[] = [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue("name")}</div>
        ),
    },
    {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
            <div className="font-medium">
                {numberFormat(row.original.sale_price)}
            </div>
        ),
    },
    {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => (
            <div className="font-medium">
                {numberFormat(row.original.stock)}
            </div>
        ),
    },
    {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => {
            const product = row.original;
            return (
                <div className="flex gap-2">
                    <Button
                        size={"sm"}
                        disabled={product.stock == 0}
                        onClick={() =>
                            router.post(
                                route("product-transfers.cart", product.id),
                                {},
                                {
                                    onSuccess: () =>
                                        toast.success(
                                            "Added to transfer cart."
                                        ),
                                }
                            )
                        }
                    >
                        <ShoppingBag className="size-5" />
                    </Button>
                </div>
            );
        },
    },
];

export const productTransferItemsColumns: ColumnDef<ProductTransferItem>[] = [
    {
        accessorKey: "id",
        header: "#",
        cell: ({ row }) => <div className="font-medium">{row.index + 1}</div>,
    },
    {
        accessorKey: "product.name",
        header: "Name",
        cell: ({ row }) => (
            <div className="font-medium">{row.original.product?.name}</div>
        ),
    },
    {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => (
            <div className="font-medium">
                <EditTransferCartItem transferCartItem={row.original} />
            </div>
        ),
    },
    {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => {
            const transferCartItem = row.original;
            return (
                <Button
                    size={"sm"}
                    variant={"destructive"}
                    onClick={() => {
                        if (
                            confirm(
                                "Are you sure you want to remove this item from the transfer cart?"
                            )
                        ) {
                            router.delete(
                                route(
                                    "product-transfers.cart.destroy",
                                    transferCartItem.id
                                ),
                                {
                                    onSuccess: () =>
                                        toast.success(
                                            "Removed from transfer cart."
                                        ),
                                }
                            );
                        }
                    }}
                >
                    <Trash className="size-4" />
                </Button>
            );
        },
    },
];
