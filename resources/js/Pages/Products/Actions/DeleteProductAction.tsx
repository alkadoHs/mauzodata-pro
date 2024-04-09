import React, { FormEventHandler } from "react";
import { router, useForm } from "@inertiajs/react";
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
import { DeleteIcon } from "@/Components/icons/DeleteIcon";

export default function DeleteProductAction({ product }: { product: Product }) {
    const [open, setOpen] = React.useState(false);

    const { data, setData, processing, reset, errors } = useForm({
        id: product.id,
    });

    const onsubmit: FormEventHandler = (e) => {
        e.preventDefault();

        router.delete(route("products.destroy", data.id), {
            onSuccess: () => {
                setOpen(false)
                toast.success("Deleted successfully!");
            }
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger>
                    <span className="text-xl text-red-500 cursor-pointer active:opacity-50">
                        <DeleteIcon />
                    </span>
                </DialogTrigger>
                <DialogContent className="">
                    <form onSubmit={onsubmit}>
                        <div className="text-center my-4">
                            <h4 className="scroll-m-20 text-xl text-destructive font-semibold tracking-tight">
                                You're about to delete <b>{product.name}</b> !
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                When this product is deleted it can never be
                                restored back, and all of the sales associated
                                with this product will be deleted as well.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant={"outline"}
                                onClick={() => setOpen(false)}
                            >
                                No, keep
                            </Button>
                            <Button
                                type="submit"
                                variant={"destructive"}
                                disabled={processing}
                            >
                                Yes, delete
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
