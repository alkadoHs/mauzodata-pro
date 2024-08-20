import React, { FormEventHandler } from "react";
import { useForm } from "@inertiajs/react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InputError from "@/Components/InputError";
import { Product } from "@/lib/schemas";
import { ReactSearchAutocomplete } from "react-search-autocomplete";
import { numberFormat } from "@/lib/utils";
import { Heading4 } from "@/components/Typography/Heading4";

export default function NewStockForm({ products }: { products: Product[] }) {
    const [open, setOpen] = React.useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        product_id: "",
        new_stock: "",
    });

    const onsubmit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("newstocks.store"), {
            onSuccess: () => reset(),
        });
    };

    return (
        <section>
            <div className="mb-3">
                <Heading4>Transfer Stocks</Heading4>
            </div>
            <form onSubmit={onsubmit}>
                <div className="flex items-center gap-4">
                    <div className="grid gap-3 w-full">
                        <Label htmlFor="product_id">Product</Label>
                        <ReactSearchAutocomplete
                            items={products}
                            formatResult={(product: Product) =>
                                `${product.name} / ${
                                    product.unit
                                }  (${numberFormat(product.stock)})`
                            }
                            onSelect={(product) =>
                                setData("product_id", product.id.toString())
                            }
                            placeholder="Search product..."
                        />
                        <InputError message={errors.product_id} />
                    </div>
                    <div className="grid gap-3 w-full">
                        <Label htmlFor="new_stock">New Stock</Label>
                        <Input
                            type="number"
                            id="new_stock"
                            value={data.new_stock}
                            onChange={(e) =>
                                setData("new_stock", e.target.value)
                            }
                            placeholder="stock amount"
                        />
                        <InputError message={errors.new_stock} />
                    </div>
                </div>
                <div className="flex gap-4 items-center mt-4">
                    {/* <Button
                        type="button"
                        variant={"outline"}
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button> */}
                    <Button type="submit" disabled={processing}>
                        Create
                    </Button>
                </div>
            </form>
        </section>
    );
}
