import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

type Status = "pending" | "received" | "cancelled" | string;

/**
 * Status pill. Uses semantic tokens (not hardcoded greens) so it reads correctly
 * in both light and dark themes, and encodes state in an icon as well as colour.
 */
export function StatusBadge({ status }: { status: Status }) {
    const map: Record<
        string,
        { label: string; className: string; Icon: typeof Clock }
    > = {
        pending: {
            label: "Pending",
            className: "bg-secondary text-secondary-foreground",
            Icon: Clock,
        },
        received: {
            label: "Received",
            className: "bg-accent text-accent-foreground",
            Icon: CheckCircle2,
        },
        cancelled: {
            label: "Cancelled",
            className: "bg-destructive/10 text-destructive",
            Icon: XCircle,
        },
    };

    const { label, className, Icon } = map[status] ?? {
        label: status,
        className: "bg-muted text-muted-foreground",
        Icon: Clock,
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
                className
            )}
        >
            <Icon className="size-3.5" />
            {label}
        </span>
    );
}
