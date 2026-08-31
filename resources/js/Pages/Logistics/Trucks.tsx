import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn, numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { router } from "@inertiajs/react";
import { Truck as TruckIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyRow, Register, RowActions } from "./partials/Register";
import { TruckFormDialog } from "./partials/TruckFormDialog";
import { Truck, TRUCK_STATUS_LABELS } from "./partials/types";

export default function Trucks({ auth, trucks }: PageProps<{ trucks: Truck[] }>) {
    const [filter, setFilter] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Truck | null>(null);
    const [deleting, setDeleting] = useState<Truck | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const shown = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return trucks;
        return trucks.filter((t) =>
            [t.plate_number, t.name, t.make, t.notes]
                .filter(Boolean)
                .some((v) => v!.toLowerCase().includes(q))
        );
    }, [trucks, filter]);

    const confirmDelete = () => {
        if (!deleting) return;
        setProcessing(true);
        setError(undefined);
        router.delete(route("logistics.trucks.destroy", deleting.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Truck removed");
                setDeleting(null);
            },
            onError: () => setError("Could not remove this truck."),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Register
                user={auth.user}
                title="Trucks"
                description="The fleet — what you own and what each one can carry."
                addLabel="Add truck"
                onAdd={() => {
                    setEditing(null);
                    setFormOpen(true);
                }}
                filter={filter}
                onFilter={setFilter}
                filterPlaceholder="Search by plate, name or make…"
                showing={
                    filter.trim()
                        ? `${shown.length} of ${trucks.length}`
                        : undefined
                }
            >
                <TableHeader>
                    <TableRow>
                        <TableHead>Truck</TableHead>
                        <TableHead>Make</TableHead>
                        <TableHead className="text-right">Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shown.length === 0 && (
                        <EmptyRow
                            colSpan={5}
                            icon={TruckIcon}
                            filtered={!!filter.trim()}
                            empty="No trucks yet."
                            noMatch="No truck matches that."
                        />
                    )}

                    {shown.map((truck) => (
                        <TableRow
                            key={truck.id}
                            className={cn(truck.status === "sold" && "opacity-60")}
                        >
                            <TableCell>
                                <div className="font-medium">{truck.plate_number}</div>
                                {truck.name && (
                                    <div className="text-xs text-muted-foreground">
                                        {truck.name}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {truck.make ?? "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {truck.capacity_tons != null
                                    ? `${numberFormat(truck.capacity_tons)} t`
                                    : "—"}
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={truck.status} />
                            </TableCell>
                            <TableCell>
                                <RowActions
                                    onEdit={() => {
                                        setEditing(truck);
                                        setFormOpen(true);
                                    }}
                                    onDelete={() => {
                                        setError(undefined);
                                        setDeleting(truck);
                                    }}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Register>

            <TruckFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                truck={editing}
            />

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.plate_number ?? "this truck"}?`}
                description="If it has simply been sold or is off the road, mark it that way instead — deleting takes it out of the register entirely."
                processing={processing}
                error={error}
                onConfirm={confirmDelete}
            />
        </>
    );
}

function StatusBadge({ status }: { status: Truck["status"] }) {
    if (status === "active") {
        return (
            <Badge className="border-transparent bg-emerald-600 text-white hover:bg-emerald-600/90">
                {TRUCK_STATUS_LABELS.active}
            </Badge>
        );
    }
    if (status === "in_repair") {
        return (
            <Badge className="border-transparent bg-amber-500 text-white hover:bg-amber-500/90">
                {TRUCK_STATUS_LABELS.in_repair}
            </Badge>
        );
    }
    return <Badge variant="outline">{TRUCK_STATUS_LABELS.sold}</Badge>;
}
