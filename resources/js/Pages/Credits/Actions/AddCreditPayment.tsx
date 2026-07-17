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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { CreditSale } from "@/lib/schemas";
import { NumericFormat } from "react-number-format";
import { numberFormat } from "@/lib/utils";

export default function AddCreditPayment({
    credit,
    debt,
}: {
    credit: CreditSale;
    debt: number;
}) {
    const [open, setOpen] = React.useState(false);

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        amount: "",
    });

    const onsubmit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("credits.payment", credit.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Payment recorded.");
                setOpen(false);
                reset();
            },
            onError: (errs) => errs.amount && toast.error(errs.amount),
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                if (o) {
                    reset();
                    clearErrors();
                }
            }}
        >
            {/* asChild — otherwise Radix renders its own <button> around ours */}
            <DialogTrigger asChild>
                <Button size="sm">Add payment</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add payment</DialogTitle>
                    <DialogDescription>
                        {numberFormat(debt)} still owed. Anything more than that is
                        capped at the outstanding amount.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onsubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor={`amount-${credit.id}`}>Amount</Label>
                        <NumericFormat
                            customInput={Input}
                            id={`amount-${credit.id}`}
                            thousandSeparator=","
                            allowNegative={false}
                            value={data.amount}
                            placeholder={String(debt)}
                            onChange={(e) => setData("amount", e.target.value)}
                        />
                        <InputError message={errors.amount} />
                        <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => setData("amount", String(debt))}
                        >
                            Pay full amount ({numberFormat(debt)})
                        </button>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Saving…" : "Record payment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
