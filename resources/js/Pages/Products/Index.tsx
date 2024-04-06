import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PaginatedProduct, Product } from "@/lib/schemas";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import {
    Button,
    Chip,
    Input,
    Pagination,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tooltip,
} from "@nextui-org/react";
import React from "react";
import { productColumns } from "./partials/productColumns";
import { numberFormat } from "@/lib/utils";
import { EyeIcon } from "@/Components/icons/EyeIcon";
import { EditIcon } from "@/Components/icons/EditIcon";
import { DeleteIcon } from "@/Components/icons/DeleteIcon";
import { SearchIcon } from "@/Components/icons/SearchIcon";
import { PlusIcon } from "@/Components/icons/PlusIcon";
import { Plus } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import CreateProduct from "./partials/CreateProduct";

export default function ProductIndex({
    auth,
    products,
}: PageProps<{ products: PaginatedProduct }>) {
    const [filterValue, setFilterValue] = React.useState("");

    const pages = React.useMemo(() => {
        return products?.total
            ? Math.ceil(products.total / products.per_page)
            : 0;
    }, [products?.total, products.per_page]);

    const renderCell = React.useCallback(
        (product: Product, columnKey: React.Key) => {
            const cellValue = product[columnKey as keyof Product];

            if (columnKey == "name") {
                return `${cellValue} / ${product.unit}`;
            } else if (columnKey == "stock") {
                if (product.stock < product.stock_alert) {
                    return (
                        <Chip color="warning" size="sm" variant="flat">
                            {numberFormat(cellValue)}
                        </Chip>
                    );
                } else if (product.stock < 1) {
                    return (
                        <Chip color="danger" size="sm" variant="flat">
                            {cellValue}
                        </Chip>
                    );
                } else {
                    return (
                        <Chip color="success" size="sm" variant="flat">
                            {numberFormat(cellValue)}
                        </Chip>
                    );
                }
            } else if (columnKey == "buy_price") {
                return numberFormat(cellValue);
            } else if (columnKey == "sale_price") {
                return numberFormat(cellValue);
            } else if (columnKey == "whole_price") {
                return numberFormat(cellValue);
            } else if (columnKey == "actions") {
                return (
                    <div className="relative flex items-center gap-2">
                        <Tooltip content="Details">
                            <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                                <EyeIcon />
                            </span>
                        </Tooltip>
                        <Tooltip content="Edit product">
                            <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                                <EditIcon />
                            </span>
                        </Tooltip>
                        <Tooltip color="danger" content="Delete product">
                            <span className="text-lg text-danger cursor-pointer active:opacity-50">
                                <DeleteIcon />
                            </span>
                        </Tooltip>
                    </div>
                );
            }

            return cellValue;
        },
        []
    );

    const onSearchChange = useDebouncedCallback((value?: string) => {
        if (value && value?.length > 1) {
            router.visit(route('products.index'), {
                data: { search: value},
                only: ['products'],
                preserveScroll: true,
                preserveState: true
            })
        }
    }, 1000);

    const onClear = React.useCallback(() => {
        router.visit(route('products.index'), {
            preserveScroll: true,
            preserveState: true,
        })
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%]"
                        placeholder="Search by name..."
                        startContent={<SearchIcon />}
                        onClear={() => onClear()}
                        onValueChange={onSearchChange}
                    />

                    <CreateProduct />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-default-400 text-small">
                        Total {products.total} products
                    </span>
                    <label className="flex items-center text-default-400 text-small">
                        Rows per page:
                        <select className="bg-transparent outline-none text-default-400 text-small">
                            <option value="15">15</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </label>
                </div>
            </div>
        );
    }, [onSearchChange, products.data.length]);

    return (
        <Authenticated user={auth.user}>
            <Head title="Products" />

            <section>
                <Table
                    aria-label="Table with products"
                    isStriped
                    selectionMode="single"
                    topContent={topContent}
                    topContentPlacement="outside"
                    isHeaderSticky={true}
                    bottomContent={
                        <div className="flex w-full justify-center">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="secondary"
                                page={products.current_page}
                                total={pages}
                                onChange={(page) => {
                                    router.visit(`/products?page=${page}`, {
                                        preserveScroll: true,
                                        preserveState: true,
                                    });
                                }}
                            />
                        </div>
                    }
                >
                    <TableHeader columns={productColumns}>
                        {(column) => (
                            <TableColumn key={column.key}>
                                {column.label}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody
                        emptyContent={"No products was found."}
                        items={products.data}
                    >
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => (
                                    <TableCell>
                                        {renderCell(item, columnKey)}
                                    </TableCell>
                                )}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </section>
        </Authenticated>
    );
}
