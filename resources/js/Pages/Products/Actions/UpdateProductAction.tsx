import React, { FormEventHandler } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InputError from "@/Components/InputError";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Product } from "@/lib/schemas";
import { EditIcon } from "@/Components/icons/EditIcon";
import { NumericFormat } from "react-number-format";


export default function UpdateProductAction({ product }: { product: Product }) {
    const [open, setOpen] = React.useState(false);

    const { data, setData, patch, processing, reset, errors } = useForm({
        ...product,
    });

    const onsubmit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route("products.update", product.id), {
            onSuccess: () => {
                toast.success("Updated successfully.");
                setOpen(false)
            },
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger>
                    <span className="text-xl text-indigo-500 cursor-pointer active:opacity-50">
                        <EditIcon />
                    </span>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                    <DialogHeader className="flex flex-col gap-1">
                        <DialogTitle>
                            Update <b className="underline">{product.name}</b>
                        </DialogTitle>
                    </DialogHeader>
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
                                <NumericFormat
                                    customInput={Input}
                                    id="buy_price"
                                    value={data.buy_price}
                                    onChange={(e) =>
                                        setData(
                                            "buy_price",
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    placeholder="Product buy_price"
                                    allowLeadingZeros
                                    allowNegative={false}
                                    thousandSeparator=","
                                />
                                <InputError message={errors.buy_price} />
                            </div>
                            <div className="col-span-3 md:col-span-2 grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="sale_price">
                                    Selling price
                                </Label>
                                <NumericFormat
                                    customInput={Input}
                                    id="sale_price"
                                    value={data.sale_price}
                                    onChange={(e) =>
                                        setData(
                                            "sale_price",
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    placeholder="Product sale_price"
                                    allowLeadingZeros
                                    allowNegative={false}
                                    thousandSeparator=","
                                />
                                <InputError message={errors.sale_price} />
                            </div>
                            <div className="col-span-3 md:col-span-2 grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="stock">Stock</Label>
                                <NumericFormat
                                    customInput={Input}
                                    id="stock"
                                    value={data.stock}
                                    onChange={(e) =>
                                        setData(
                                            "stock",
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    allowLeadingZeros
                                    allowNegative={false}
                                    thousandSeparator=","
                                />
                                <InputError message={errors.stock} />
                            </div>
                            <div className="col-span-3 md:col-span-2 grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="stock_alert">Stock Alert</Label>
                                <NumericFormat
                                    id="stock_alert"
                                    value={data.stock_alert}
                                    onChange={(e) =>
                                        setData(
                                            "stock_alert",
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    placeholder="Product stock_alert"
                                    allowLeadingZeros
                                    allowNegative={false}
                                    thousandSeparator=","
                                />
                                <InputError message={errors.stock_alert} />
                            </div>
                            <div className="col-span-3 md:col-span-2 grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="expire_date">Expire date</Label>
                                <Input
                                    type="text"
                                    id="expire_date"
                                    value={data.expire_date}
                                    onChange={(e) =>
                                        setData("expire_date", e.target.value)
                                    }
                                    placeholder="Product expire_date"
                                />
                                <InputError message={errors.name} />
                            </div>
                        </div>
                        <div className="grid grid-cols-6 space-x-4 my-4">
                            <div className="col-span-3 md:col-span-2 grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="whole_sale">
                                    whole sale stock
                                </Label>
                                <NumericFormat
                                    customInput={Input}
                                    id="whole_sale"
                                    value={data.whole_sale}
                                    onChange={(e) =>
                                        setData(
                                            "whole_sale",
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    placeholder="whole sale"
                                    allowLeadingZeros
                                    allowNegative={false}
                                    thousandSeparator=","
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
                                    placeholder="Product whole_price"
                                />
                                <InputError message={errors.whole_price} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant={"outline"}
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Update
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
