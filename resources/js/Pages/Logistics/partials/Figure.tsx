import { cn, numberFormat } from "@/lib/utils";

/** One money figure in a card — the unit the logistics screens are built from. */
export function Figure({
    label,
    value,
    hint,
    tone,
    emphasis,
}: {
    label: string;
    value: number;
    hint?: string;
    tone?: "in" | "out";
    /** The headline number on the screen, rather than one of its parts. */
    emphasis?: boolean;
}) {
    return (
        <div
            className={cn(
                "rounded-lg border bg-card p-3",
                emphasis && "border-primary/40 bg-primary/5"
            )}
        >
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div
                className={cn(
                    "font-semibold tabular-nums",
                    emphasis ? "text-2xl" : "text-xl",
                    tone === "in" && "text-emerald-700 dark:text-emerald-400",
                    tone === "out" && "text-red-700 dark:text-red-400"
                )}
            >
                {numberFormat(value)}
            </div>
            {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
        </div>
    );
}
