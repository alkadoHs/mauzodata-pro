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
import { useForm } from "@inertiajs/react";
import { FormEventHandler, useEffect } from "react";
import { toast } from "sonner";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

/**
 * Create a supplier from anywhere. Shared by the Suppliers page and the
 * purchase-order form, so a user never has to leave what they're doing.
 *
 * Posts with preserveState so an in-progress form on the host page (e.g. the
 * purchase order's line items) survives the round trip; props still refresh,
 * which is how the caller sees the new supplier.
 */
export function SupplierFormDialog({ open, onOpenChange }: Props) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: "",
        email: "",
        phone: "",
        address: "",
    });

    useEffect(() => {
        if (open) {
            reset();
            clearErrors();
        }
    }, [open]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("suppliers.store"), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Supplier created");
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add supplier</DialogTitle>
                    <DialogDescription>
                        Someone you buy stock from.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="supplier-name">Name *</Label>
                        <Input
                            id="supplier-name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="e.g. Mbeya Wholesalers"
                            autoFocus
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="supplier-phone">Phone</Label>
                            <Input
                                id="supplier-phone"
                                value={data.phone}
                                onChange={(e) => setData("phone", e.target.value)}
                                placeholder="07xxxxxxxx"
                            />
                            <InputError message={errors.phone} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="supplier-email">Email</Label>
                            <Input
                                id="supplier-email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                placeholder="Optional"
                            />
                            <InputError message={errors.email} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="supplier-address">Address</Label>
                        <Input
                            id="supplier-address"
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                            placeholder="Optional"
                        />
                        <InputError message={errors.address} />
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
                            {processing ? "Saving…" : "Save supplier"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
