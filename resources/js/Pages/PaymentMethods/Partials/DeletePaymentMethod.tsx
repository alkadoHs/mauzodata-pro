import React, { FormEventHandler } from "react";
import { router, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { PaymentMethod } from "@/lib/schemas";
import { DeleteIcon } from "@/Components/icons/DeleteIcon";

export default function DeletePaymentMethod({ paymentMethod }: { paymentMethod: PaymentMethod }) {
    const [open, setOpen] = React.useState(false);

    const { data, setData, processing, reset, errors } = useForm({
        id: paymentMethod.id,
    });

    const onsubmit: FormEventHandler = (e) => {
        e.preventDefault();

        router.delete(route("payments.destroy", data.id), {
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
                                You're about to delete <b>{paymentMethod.name}</b> !
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                When you delete it can never be
                                restored back, and all of the sales associated
                                with this payment method will be deleted as well.
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
