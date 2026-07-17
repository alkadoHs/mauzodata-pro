import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from "@/Components/InputError";
import { KeyRound } from "lucide-react";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description: string;
    confirmLabel?: string;
    processing?: boolean;
    /** Server-side error for the authorization_key field. */
    error?: string;
    onConfirm: (key: string) => void;
};

/**
 * Asks for an authorization key before a critical action.
 *
 * The check itself is server-side (RequireAuthorizationKey middleware) — this is
 * only how the key gets collected. The old version compared against a constant
 * compiled into the bundle, which was no protection at all.
 */
export function KeyPromptDialog({
    open,
    onOpenChange,
    title = "Authorization required",
    description,
    confirmLabel = "Confirm",
    processing = false,
    error,
    onConfirm,
}: Props) {
    const [key, setKey] = useState("");

    useEffect(() => {
        if (open) setKey("");
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                            <KeyRound className="size-5" />
                        </span>
                        <div className="space-y-1">
                            <DialogTitle>{title}</DialogTitle>
                            <DialogDescription>{description}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onConfirm(key.trim());
                    }}
                    className="space-y-4"
                >
                    <div className="space-y-1.5">
                        <Label htmlFor="authorization_key">Authorization key</Label>
                        <Input
                            id="authorization_key"
                            value={key}
                            autoFocus
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="XXXXXXXX"
                            className="text-center font-mono text-lg tracking-[0.3em] uppercase"
                            onChange={(e) => setKey(e.target.value.toUpperCase())}
                        />
                        <InputError message={error} />
                        <p className="text-xs text-muted-foreground">
                            Ask an admin for a key if you don't have one.
                        </p>
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
                        <Button type="submit" disabled={processing || key.trim() === ""}>
                            {processing ? "Checking…" : confirmLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
