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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Branch, FixedAsset } from "@/lib/schemas";
import { useForm } from "@inertiajs/react";
import { FormEventHandler, useEffect } from "react";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";

/** Sentinel for "no specific branch" — Radix Select can't hold a value of "". */
const COMPANY_WIDE = "company-wide";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branches: Branch[];
    /** Present = edit mode; absent = create mode. */
    asset?: FixedAsset | null;
};

export function FixedAssetFormDialog({ open, onOpenChange, branches, asset }: Props) {
    const editing = !!asset;

    const form = useForm({
        name: "",
        value: "",
        branch_id: COMPANY_WIDE as string,
        acquired_at: "",
        notes: "",
    });
    const { data, setData, errors, processing, reset, clearErrors } = form;

    useEffect(() => {
        if (!open) return;
        clearErrors();
        setData({
            name: asset?.name ?? "",
            value: asset ? String(asset.value) : "",
            branch_id: asset?.branch ? String(asset.branch.id) : COMPANY_WIDE,
            acquired_at: asset?.acquired_at ?? "",
            notes: asset?.notes ?? "",
        });
    }, [open, asset]);

    const done = (message: string) => {
        toast.success(message);
        reset();
        onOpenChange(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // The sentinel is only for the Select — the server side of "company-wide"
        // is an absent branch_id, not the literal string.
        form.transform((d) => ({
            ...d,
            branch_id: d.branch_id === COMPANY_WIDE ? "" : d.branch_id,
        }));

        if (editing) {
            form.patch(route("fixed-assets.update", asset!.id), {
                preserveScroll: true,
                onSuccess: () => done("Asset updated"),
            });
        } else {
            form.post(route("fixed-assets.store"), {
                preserveScroll: true,
                onSuccess: () => done("Asset recorded"),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editing ? "Edit asset" : "Record an asset"}</DialogTitle>
                    <DialogDescription>
                        {editing
                            ? "Update what this item is worth or where it belongs."
                            : "A computer, a printer, a Pikipiki — each one gets its own record, with its own value."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="e.g. Computer — Dell Latitude, Pikipiki, Guta"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="value">Value (TZS) *</Label>
                            <NumericFormat
                                customInput={Input}
                                id="value"
                                value={data.value}
                                onValueChange={({ value }) => setData("value", value)}
                                thousandSeparator=","
                                allowNegative={false}
                                placeholder="e.g. 1,500,000"
                            />
                            <InputError message={errors.value} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="acquired_at">Acquired on</Label>
                            <Input
                                id="acquired_at"
                                type="date"
                                value={data.acquired_at}
                                onChange={(e) => setData("acquired_at", e.target.value)}
                            />
                            <InputError message={errors.acquired_at} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="branch_id">Belongs to</Label>
                        <Select
                            value={data.branch_id}
                            onValueChange={(value) => setData("branch_id", value)}
                        >
                            <SelectTrigger id="branch_id" className="w-full">
                                <SelectValue placeholder="Choose a branch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={COMPANY_WIDE}>
                                    Company-wide (not tied to one branch)
                                </SelectItem>
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={String(branch.id)}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.branch_id} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
                            placeholder="Serial number, condition, location — anything that tells this one apart."
                            rows={3}
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
                            {processing ? "Saving…" : editing ? "Save changes" : "Record asset"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
