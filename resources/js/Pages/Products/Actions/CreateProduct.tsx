import React, { FormEventHandler } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericFormat } from "react-number-format";
import InputError from "@/Components/InputError";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";

export default function CreateProduct() {
    const [open, setOpen] = React.useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        name: "",
        unit: "",
        product_id: "",
        buy_price: "",
        sale_price: "",
        stock: "",
        stock_alert: "",
        whole_sale: "0.00",
        whole_price: "0.00",
        expire_date: "",
    });

    const onsubmit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("products.store"), {
            onSuccess: () => {
                toast.success("Created successfully.");
                reset();
            },
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger>
                    <Button size={'sm'}><PlusCircle className="size-5 mr-2" />Add new</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                    <DialogHeader className="flex flex-col gap-1">
                        <DialogTitle>Create product</DialogTitle>
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
                                <InputError message={errors.unit} />
                            </div>
                            <div className="col-span-3 md:col-span-2 grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="buy_price">Buying price</Label>
                                <NumericFormat
                                    customInput={Input}
                                    id="buy_price"
                                    value={data.buy_price}
                                    onChange={(e) =>
                                        setData("buy_price", e.target.value)
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
                                        setData("sale_price", e.target.value)
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
                                        setData("stock", e.target.value)
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
                                    customInput={Input}
                                    id="stock_alert"
                                    value={data.stock_alert}
                                    onChange={(e) =>
                                        setData("stock_alert", e.target.value)
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
                                        setData("whole_sale", e.target.value)
                                    }
                                    placeholder="Product whole_sale"
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
                                <NumericFormat
                                    customInput={Input}
                                    id="whole_price"
                                    value={data.whole_price}
                                    onChange={(e) =>
                                        setData("whole_price", e.target.value)
                                    }
                                    placeholder="Product whole_price"
                                    allowLeadingZeros
                                    allowNegative={false}
                                    thousandSeparator=","
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
                                Create
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
