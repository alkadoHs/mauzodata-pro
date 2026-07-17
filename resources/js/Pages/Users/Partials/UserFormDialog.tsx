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
import { Branch } from "@/lib/schemas";
import { User } from "@/types";
import { useForm } from "@inertiajs/react";
import { FormEventHandler, useEffect } from "react";
import { toast } from "sonner";

/** Only an admin may grant `admin` — mirrors User::assignableRoles(). */
const ROLES = [
    { value: "admin", label: "Admin", hint: "Full access, incl. authorization keys", adminOnly: true },
    { value: "manager", label: "Manager", hint: "Can switch branches; no authorization keys" },
    { value: "seller", label: "Seller", hint: "Locked to their own branch" },
];

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branches: Branch[];
    /** Present = edit mode; absent = create mode. */
    user?: User | null;
    /** The signed-in user — decides which roles may be granted. */
    actor: User;
};

export function UserFormDialog({ open, onOpenChange, branches, user, actor }: Props) {
    const editing = !!user;
    const roles = ROLES.filter((r) => !r.adminOnly || actor.role === "admin");

    const { data, setData, errors, post, patch, processing, reset, clearErrors } =
        useForm({
            name: "",
            email: "",
            phone: "",
            role: "",
            branch_id: "",
            password: "",
        });

    useEffect(() => {
        if (!open) return;
        clearErrors();
        setData({
            name: user?.name ?? "",
            email: user?.email ?? "",
            phone: user?.phone ?? "",
            role: user?.role ?? "",
            branch_id: user?.branch_id ? String(user.branch_id) : "",
            password: "",
        });
    }, [open, user]);

    const done = (message: string) => {
        toast.success(message);
        reset();
        onOpenChange(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editing) {
            patch(route("users.update", user!.id), {
                preserveScroll: true,
                onSuccess: () => done("Employee updated"),
            });
        } else {
            post(route("users.store"), {
                preserveScroll: true,
                onSuccess: () => done("Employee created"),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? "Edit employee" : "Add employee"}
                    </DialogTitle>
                    <DialogDescription>
                        {editing
                            ? "Update this employee's details and access."
                            : "Create a login for a member of your team."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Full name"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                placeholder="name@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone *</Label>
                            <Input
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setData("phone", e.target.value)}
                                placeholder="07xxxxxxxx"
                            />
                            <InputError message={errors.phone} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={data.role}
                                onValueChange={(v) => setData("role", v)}
                            >
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.value}
                                            value={role.value}
                                        >
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {ROLES.find((r) => r.value === data.role)?.hint ??
                                    "Controls what they can see and do."}
                            </p>
                            <InputError message={errors.role} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="branch_id">Branch *</Label>
                            <Select
                                value={data.branch_id}
                                onValueChange={(v) => setData("branch_id", v)}
                            >
                                <SelectTrigger id="branch_id">
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={String(branch.id)}
                                        >
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.branch_id} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password">
                            {editing ? "New password" : "Password *"}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData("password", e.target.value)}
                            placeholder={
                                editing ? "Leave blank to keep current" : "Min. 6 characters"
                            }
                        />
                        <InputError message={errors.password} />
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
                                  : "Create employee"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
