import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PageProps } from "@/types";
import { router } from "@inertiajs/react";
import { Contact, Power } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PersonFormDialog } from "./partials/PersonFormDialog";
import { EmptyRow, Register, RowActions } from "./partials/Register";
import { Driver } from "./partials/types";

export default function Drivers({ auth, drivers }: PageProps<{ drivers: Driver[] }>) {
    const [filter, setFilter] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Driver | null>(null);
    const [deleting, setDeleting] = useState<Driver | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const shown = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return drivers;
        return drivers.filter((d) =>
            [d.name, d.phone, d.license_number, d.notes]
                .filter(Boolean)
                .some((v) => v!.toLowerCase().includes(q))
        );
    }, [drivers, filter]);

    const toggle = (driver: Driver) =>
        router.patch(
            route("logistics.drivers.toggle", driver.id),
            {},
            {
                preserveScroll: true,
                onError: () => toast.error("Could not update this driver."),
            }
        );

    const confirmDelete = () => {
        if (!deleting) return;
        setProcessing(true);
        setError(undefined);
        router.delete(route("logistics.drivers.destroy", deleting.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Driver removed");
                setDeleting(null);
            },
            onError: () => setError("Could not remove this driver."),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Register
                user={auth.user}
                title="Drivers"
                description="Who takes the trucks out."
                addLabel="Add driver"
                onAdd={() => {
                    setEditing(null);
                    setFormOpen(true);
                }}
                filter={filter}
                onFilter={setFilter}
                filterPlaceholder="Search by name, phone or licence…"
                showing={
                    filter.trim() ? `${shown.length} of ${drivers.length}` : undefined
                }
            >
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Licence</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shown.length === 0 && (
                        <EmptyRow
                            colSpan={5}
                            icon={Contact}
                            filtered={!!filter.trim()}
                            empty="No drivers yet."
                            noMatch="No driver matches that."
                        />
                    )}

                    {shown.map((driver) => (
                        <TableRow
                            key={driver.id}
                            className={cn(!driver.is_active && "opacity-60")}
                        >
                            <TableCell>
                                <div className="font-medium">{driver.name}</div>
                                {driver.notes && (
                                    <div className="max-w-xs truncate text-xs text-muted-foreground">
                                        {driver.notes}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {driver.phone ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {driver.license_number ?? "—"}
                            </TableCell>
                            <TableCell>
                                {driver.is_active ? (
                                    <Badge className="border-transparent bg-emerald-600 text-white hover:bg-emerald-600/90">
                                        Active
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">Retired</Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <RowActions
                                    onEdit={() => {
                                        setEditing(driver);
                                        setFormOpen(true);
                                    }}
                                    onDelete={() => {
                                        setError(undefined);
                                        setDeleting(driver);
                                    }}
                                    extra={
                                        <DropdownMenuItem
                                            onClick={() => toggle(driver)}
                                            className="gap-2"
                                        >
                                            <Power className="size-4" />
                                            {driver.is_active
                                                ? "Retire"
                                                : "Bring back"}
                                        </DropdownMenuItem>
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Register>

            <PersonFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                person={editing}
                kind="driver"
                withLicence
                routes={{
                    store: "logistics.drivers.store",
                    update: "logistics.drivers.update",
                }}
                namePlaceholder="e.g. Juma Hamisi"
                description="Drivers don't log in — this is just the list you pick from when sending a truck out."
            />

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.name ?? "this driver"}?`}
                description="If they have simply left, retire them instead — that keeps their name on the trips they actually drove."
                processing={processing}
                error={error}
                onConfirm={confirmDelete}
            />
        </>
    );
}
