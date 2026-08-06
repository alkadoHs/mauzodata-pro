import { cn } from "@/lib/utils";

/**
 * A plain on/off switch.
 *
 * Hand-rolled rather than pulled from Radix: it is a button with
 * `role="switch"`, which is all the accessibility this needs, and it saves
 * adding a dependency for one control.
 */
export function ToggleSwitch({
    checked,
    onChange,
    disabled = false,
    label,
    className,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    /** Read out to screen readers when there's no visible <label>. */
    label?: string;
    className?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                checked ? "bg-emerald-600" : "bg-input",
                className
            )}
        >
            <span
                className={cn(
                    "pointer-events-none block size-5 rounded-full bg-background shadow ring-0 transition-transform",
                    checked ? "translate-x-5" : "translate-x-0"
                )}
            />
        </button>
    );
}
