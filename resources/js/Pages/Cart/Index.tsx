import { Customer, PaymentMethod, Product } from "@/lib/schemas";
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
import { FormEventHandler } from "react";
import { NumericFormat } from "react-number-format";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const CartIndex = ({
    auth,
    cart,
    products,
    paymentMethods,
    total,
}: PageProps<{
    cart: Cart;
    products: Product[];
    paymentMethods: PaymentMethod[];
    total: number;
}>) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        status: "paid",
        paid: "0",
        payment_method_id: "",
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
        <Authenticated user={auth.user}>
            <Head title="Cart" />

            <section className="flex flex-col md:flex-row gap-8 px-3 py-4">
                <div className="w-full">
                    <DataTable
                        columns={cartItemColumns}
                        data={cart?.cart_items ? cart.cart_items : []}
                    />
                </div>

                <div className="w-full">
                    <AddProductToTheCart products={products} />
                    {/* <SearchCustomer customers={customers} /> */}
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
                            {/* <li className="flex justify-between items-center pt-4">
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
                            </li> */}

                            <li className="flex justify-between items-center gap-4 pt-4">
                                <p>Payment Method </p>
                                <Select
                                    value={data.payment_method_id}
                                    onValueChange={(value) =>
                                        setData("payment_method_id", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map(
                                            (paymentMethod, index) => (
                                                <SelectItem
                                                    key={paymentMethod.id}
                                                    value={paymentMethod.id.toString()}
                                                    className="uppercase"
                                                >
                                                    {paymentMethod.name}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            </li>

                            <li className="flex justify-between items-center gap-4 pt-4">
                                <p>Satatus </p>
                                <Select
                                    defaultValue="paid"
                                    value={data.status}
                                    onValueChange={(value) =>
                                        setData("status", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sale type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem key={"paid"} value="paid">
                                            Paid Sale
                                        </SelectItem>
                                        <SelectItem
                                            key={"credit"}
                                            value="credit"
                                        >
                                            Credit Sale
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </li>

                            {data.status == "credit" && (
                                <li className="flex justify-between items-center gap-4 pt-4">
                                    <p>Amount Paid ?</p>
                                    <NumericFormat
                                        value={data.paid}
                                        customInput={Input}
                                        thousandSeparator=","
                                        allowNegative={false}
                                        onChange={(e) =>
                                            setData("paid", e.target.value)
                                        }
                                    />
                                </li>
                            )}
                        </ul>
                        <Button
                            type="submit"
                            disabled={
                                processing ||
                                total <= 0 ||
                                (data.status == "credit" && !cart.customer)
                            }
                        >
                            <ShoppingBag className="size-5 mr-2" />
                            Sell product
                        </Button>
                    </form>
                </div>
            </section>
        </Authenticated>
    );
};

export default CartIndex;
