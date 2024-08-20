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
import { Branch, Product } from "@/lib/schemas";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { User } from "@/types";
import { ProductCombobox } from "@/Components/ProductComobox";
import { ReactSearchAutocomplete } from "react-search-autocomplete";
import { numberFormat } from "@/lib/utils";
import { Heading4 } from "@/components/Typography/Heading4";

export default function CreateStockTransfer({
    branches,
    products,
}: {
    branches: Branch[];
    products: Product[];
}) {
    const [open, setOpen] = React.useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        branch_id: "",
        product_id: "",
        stock: "",
    });

    const onsubmit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("stocktransfer.store"), {
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <>
            <div>
                <div className="mb-3">
                    <Heading4>Transfer Stocks</Heading4>
                </div>
                <form className="" onSubmit={onsubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className=" gap-1.5">
                            <Label htmlFor="branch_id">Branch</Label>
                            <Select
                                value={data.branch_id}
                                onValueChange={(value) =>
                                    setData("branch_id", value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
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
                            <InputError message={errors.branch_id} />
                        </div>

                        <div className=" gap-1.5">
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
                                    setData("product_id", product.id.toString())
                                }
                            />
                            <InputError message={errors.product_id} />
                        </div>
                        <div className=" gap-1.5">
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
                    <div>
                        <Button type="submit" disabled={processing}>
                            Transfer
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
