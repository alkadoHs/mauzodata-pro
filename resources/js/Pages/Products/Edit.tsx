import InputError from "@/Components/InputError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Product } from "@/lib/schemas";
import { PageProps } from "@/types";
import { router, useForm } from "@inertiajs/react";
import React, { FormEventHandler } from "react";
import { toast } from "sonner";

const Edit = ({ auth, product }: PageProps<{ product: Product }>) => {
    const [open, setOpen] = React.useState(false);

    const { data, setData, patch, processing, reset, errors } = useForm({
        ...product,
    });

    const onsubmit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route("products.update", product.id), {
            onSuccess: () => {
                toast.success("Updated successfully.");
                setOpen(false);
            },
        });
    };

    return (
        <Authenticated user={auth.user}>
            <section>
                <h3 className="text-2xl font-semibold mb-4">
                    Update <b className="underline">{product.name}</b>
                </h3>
                <form onSubmit={onsubmit}>
                    <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-6 md:col-span-3 grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                type="text"
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                placeholder="Product name"
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="col-span-6 md:col-span-3 grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="unit">Unit</Label>
                            <Input
                                type="text"
                                id="name"
                                value={data.unit}
                                onChange={(e) =>
                                    setData("unit", e.target.value)
                                }
                                placeholder="Product unit"
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="col-span-3 md:col-span-2 grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="buy_price">Buying price</Label>
                            <Input
                                id="buy_price"
                                type="number"
                                value={data.buy_price}
                                onChange={(e) =>
                                    setData(
                                        "buy_price",
                                        parseFloat(e.target.value)
                                    )
                                }
                                placeholder="Product buy_price"
                            />
                            <InputError message={errors.buy_price} />
                        </div>
                        <div className="col-span-3 md:col-span-2 grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="sale_price">Selling price</Label>
                            <Input
                                id="sale_price"
                                type="number"
                                value={data.sale_price}
                                onChange={(e) =>
                                    setData(
                                        "sale_price",
                                        parseFloat(e.target.value)
                                    )
                                }
                                placeholder="Product sale_price"
                            />
                            <InputError message={errors.sale_price} />
                        </div>
                        <div className="col-span-3 md:col-span-2 grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="stock">Stock</Label>
                            <Input
                                id="stock"
                                type="number"
                                value={data.stock}
                                onChange={(e) =>
                                    setData("stock", parseFloat(e.target.value))
                                }
                            />
                            <InputError message={errors.stock} />
                        </div>
                        <div className="col-span-3 md:col-span-2 grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="stock_alert">Stock Alert</Label>
                            <Input
                                id="stock_alert"
                                type="number"
                                value={data.stock_alert}
                                onChange={(e) =>
                                    setData(
                                        "stock_alert",
                                        parseFloat(e.target.value)
                                    )
                                }
                                placeholder="Product stock_alert"
                            />
                            <InputError message={errors.stock_alert} />
                        </div>
                        <div className="col-span-3 md:col-span-2 grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="expire_date">Expire date</Label>
                            <Input
                                type="date"
                                id="expire_date"
                                value={data.expire_date}
                                onChange={(e) =>
                                    setData("expire_date", e.target.value)
                                }
                                placeholder="Product expire_date"
                            />
                            <InputError message={errors.expire_date} />
                        </div>
                    </div>
                    <div className="grid grid-cols-6 space-x-4 my-4">
                        <div className="col-span-3 md:col-span-2 grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="whole_sale">whole sale stock</Label>
                            <Input
                                id="whole_sale"
                                type="number"
                                value={data.whole_sale}
                                onChange={(e) =>
                                    setData(
                                        "whole_sale",
                                        parseFloat(e.target.value)
                                    )
                                }
                                placeholder="whole sale"
                            />
                            <InputError message={errors.whole_sale} />
                        </div>
                        <div className="col-span-3 md:col-span-2 grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="whole_price">
                                Whole sale price
                            </Label>
                            <Input
                                type="number"
                                id="whole_price"
                                value={data.whole_price}
                                onChange={(e) =>
                                    setData(
                                        "whole_price",
                                        parseFloat(e.target.value)
                                    )
                                }
                                placeholder="whole_price"
                            />
                            <InputError message={errors.whole_price} />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant={"outline"}
                            onClick={() => router.visit(route('products.index'))}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Update
                        </Button>
                    </div>
                </form>
            </section>
        </Authenticated>
    );
};

export default Edit;
