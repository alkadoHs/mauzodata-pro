import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PageProps } from "@/types";
import { router } from "@inertiajs/react";
import { Users2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PersonFormDialog } from "./partials/PersonFormDialog";
import { EmptyRow, Register, RowActions } from "./partials/Register";
import { Client } from "./partials/types";

export default function Clients({ auth, clients }: PageProps<{ clients: Client[] }>) {
    const [filter, setFilter] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Client | null>(null);
    const [deleting, setDeleting] = useState<Client | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const shown = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return clients;
        return clients.filter((c) =>
            [c.name, c.phone, c.notes]
                .filter(Boolean)
                .some((v) => v!.toLowerCase().includes(q))
        );
    }, [clients, filter]);

    const confirmDelete = () => {
        if (!deleting) return;
        setProcessing(true);
        setError(undefined);
        router.delete(route("logistics.clients.destroy", deleting.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Client removed");
                setDeleting(null);
            },
            onError: () => setError("Could not remove this client."),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Register
                user={auth.user}
                title="Clients"
                description="The people whose mizigo you carry. Kept separate from the shop's customers."
                addLabel="Add client"
                onAdd={() => {
                    setEditing(null);
                    setFormOpen(true);
                }}
                filter={filter}
                onFilter={setFilter}
                filterPlaceholder="Search by name or phone…"
                showing={
                    filter.trim() ? `${shown.length} of ${clients.length}` : undefined
                }
            >
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shown.length === 0 && (
                        <EmptyRow
                            colSpan={4}
                            icon={Users2}
                            filtered={!!filter.trim()}
                            empty="No clients yet."
                            noMatch="No client matches that."
                        />
                    )}

                    {shown.map((client) => (
                        <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {client.phone ?? "—"}
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                                {client.notes ?? "—"}
                            </TableCell>
                            <TableCell>
                                <RowActions
                                    onEdit={() => {
                                        setEditing(client);
                                        setFormOpen(true);
                                    }}
                                    onDelete={() => {
                                        setError(undefined);
                                        setDeleting(client);
                                    }}
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
                kind="client"
                routes={{
                    store: "logistics.clients.store",
                    update: "logistics.clients.update",
                }}
                namePlaceholder="e.g. Mama Neema, Kampuni ya Mbegu"
                description="Somebody who hires a truck. This list is the haulage business's own — it does not touch the shop's customers."
            />

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.name ?? "this client"}?`}
                description="They will no longer appear when recording a trip."
                processing={processing}
                error={error}
                onConfirm={confirmDelete}
            />
        </>
    );
}
