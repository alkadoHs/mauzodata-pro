import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PaginatedProduct, Product } from "@/lib/schemas";
import { Cart, CartProduct, PageProps } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import { Input, Select, SelectItem } from "@nextui-org/react";
import React, { FormEventHandler } from "react";
import {
    Autocomplete,
    AutocompleteItem,
    Button,
    Tooltip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@nextui-org/react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { numberFormat } from "@/lib/utils";
import { ShoppingCartIcon } from "lucide-react";
import { DeleteIcon } from "@/Components/icons/DeleteIcon";
import AddToCart from "./Add";
import UpdateCartItem from "./UpdateCart";

const CartIndex = ({
    auth,
    cart,
    products,
}: PageProps<{ cart: Cart; products: PaginatedProduct }>) => {
    const { data, setData, patch, reset, processing } = useForm({
        product_id: "",
    });
    const addItemToThecart = (product: CartProduct) => () => {
        router.delete(route("cart.remove"), {
            data: {
                product_id: product.id,
            },
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => toast.success("Deleted successfully."),
            onError: () =>
                toast.error(
                    "Sorry, something went wrong. We couldin't handle this issue."
                ),
        });
    };

    const items: CartProduct[] = Object.values(cart);

    const totaPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

    // console.log(items);
    return (
        <Authenticated user={auth.user}>
            <Head title="Cart" />

            <div className="flex flex-col md:flex-row gap-8">
                <Table
                    isStriped
                    removeWrapper
                    aria-label="Example static collection table"
                    className="w-full"
                >
                    <TableHeader>
                        <TableColumn>Product</TableColumn>
                        <TableColumn>QUANTITY</TableColumn>
                        <TableColumn>PRICE</TableColumn>
                        <TableColumn>TOTAL</TableColumn>
                        <TableColumn>{""}</TableColumn>
                    </TableHeader>
                    <TableBody
                        emptyContent={
                            <div className="flex justify-center items-center">
                                <ShoppingCartIcon className="block size-20 text-default-400" />
                                <p className="text-default-300 text-center">
                                    No items found.
                                </p>
                            </div>
                        }
                    >
                        {items.map((product, index) => (
                            <TableRow key={product.id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>
                                    <UpdateCartItem item={product} />
                                </TableCell>
                                <TableCell>
                                    {numberFormat(product.price)}
                                </TableCell>
                                <TableCell>
                                    {numberFormat(
                                        product.price * product.quantity
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Tooltip
                                        color="danger"
                                        content="Delete item?"
                                    >
                                        <span
                                            onClick={addItemToThecart(product)}
                                            className="text-lg text-danger cursor-pointer active:opacity-50"
                                        >
                                            <DeleteIcon />
                                        </span>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="m min-w-[400px]">
                    <AddToCart products={products} />

                    <ul className="my-6 space-y-3 divide-y divide-default-300 max-w-sm">
                        <li className="flex justify-between items-center">
                            <p>Total Price</p>
                            <b className="text-success">
                                {numberFormat(totaPrice)}
                            </b>
                        </li>
                        <li className="flex justify-between items-center pt-4">
                            <p>Customer </p>
                            <p>Amina Kiloba</p>
                        </li>

                        <li className="flex justify-between items-center pt-4">
                            <p>Discount </p>
                            <b>10%</b>
                        </li>

                        <li className="flex justify-between items-center pt-4">
                            <p>Payment method </p>
                            <Select
                                className="max-w-28"
                                aria-label="Payment methods"
                            >
                                <SelectItem key={1} value={"1"}>
                                    {" "}
                                    Cash{" "}
                                </SelectItem>
                                <SelectItem key={2} value={"2"}>
                                    Tigo Lipa
                                </SelectItem>
                            </Select>
                        </li>

                        <li className="flex justify-between items-center pt-4">
                            <p>Paid </p>
                            <Input
                                type="number"
                                color={"secondary"}
                                value={totaPrice.toString()}
                                className="max-w-28"
                            />
                        </li>
                    </ul>
                </div>
            </div>
        </Authenticated>
    );
};

export default CartIndex;
