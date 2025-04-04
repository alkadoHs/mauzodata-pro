import React from "react";
import { ProductTransferItem } from "../transfer-columns";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

const EditTransferCartItem = ({
    transferCartItem,
}: {
    transferCartItem: ProductTransferItem;
}) => {
    const handleChange = useDebouncedCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const stock = parseInt(value);
            if (isNaN(stock)) return;
            transferCartItem.stock = stock;

            router.patch(
                route("product-transfers.cart.update", transferCartItem.id),
                { stock },
                {
                    onSuccess: () => {
                        toast.success("Stock updated.");
                    },
                    onError: () => {
                        toast.error("Failed to update stock, stock not enough.");
                        router.reload();
                    }
                }
            );
        },
        1000
    );
    return (
        <div>
            <Input type="number" name="stock" className="max-w-20" defaultValue={transferCartItem.stock} onBlur={handleChange} />
        </div>
    );
};

export default EditTransferCartItem;
