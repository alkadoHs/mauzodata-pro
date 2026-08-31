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
import { useForm } from "@inertiajs/react";
import { FormEventHandler, useEffect } from "react";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { Truck, TRUCK_STATUS_LABELS } from "./types";

export function TruckFormDialog({
    open,
    onOpenChange,
    truck,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Present = edit mode; absent = create mode. */
    truck?: Truck | null;
}) {
    const editing = !!truck;

    const { data, setData, errors, processing, reset, clearErrors, post, patch } =
        useForm({
            plate_number: "",
            name: "",
            make: "",
            capacity_tons: "",
            status: "active",
            notes: "",
        });

    useEffect(() => {
        if (!open) return;
        clearErrors();
        setData({
            plate_number: truck?.plate_number ?? "",
            name: truck?.name ?? "",
            make: truck?.make ?? "",
            capacity_tons: truck?.capacity_tons != null ? String(truck.capacity_tons) : "",
            status: truck?.status ?? "active",
            notes: truck?.notes ?? "",
        });
    }, [open, truck]);

    const done = (message: string) => {
        toast.success(message);
        reset();
        onOpenChange(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing) {
            patch(route("logistics.trucks.update", truck!.id), {
                preserveScroll: true,
                onSuccess: () => done("Truck updated"),
            });
        } else {
            post(route("logistics.trucks.store"), {
                preserveScroll: true,
                onSuccess: () => done("Truck added"),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editing ? "Edit truck" : "Add a truck"}</DialogTitle>
                    <DialogDescription>
                        {editing
                            ? "Update this lorry's details."
                            : "The plate is what documents and the weighbridge use; the name is what everyone actually calls it."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="plate_number">Plate number *</Label>
                            <Input
                                id="plate_number"
                                value={data.plate_number}
                                onChange={(e) => setData("plate_number", e.target.value)}
                                placeholder="e.g. T 123 ABC"
                            />
                            <InputError message={errors.plate_number} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="e.g. Mzee"
                            />
                            <InputError message={errors.name} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="make">Make</Label>
                            <Input
                                id="make"
                                value={data.make}
                                onChange={(e) => setData("make", e.target.value)}
                                placeholder="e.g. FAW, Scania"
                            />
                            <InputError message={errors.make} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="capacity_tons">Capacity (tons)</Label>
                            <NumericFormat
                                customInput={Input}
                                id="capacity_tons"
                                value={data.capacity_tons}
                                onValueChange={({ value }) => setData("capacity_tons", value)}
                                thousandSeparator=","
                                allowNegative={false}
                                placeholder="e.g. 30"
                            />
                            <InputError message={errors.capacity_tons} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={data.status}
                            onValueChange={(value) => setData("status", value)}
                        >
                            <SelectTrigger id="status" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(TRUCK_STATUS_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            rows={2}
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
                            placeholder="Anything worth remembering about this lorry."
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
                            {processing ? "Saving…" : editing ? "Save changes" : "Add truck"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
