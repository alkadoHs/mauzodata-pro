import React, { FormEventHandler } from "react";
import { useForm } from "@inertiajs/react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { User } from "@/types";
import { ReactSearchAutocomplete } from "react-search-autocomplete";
import { numberFormat } from "@/lib/utils";

export default function CreateVendorProduct({
    users,
    products,
}: {
    users: User[];
    products: Product[];
}) {
    const [open, setOpen] = React.useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        user_id: "",
        product_id: "",
        stock: "",
    });

    const onsubmit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("vendorproducts.store"), {
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger>
                    <Button>Add Vendor product</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                    <DialogHeader className="flex flex-col gap-1">
                        <DialogTitle>Vendor Product</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={onsubmit}>
                        <div className="grid grid-cols-6 gap-4">
                            <div className="col-span-6 md:col-span-3 grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="user_id">Vendor</Label>
                                <Select
                                    onValueChange={(value) =>
                                        setData("user_id", value)
                                    }
                                    value={data.user_id}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="select vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users &&
                                            users?.map((user) => (
                                                <SelectItem
                                                    key={user.id}
                                                    value={user.id.toString()}
                                                >
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.user_id} />
                            </div>

                            <div className="col-span-6 md:col-span-3 grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="product_id">Product</Label>
                                <ReactSearchAutocomplete
                                    items={products}
                                    placeholder="Select product..."
                                    formatResult={(product: Product) =>
                                        `${product.name} / ${
                                            product.unit
                                        }  (${numberFormat(product.stock)})`
                                    }
                                    onSelect={(product) =>
                                        setData(
                                            "product_id",
                                            product.id.toString()
                                        )
                                    }
                                />
                                <InputError message={errors.product_id} />
                            </div>
                            <div className="col-span-6 md:col-span-3 grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="stock">Stock</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    value={data.stock}
                                    onChange={(e) =>
                                        setData("stock", e.target.value)
                                    }
                                    placeholder="stock"
                                />
                                <InputError message={errors.stock} />
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
