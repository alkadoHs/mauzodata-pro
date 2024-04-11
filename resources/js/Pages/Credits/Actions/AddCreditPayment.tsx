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
import { CreditSale } from "@/lib/schemas";
import { set } from "date-fns";

export default function AddCreditPayment({ credit }: { credit: CreditSale }) {
    const [open, setOpen] = React.useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        amount: "",
    });

    const onsubmit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("credits.payment", credit.id), {
            onSuccess: () => {
                toast.success("Created successfully.");
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger>
                    <Button>Add Payment</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                    <DialogHeader className="flex flex-col gap-1">
                        <DialogTitle>Add Payment </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={onsubmit}>
                        <div className="my-4 col-span-6 md:col-span-3 grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="name">Amount</Label>
                            <Input
                                type="number"
                                id="name"
                                value={data.amount}
                                onChange={(e) =>
                                    setData("amount", e.target.value)
                                }
                            />
                            <InputError message={errors.amount} />
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
