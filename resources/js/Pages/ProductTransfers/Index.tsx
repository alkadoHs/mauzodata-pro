import { DataTable } from "@/components/DataTable";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Branch, Product } from "@/lib/schemas";
import { PageProps } from "@/types";
import { User } from "@/types";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    productsColumns,
    ProductTransferItem,
    productTransferItemsColumns,
} from "./transfer-columns";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import { ChangeEvent, FormEventHandler, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface ProductTransfer {
    id: number;
    branch: Branch;
    user: User;
    product_transfer_items: ProductTransferItem[];
    product_transfer_items_count: number;
    created_at: string;
}

const ProductTransferPage = ({
    auth,
    branches,
    products,
    productTransferItems,
}: PageProps<{
    branches: Branch[];
    products: Product[];
    productTransferItems: ProductTransferItem[];
}>) => {
    const { data, setData, processing, errors, post, reset } = useForm({
        branch_id: "",
    });

    const handleSubmit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route("product-transfers.store"), {
            onSuccess: () => {
                reset();
                toast.success("Product transfer created successfully");
            },
        });
    };

    const onSearchChange = useDebouncedCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            router.get(
                route("product-transfers.index"),
                { search: event.target.value },
                { preserveState: true, replace: true }
            );
        },
        1000
    );

    return (
        <Authenticated user={auth.user}>
            <Head title="Product Transfers" />

            <section className="">
                <div className="grid gap-4 grid-cols-2">
                    <div className="grid gap-2">
                        <h1 className="text-2xl font-medium">Products</h1>
                        <Input
                            type="search"
                            name="search"
                            placeholder="Search products..."
                            onChange={onSearchChange}
                        />
                        <DataTable columns={productsColumns} data={products} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-medium">Transfer Cart</h1>
                        <DataTable
                            columns={productTransferItemsColumns}
                            data={productTransferItems}
                        />

                        <form onSubmit={handleSubmit} className="w-full">
                            <div>
                                <Label htmlFor="branch">To Branch</Label>
                                <Select
                                    value={data.branch_id}
                                    onValueChange={(value) =>
                                        setData("branch_id", value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((branch) => (
                                            <SelectItem
                                                key={branch.id}
                                                value={branch.id.toString()}
                                            >
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.branch_id && (
                                    <p className="text-red-500 text-sm">
                                        {errors.branch_id}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-center mt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <span className="loading loading-spinner">
                                            Processing...
                                        </span>
                                    ) : (
                                        "Transfer products"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </Authenticated>
    );
};

export default ProductTransferPage;
