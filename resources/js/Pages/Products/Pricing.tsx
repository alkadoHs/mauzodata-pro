import { PageProps } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import { ChangeEvent } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";
import { PaginatedProduct } from "@/lib/schemas";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    ArrowRight,
    ChevronFirstIcon,
    ChevronLastIcon,
} from "lucide-react";
import { pricingColumns } from "./partials/PricingColumns";
import Authenticated from "@/Layouts/AuthenticatedLayout";

export default function Pricing({
    auth,
    products,
}: PageProps<{ products: PaginatedProduct }>) {
    const onSearchChange = useDebouncedCallback(
        (value?: ChangeEvent<HTMLInputElement>) => {
            if (value && value?.target.value) {
                router.visit(route("cart.pricing"), {
                    data: { search: value.target.value },
                    only: ["products"],
                    preserveScroll: true,
                    preserveState: true,
                });
            } else {
                router.visit(route("cart.pricing"));
            }
        },
        1000
    );

    return (
        <Authenticated user={auth.user}>
            <Head title="Products" />

            <section className="">
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight pb-2">
                    Products
                </h4>
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between gap-3 items-end">
                        <Input
                            className="w-full sm:max-w-[44%]"
                            type="search"
                            placeholder="Search by name..."
                            onChange={onSearchChange}
                        />

                        {/* <CreateProduct /> */}
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

                <div className=" mx-auto py-5">
                    <DataTable columns={pricingColumns} data={products.data} />

                    <div className="flex items-center gap-3 justify-center my-3">
                        <Link
                            href={products.first_page_url}
                            disabled={!products.first_page_url}
                            as="button"
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
                            as="button"
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
                            as="button"
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
                            as="button"
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
