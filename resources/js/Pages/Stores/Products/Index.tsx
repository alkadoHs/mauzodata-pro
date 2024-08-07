import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginatedStoreProduct } from "@/lib/schemas";
import { PageProps } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    ArrowRight,
    ChevronFirstIcon,
    ChevronLastIcon,
} from "lucide-react";
import React, { ChangeEvent } from "react";
import { useDebouncedCallback } from "use-debounce";
import { storeProductColumns } from "./partials/storeProductColumns";
import CreateStoreProduct from "./Actions/CreateStoreProduct";
import Authenticated from "@/Layouts/AuthenticatedLayout";

const StoreProductIndex = ({
    auth,
    products,
}: PageProps<{ products: PaginatedStoreProduct }>) => {
    const onSearchChange = useDebouncedCallback(
        (value?: ChangeEvent<HTMLInputElement>) => {
            if (value && value?.target.value.length > 1) {
                router.visit(route("stores.products"), {
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
            <Head title="Store Products" />

            <section className="p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between gap-3 items-end">
                        <Input
                            className="w-full sm:max-w-[44%]"
                            placeholder="Search by name..."
                            onChange={onSearchChange}
                        />

                        <CreateStoreProduct />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-default-400 text-small">
                            Total{" "}
                            <span className="text-indigo-600">
                                {products.total}
                            </span>{" "}
                            products
                        </span>
                        <div>Last Page: {products.last_page}</div>
                    </div>
                </div>

                <div className="px-4 mx-auto py-10">
                    <DataTable
                        columns={storeProductColumns}
                        data={products.data}
                    />

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
};

export default StoreProductIndex;
