import { Product } from "@/lib/schemas";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { ReactSearchAutocomplete } from "react-search-autocomplete";

import { numberFormat } from "@/lib/utils";

export function AddProductToTheCart({ products }: { products: Product[] }) {
    const formatResult = (item: Product) => {
        return (
            <>
                <span style={{ display: "block", textAlign: "left" }}>
                    name: <b>{`${item.name}/ ${item.unit}`}</b>
                </span>
                <span style={{ display: "block", textAlign: "left" }}>
                    stock: {numberFormat(item.stock)}
                </span>
            </>
        );
    };

    const handleOnSelect = (item: Product) => {
        router.post(
            route("cart.add"),
            { product_id: item.id },
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    toast.success("Added to acrt");
                },
                onError: () =>
                    toast.warning(
                        "This product is alredy available to the cart."
                    ),
            }
        );
    };

    return (
        <div style={{ width: '100%' }}>
            <ReactSearchAutocomplete
                items={products}
                onSelect={handleOnSelect}
                autoFocus
                formatResult={formatResult}
                placeholder="Find product..."
            />
        </div>
    );
}
