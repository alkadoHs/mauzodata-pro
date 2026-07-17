import InputError from "@/Components/InputError";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentMethod } from "@/lib/schemas";
import { useForm } from "@inertiajs/react";
import { FormEventHandler, useEffect } from "react";
import { toast } from "sonner";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Present = edit mode; absent = create mode. */
    paymentMethod?: PaymentMethod | null;
};

export function PaymentMethodFormDialog({
    open,
    onOpenChange,
    paymentMethod,
}: Props) {
    const editing = !!paymentMethod;

    const { data, setData, errors, post, patch, processing, reset, clearErrors } =
        useForm({ name: "" });

    useEffect(() => {
        if (!open) return;
        clearErrors();
        setData("name", paymentMethod?.name ?? "");
    }, [open, paymentMethod]);

    const done = (message: string) => {
        toast.success(message);
        reset();
        onOpenChange(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editing) {
            patch(route("payments.update", paymentMethod!.id), {
                preserveScroll: true,
                onSuccess: () => done("Payment method updated"),
            });
        } else {
            post(route("payments.store"), {
                preserveScroll: true,
                onSuccess: () => done("Payment method created"),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? "Edit payment method" : "Add payment method"}
                    </DialogTitle>
                    <DialogDescription>
                        {editing
                            ? "Rename this payment method."
                            : "Add a way your customers can pay, e.g. Cash or M-Pesa."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="e.g. Cash, M-Pesa, Bank"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? "Saving…"
                                : editing
                                  ? "Save changes"
                                  : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
