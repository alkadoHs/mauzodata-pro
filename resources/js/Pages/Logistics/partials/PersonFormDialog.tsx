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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "@inertiajs/react";
import { FormEventHandler, useEffect } from "react";
import { toast } from "sonner";

type Person = {
    id: number;
    name: string;
    phone: string | null;
    license_number?: string | null;
    notes: string | null;
};

/**
 * Add or edit a driver or a client.
 *
 * The two are the same form bar one field, so they share it rather than
 * drifting apart over time — a licence number is the only thing a driver has
 * that a client does not.
 */
export function PersonFormDialog({
    open,
    onOpenChange,
    person,
    kind,
    routes,
    withLicence = false,
    namePlaceholder,
    description,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Present = edit mode; absent = create mode. */
    person?: Person | null;
    /** Used in the title and toasts, e.g. "driver". */
    kind: string;
    routes: { store: string; update: string };
    withLicence?: boolean;
    namePlaceholder: string;
    description: string;
}) {
    const editing = !!person;

    const { data, setData, errors, processing, reset, clearErrors, post, patch } =
        useForm({ name: "", phone: "", license_number: "", notes: "" });

    useEffect(() => {
        if (!open) return;
        clearErrors();
        setData({
            name: person?.name ?? "",
            phone: person?.phone ?? "",
            license_number: person?.license_number ?? "",
            notes: person?.notes ?? "",
        });
    }, [open, person]);

    const done = (message: string) => {
        toast.success(message);
        reset();
        onOpenChange(false);
    };

    const capitalised = kind.charAt(0).toUpperCase() + kind.slice(1);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing) {
            patch(route(routes.update, person!.id), {
                preserveScroll: true,
                onSuccess: () => done(`${capitalised} updated`),
            });
        } else {
            post(route(routes.store), {
                preserveScroll: true,
                onSuccess: () => done(`${capitalised} added`),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? `Edit ${kind}` : `Add a ${kind}`}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder={namePlaceholder}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className={withLicence ? "grid grid-cols-2 gap-3" : ""}>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setData("phone", e.target.value)}
                                placeholder="e.g. 0712 345 678"
                            />
                            <InputError message={errors.phone} />
                        </div>
                        {withLicence && (
                            <div className="space-y-1.5">
                                <Label htmlFor="license_number">Licence number</Label>
                                <Input
                                    id="license_number"
                                    value={data.license_number}
                                    onChange={(e) =>
                                        setData("license_number", e.target.value)
                                    }
                                />
                                <InputError message={errors.license_number} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            rows={2}
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
                        />
                        <InputError message={errors.notes} />
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
                                  : `Add ${kind}`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
