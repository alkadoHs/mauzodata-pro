import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import InputError from "@/Components/InputError";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import { FormEventHandler, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, KeyRound, Plus, Trash2, TriangleAlert } from "lucide-react";

type KeyRow = {
    id: number;
    name: string;
    hint: string;
    abilities: string[];
    single_use: boolean;
    expires_at: string | null;
    used_at: string | null;
    used_by: string | null;
    created_by: string | null;
    created_at: string | null;
    status: "active" | "used" | "expired";
};

const statusClass = (s: KeyRow["status"]) =>
    s === "active"
        ? "bg-accent text-accent-foreground"
        : s === "used"
          ? "bg-muted text-muted-foreground"
          : "bg-destructive/10 text-destructive";

export default function AuthorizationKeys({
    auth,
    keys,
    abilities,
}: PageProps<{ keys: KeyRow[]; abilities: Record<string, string> }>) {
    const { auth: shared } = usePage<PageProps>().props;
    const [createOpen, setCreateOpen] = useState(false);
    const [deleting, setDeleting] = useState<KeyRow | null>(null);
    const [processing, setProcessing] = useState(false);
    const [copied, setCopied] = useState(false);

    // The server flashes the plaintext exactly once, right after creation.
    const newKey = (shared as any)?.newKey as { name: string; key: string } | null;
    const [revealed, setRevealed] = useState<{ name: string; key: string } | null>(null);

    useEffect(() => {
        if (newKey) {
            setRevealed(newKey);
            setCopied(false);
        }
    }, [newKey?.key]);

    const form = useForm<{
        name: string;
        abilities: string[];
        single_use: boolean;
        expires_at: string;
    }>({ name: "", abilities: [], single_use: false, expires_at: "" });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route("authorization-keys.store"), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setCreateOpen(false);
            },
        });
    };

    const toggleAbility = (key: string) =>
        form.setData(
            "abilities",
            form.data.abilities.includes(key)
                ? form.data.abilities.filter((a) => a !== key)
                : [...form.data.abilities, key]
        );

    const confirmDelete = () => {
        if (!deleting) return;
        setProcessing(true);
        router.delete(route("authorization-keys.destroy", deleting.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Key revoked");
                setDeleting(null);
            },
            onFinish: () => setProcessing(false),
        });
    };

    const activeCount = keys.filter((k) => k.status === "active").length;

    return (
        <Authenticated user={auth.user}>
            <Head title="Authorization keys" />

            <section className="space-y-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Authorization keys
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Keys staff must enter to edit or delete a product.
                        </p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)} className="gap-2">
                        <Plus className="size-4" /> New key
                    </Button>
                </header>

                {activeCount === 0 && (
                    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
                        <div className="text-sm">
                            <p className="font-medium text-destructive">
                                No active keys — nobody can edit or delete products
                            </p>
                            <p className="text-muted-foreground">
                                Those actions now require a key. Create one to unlock
                                them.
                            </p>
                        </div>
                    </div>
                )}

                <div className="rounded-xl border border-border bg-card">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Key</TableHead>
                                    <TableHead>Can do</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last used</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {keys.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-28 text-center text-muted-foreground"
                                        >
                                            <span className="flex flex-col items-center gap-2">
                                                <KeyRound className="size-6 opacity-50" />
                                                No keys yet.
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    keys.map((k) => (
                                        <TableRow key={k.id}>
                                            <TableCell className="font-medium">
                                                {k.name}
                                                <span className="block text-xs font-normal text-muted-foreground">
                                                    by {k.created_by ?? "—"} ·{" "}
                                                    {k.created_at}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-mono text-muted-foreground">
                                                ••••{k.hint}
                                            </TableCell>
                                            <TableCell>
                                                <span className="flex flex-wrap gap-1">
                                                    {k.abilities.map((a) => (
                                                        <Badge key={a} variant="secondary">
                                                            {abilities[a] ?? a}
                                                        </Badge>
                                                    ))}
                                                </span>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-sm">
                                                {k.single_use ? "One-time" : "Reusable"}
                                                {k.expires_at && (
                                                    <span className="block text-xs text-muted-foreground">
                                                        until {k.expires_at}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={cn(
                                                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                                                        statusClass(k.status)
                                                    )}
                                                >
                                                    {k.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                                {k.used_at ? (
                                                    <>
                                                        {k.used_at}
                                                        <span className="block text-xs">
                                                            by {k.used_by ?? "—"}
                                                        </span>
                                                    </>
                                                ) : (
                                                    "—"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive"
                                                    aria-label={`Revoke ${k.name}`}
                                                    onClick={() => setDeleting(k)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    Keys are stored hashed — they can't be looked up later, only
                    revoked and replaced. Write it down when you create it.
                </p>
            </section>

            {/* Create */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>New authorization key</DialogTitle>
                        <DialogDescription>
                            You'll see the key once, right after creating it.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="key-name">Name *</Label>
                            <Input
                                id="key-name"
                                value={form.data.name}
                                onChange={(e) => form.setData("name", e.target.value)}
                                placeholder="e.g. Shop floor key"
                                autoFocus
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label>This key can *</Label>
                            {Object.entries(abilities).map(([value, label]) => (
                                <label
                                    key={value}
                                    className="flex cursor-pointer items-center gap-2 text-sm"
                                >
                                    <Checkbox
                                        checked={form.data.abilities.includes(value)}
                                        onCheckedChange={() => toggleAbility(value)}
                                    />
                                    {label}
                                </label>
                            ))}
                            <InputError message={form.errors.abilities} />
                        </div>

                        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3 text-sm">
                            <Checkbox
                                className="mt-0.5"
                                checked={form.data.single_use}
                                onCheckedChange={(c) =>
                                    form.setData("single_use", c as boolean)
                                }
                            />
                            <span>
                                One-time key
                                <span className="block text-xs text-muted-foreground">
                                    Stops working after a single use. Leave off for a
                                    key staff can reuse.
                                </span>
                            </span>
                        </label>

                        <div className="space-y-1.5">
                            <Label htmlFor="expires_at">Expires on</Label>
                            <Input
                                id="expires_at"
                                type="date"
                                value={form.data.expires_at}
                                onChange={(e) =>
                                    form.setData("expires_at", e.target.value)
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Optional — leave blank for a key that never expires.
                            </p>
                            <InputError message={form.errors.expires_at} />
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateOpen(false)}
                                disabled={form.processing}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? "Creating…" : "Create key"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Show-once reveal */}
            <Dialog
                open={!!revealed}
                onOpenChange={(o) => !o && setRevealed(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Copy this key now</DialogTitle>
                        <DialogDescription>
                            This is the only time it will be shown. It's stored hashed,
                            so it can't be recovered later.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label>{revealed?.name}</Label>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-center font-mono text-lg tracking-[0.3em]">
                                {revealed?.key}
                            </code>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Copy key"
                                onClick={() => {
                                    navigator.clipboard?.writeText(revealed?.key ?? "");
                                    setCopied(true);
                                    toast.success("Key copied");
                                }}
                            >
                                {copied ? (
                                    <Check className="size-4" />
                                ) : (
                                    <Copy className="size-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setRevealed(null)}>
                            I've saved it
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(o) => !o && setDeleting(null)}
                title={`Revoke ${deleting?.name ?? "key"}?`}
                description="Anyone using this key will immediately lose access. This cannot be undone."
                confirmLabel="Revoke key"
                processing={processing}
                onConfirm={confirmDelete}
            />
        </Authenticated>
    );
}
