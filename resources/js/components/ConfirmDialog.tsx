import { ReactNode, useEffect, useState } from "react";
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
import { AlertTriangle } from "lucide-react";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: ReactNode;
    /** Extra detail (e.g. an impact list) rendered above the confirm control. */
    children?: ReactNode;
    confirmLabel?: string;
    processing?: boolean;
    onConfirm: () => void;
    /**
     * When set, the user must type this exact text (case-insensitive) before the
     * confirm button unlocks. Use for genuinely destructive, cascading deletes.
     */
    confirmText?: string;
    error?: string;
};

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    confirmLabel = "Delete",
    processing = false,
    onConfirm,
    confirmText,
    error,
}: Props) {
    const [typed, setTyped] = useState("");

    // Reset the typed guard whenever the dialog is reopened.
    useEffect(() => {
        if (open) setTyped("");
    }, [open]);

    const locked =
        !!confirmText && typed.trim().toLowerCase() !== confirmText.trim().toLowerCase();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertTriangle className="size-5" />
                        </span>
                        <div className="space-y-1">
                            <DialogTitle>{title}</DialogTitle>
                            <DialogDescription>{description}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {children}

                {confirmText && (
                    <div className="space-y-2">
                        <Label htmlFor="confirm_name">
                            Type <b className="text-foreground">{confirmText}</b> to confirm
                        </Label>
                        <Input
                            id="confirm_name"
                            value={typed}
                            autoComplete="off"
                            onChange={(e) => setTyped(e.target.value)}
                            placeholder={confirmText}
                        />
                    </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={processing || locked}
                    >
                        {processing ? "Working…" : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
