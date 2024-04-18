import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import React, { ChangeEvent } from "react";
import { useDebouncedCallback } from "use-debounce";
import CreateProduct from "./Actions/CreateProduct";
import { Input } from "@/components/ui/input";
import { PaginatedProduct } from "@/lib/schemas";
import { DataTable } from "@/components/DataTable";
import { productColumns } from "./partials/productColumns";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    ArrowRight,
    ChevronFirstIcon,
    ChevronLastIcon,
    FilterIcon,
} from "lucide-react";

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

    const onSearchChange = useDebouncedCallback(
        (value?: ChangeEvent<HTMLInputElement>) => {
            if (value && value?.target.value.length > 1) {
                router.visit(route("products.index"), {
                    data: { search: value.target.value },
                    only: ["products"],
                    preserveScroll: true,
                    preserveState: true,
                });
            }
        },
        1000
    );

    return (
        <Authenticated user={auth.user}>
            <Head title="Products" />

            <section>
                <div className="flex flex-col gap-4"></div>

                <div className="lg:px-4 mx-auto pb-10 pt-0 whitespace-nowrap">
                    <div className="flex py-3 justify-between items-center border-x border-t px-3 rounded-t-md dark:border-slate-800">
                        <div className="text-default-400 text-lg font-semibold">
                            Products
                            <span className="text-green-600">
                                ({products.total})
                            </span>{" "}
                        </div>
                        <div className="w-full flex gap-3 items-center justify-end">
                            <Input
                                className="w-full sm:max-w-[44%]"
                                placeholder="Search by name..."
                                onChange={onSearchChange}
                            />

                            <CreateProduct />
                        </div>
                    </div>
                    <DataTable columns={productColumns} data={products.data} />

                    <div className="flex items-center gap-3 justify-center my-3">
                        <Link
                            href={products.first_page_url}
                            disabled={!products.first_page_url}
                            preserveScroll
                        >
                            <Button
                                variant={"outline"}
                                size={"sm"}
                                disabled={!products.first_page_url}
                            >
                                <ChevronFirstIcon className="size-5 text-muted-foreground mr-2" />
                            </Button>
                        </Link>
                        <Link
                            href={products.prev_page_url}
                            disabled={!products.prev_page_url}
                            preserveScroll
                        >
                            <Button variant={"outline"} size={"sm"}>
                                <ArrowLeft className="size-5 text-muted-foreground mr-2" />
                                Prev
                            </Button>
                        </Link>
                        <span>
                            page - <b>{products.current_page}</b>
                        </span>
                        <Link
                            href={products.next_page_url}
                            disabled={!products.next_page_url}
                            preserveScroll
                        >
                            <Button variant={"outline"} size={"sm"}>
                                Next
                                <ArrowRight className="size-5 text-muted-foreground mr-l" />
                            </Button>
                        </Link>
                        <Link
                            href={products.last_page_url}
                            disabled={!products.last_page_url}
                            preserveScroll
                        >
                            <Button
                                variant={"outline"}
                                size={"sm"}
                                disabled={!products.last_page_url}
                            >
                                <ChevronLastIcon className="size-5 text-muted-foreground mr-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </Authenticated>
    );
}
