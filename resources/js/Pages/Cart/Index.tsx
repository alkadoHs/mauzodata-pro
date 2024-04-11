import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PaginatedProduct, Product } from "@/lib/schemas";
import { Cart, PageProps } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { numberFormat } from "@/lib/utils";
import { DataTable } from "@/components/DataTable";
import { cartItemColumns } from "./partials/CartItemColumns";

import { Input } from "@/components/ui/input";
import { AddProductToTheCart } from "./Add";
import AddCustomer from "./partials/AddCustomer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2Icon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormEventHandler, useState } from "react";
import CartLayout from "@/Layouts/CartLayout";

const CartIndex = ({
    auth,
    cart,
    products,
    total,
}: PageProps<{ cart: Cart; products: Product[]; total: number }>) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        paid: "",
        print_invoice: true,
    });

    const sellProducts: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("orders.complete"), {
            onProgress: () => toast.loading("Processing..."),
            onSuccess: () => {
                reset();
                toast.success("Processed successfully.");
            },
        });
    };

    return (
        <CartLayout user={auth.user}>
            <Head title="Cart" />

            <section className="flex flex-col md:flex-row gap-8 p-4">
                <div className="w-full">
                    <DataTable
                        columns={cartItemColumns}
                        data={cart?.cart_items ? cart.cart_items : []}
                    />
                </div>

                <div className="m min-w-[400px]">
                    <AddProductToTheCart products={products} />
                    <ul className="my-6 space-y-3 divide-y divide-gray-300 dark:divide-gray-700 max-w-sm">
                        <li className="flex justify-between items-center">
                            <p>Total Price</p>
                            <b className="text-success">
                                {numberFormat(total)}
                            </b>
                        </li>
                        <li className="flex justify-between items-center pt-4">
                            <p>Customer </p>
                            <div>
                                {cart?.customer ? (
                                    <b>
                                        {cart.customer.name}{" "}
                                        <button
                                            onClick={() => {
                                                router.delete(
                                                    route(
                                                        "customers.destroy",
                                                        cart.customer.id
                                                    ),
                                                    {
                                                        preserveScroll: true,
                                                        preserveState: true,
                                                        onSuccess: () => {
                                                            toast.success(
                                                                "Deleted successfully!"
                                                            );
                                                        },
                                                    }
                                                );
                                            }}
                                        >
                                            <Trash2Icon className="size-4 ml-3 text-red-500 hover:text-red-300" />
                                        </button>
                                    </b>
                                ) : (
                                    <AddCustomer />
                                )}
                            </div>
                        </li>
                        <li></li>
                    </ul>
                    <form onSubmit={sellProducts}>
                        <ul className="my-6 space-y-3 divide-y divide-gray-300 dark:divide-gray-700 max-w-sm">
                            <li className="flex justify-between items-center pt-4">
                                <p>Print receipt? </p>
                                <Checkbox
                                    checked={data.print_invoice}
                                    onCheckedChange={(checked) =>
                                        setData(
                                            "print_invoice",
                                            checked as boolean
                                        )
                                    }
                                />
                            </li>

                            <li className="flex justify-between items-center pt-4">
                                <p>Paid </p>
                                <Input
                                    type="number"
                                    value={data.paid}
                                    onChange={(e) =>
                                        setData("paid", e.target.value)
                                    }
                                    onBlur={(e) => {
                                        if (
                                            total != Number(data.paid) &&
                                            !cart.customer
                                        ) {
                                            toast.info(
                                                "The amount paid is not equals to the total price, You should add a customer to sell this or if not a credit sale then make sure total price is equal to paid."
                                            );
                                        }
                                    }}
                                    className="max-w-28"
                                    required
                                />
                            </li>
                        </ul>
                        <Button
                            type="submit"
                            disabled={
                                processing ||
                                total <= 0 ||
                                (total != Number(data.paid) && !cart.customer)
                            }
                        >
                            <ShoppingBag className="size-5 mr-2" />
                            Sell product
                        </Button>
                    </form>
                </div>
            </section>
        </CartLayout>
    );
};

export default CartIndex;
