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
import { Link, useForm } from "@inertiajs/react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { FormEventHandler, useEffect } from "react";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { TripDetail, TripOptions } from "./types";

/** Radix Select cannot hold an empty value, so "nobody yet" needs a name. */
const NO_DRIVER = "unassigned";

export function TripFormDialog({
    open,
    onOpenChange,
    trip,
    options,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Present = edit mode; absent = record a new trip. */
    trip?: TripDetail | null;
    options: TripOptions;
}) {
    const editing = !!trip;
    const form = useForm({
        truck_id: "",
        trip_client_id: "",
        driver_id: NO_DRIVER as string,
        origin: "",
        destination: "",
        cargo: "",
        weight_tons: "",
        freight_amount: "",
        dispatched_at: "",
        notes: "",
    });
    const { data, setData, errors, processing, reset, clearErrors } = form;

    useEffect(() => {
        if (!open) return;
        clearErrors();
        setData({
            truck_id: trip ? String(trip.truck_id) : "",
            trip_client_id: trip ? String(trip.trip_client_id) : "",
            driver_id: trip?.driver_id ? String(trip.driver_id) : NO_DRIVER,
            origin: trip?.origin ?? "",
            destination: trip?.destination ?? "",
            cargo: trip?.cargo ?? "",
            weight_tons: trip?.weight_tons != null ? String(trip.weight_tons) : "",
            freight_amount: trip ? String(trip.freight_amount) : "",
            // A new trip is almost always today's.
            dispatched_at: trip?.dispatched_at ?? new Date().toISOString().slice(0, 10),
            notes: trip?.notes ?? "",
        });
    }, [open, trip]);

    // Nothing can be recorded without a lorry and somebody to carry for.
    const missing = [
        options.trucks.length === 0 ? { label: "a truck", href: "logistics.trucks.index" } : null,
        options.clients.length === 0 ? { label: "a client", href: "logistics.clients.index" } : null,
    ].filter(Boolean) as { label: string; href: string }[];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.transform((d) => ({
            ...d,
            driver_id: d.driver_id === NO_DRIVER ? "" : d.driver_id,
        }));

        const done = (message: string) => {
            toast.success(message);
            reset();
            onOpenChange(false);
        };

        if (editing) {
            form.patch(route("logistics.trips.update", trip!.id), {
                preserveScroll: true,
                onSuccess: () => done("Trip updated"),
            });
        } else {
            // store() redirects to the new trip's own page, where the next
            // thing to do — adding what it cost — already is.
            form.post(route("logistics.trips.store"), {
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editing ? `Edit ${trip!.reference}` : "Record a trip"}</DialogTitle>
                    <DialogDescription>
                        {editing
                            ? "Change what this journey was, where it went, or what was agreed."
                            : "One truck, one client's load. Costs and payments get added on the trip's own page afterwards."}
                    </DialogDescription>
                </DialogHeader>

                {missing.length > 0 && !editing && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <p>
                            You need {missing.map((m) => m.label).join(" and ")} first.{" "}
                            {missing.map((m) => (
                                <Link
                                    key={m.href}
                                    href={route(m.href)}
                                    className="mr-2 inline-flex items-center gap-1 font-medium underline"
                                >
                                    Add {m.label} <ArrowRight className="size-3" />
                                </Link>
                            ))}
                        </p>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Truck *" error={errors.truck_id}>
                            <Select
                                value={data.truck_id}
                                onValueChange={(v) => setData("truck_id", v)}
                            >
                                <SelectTrigger><SelectValue placeholder="Which lorry?" /></SelectTrigger>
                                <SelectContent>
                                    {options.trucks.map((t) => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            {t.plate_number}
                                            {t.name ? ` — ${t.name}` : ""}
                                            {t.status !== "active" ? " (off the road)" : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field label="Client *" error={errors.trip_client_id}>
                            <Select
                                value={data.trip_client_id}
                                onValueChange={(v) => setData("trip_client_id", v)}
                            >
                                <SelectTrigger><SelectValue placeholder="Whose load?" /></SelectTrigger>
                                <SelectContent>
                                    {options.clients.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="From *" error={errors.origin}>
                            <Input
                                value={data.origin}
                                onChange={(e) => setData("origin", e.target.value)}
                                placeholder="e.g. Dar es Salaam"
                            />
                        </Field>
                        <Field label="To *" error={errors.destination}>
                            <Input
                                value={data.destination}
                                onChange={(e) => setData("destination", e.target.value)}
                                placeholder="e.g. Mbeya"
                            />
                        </Field>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Cargo" error={errors.cargo}>
                            <Input
                                value={data.cargo}
                                onChange={(e) => setData("cargo", e.target.value)}
                                placeholder="e.g. mahindi"
                            />
                        </Field>
                        <Field label="Weight (tons)" error={errors.weight_tons}>
                            <NumericFormat
                                customInput={Input}
                                value={data.weight_tons}
                                onValueChange={({ value }) => setData("weight_tons", value)}
                                thousandSeparator=","
                                allowNegative={false}
                                placeholder="e.g. 30"
                            />
                        </Field>
                        <Field label="Driver" error={errors.driver_id}>
                            <Select
                                value={data.driver_id}
                                onValueChange={(v) => setData("driver_id", v)}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_DRIVER}>Not assigned yet</SelectItem>
                                    {options.drivers.map((d) => (
                                        <SelectItem key={d.id} value={String(d.id)}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Freight agreed (TZS) *" error={errors.freight_amount}>
                            <NumericFormat
                                customInput={Input}
                                value={data.freight_amount}
                                onValueChange={({ value }) => setData("freight_amount", value)}
                                thousandSeparator=","
                                allowNegative={false}
                                placeholder="e.g. 2,500,000"
                            />
                        </Field>
                        <Field label="Dispatched on *" error={errors.dispatched_at}>
                            <Input
                                type="date"
                                value={data.dispatched_at}
                                onChange={(e) => setData("dispatched_at", e.target.value)}
                            />
                        </Field>
                    </div>

                    <Field label="Notes" error={errors.notes}>
                        <Textarea
                            rows={2}
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
                            placeholder="Anything worth remembering about this journey."
                        />
                    </Field>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || (!editing && missing.length > 0)}
                        >
                            {processing ? "Saving…" : editing ? "Save changes" : "Record trip"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
