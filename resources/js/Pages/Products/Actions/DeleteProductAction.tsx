import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { Product } from "@/lib/schemas";
import { DeleteIcon } from "@/Components/icons/DeleteIcon";
import { KeyPromptDialog } from "@/components/KeyPromptDialog";

export default function DeleteProductAction({ product }: { product: Product }) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const confirm = (key: string) => {
        setProcessing(true);
        setError(undefined);

        router.delete(route("products.destroy", product.id), {
            // The key is verified server-side by the auth.key middleware.
            data: { authorization_key: key },
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                toast.success("Product deleted");
            },
            onError: (errors) =>
                setError(errors.authorization_key ?? "Could not delete this product."),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <span
                onClick={() => {
                    setError(undefined);
                    setOpen(true);
                }}
                className="text-xl text-red-500 cursor-pointer active:opacity-50"
            >
                <DeleteIcon />
            </span>

            <KeyPromptDialog
                open={open}
                onOpenChange={setOpen}
                title={`Delete ${product.name}?`}
                description="This can't be undone, and every sale linked to this product goes with it. Enter an authorization key to confirm."
                confirmLabel="Delete product"
                processing={processing}
                error={error}
                onConfirm={confirm}
            />
        </>
    );
}
