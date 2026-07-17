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
import { Branch } from "@/lib/schemas";
import { useForm } from "@inertiajs/react";
import { FormEventHandler, useEffect } from "react";
import { toast } from "sonner";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Present = edit mode; absent = create mode. */
    branch?: Branch | null;
};

export function BranchFormDialog({ open, onOpenChange, branch }: Props) {
    const editing = !!branch;

    const { data, setData, errors, post, patch, processing, reset, clearErrors } =
        useForm({
            name: "",
            phone: "",
            email: "",
            city: "",
            address: "",
            tax_id: "",
        });

    // Load the row being edited (or clear) each time the dialog opens.
    useEffect(() => {
        if (!open) return;
        clearErrors();
        setData({
            name: branch?.name ?? "",
            phone: branch?.phone ?? "",
            email: branch?.email ?? "",
            city: branch?.city ?? "",
            address: branch?.address ?? "",
            tax_id: branch?.tax_id ?? "",
        });
    }, [open, branch]);

    const done = (message: string) => {
        toast.success(message);
        reset();
        onOpenChange(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editing) {
            patch(route("branches.update", branch!.id), {
                preserveScroll: true,
                onSuccess: () => done("Branch updated"),
            });
        } else {
            post(route("branches.store"), {
                preserveScroll: true,
                onSuccess: () => done("Branch created"),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? "Edit branch" : "Add branch"}
                    </DialogTitle>
                    <DialogDescription>
                        {editing
                            ? "Update this branch's details."
                            : "Create a new branch for your company."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="e.g. Uyole Shop"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setData("phone", e.target.value)}
                                placeholder="07xxxxxxxx"
                            />
                            <InputError message={errors.phone} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                placeholder="branch@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                value={data.city}
                                onChange={(e) => setData("city", e.target.value)}
                                placeholder="e.g. Mbeya"
                            />
                            <InputError message={errors.city} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="tax_id">Tax ID</Label>
                            <Input
                                id="tax_id"
                                value={data.tax_id}
                                onChange={(e) => setData("tax_id", e.target.value)}
                                placeholder="Optional"
                            />
                            <InputError message={errors.tax_id} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                            placeholder="P.O. Box …"
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
                            {processing
                                ? "Saving…"
                                : editing
                                  ? "Save changes"
                                  : "Create branch"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
