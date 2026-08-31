import { PageProps } from "@/types";
import { router, usePage } from "@inertiajs/react";
import { Store, Truck } from "lucide-react";

/**
 * Moves between the shop and the haulage business.
 *
 * Hidden entirely for anyone who only has the shop, which is everyone bar the
 * one admin who runs both — no dead control, no hint of a system they don't have.
 */
export function WorkspaceSwitcher() {
    const { auth } = usePage<PageProps>().props;

    if (!auth.hasLogistics) return null;

    const go = (workspace: "shop" | "logistics") => {
        if (workspace === auth.workspace) return;
        router.post(
            route("workspace.switch"),
            { workspace },
            { preserveState: false }
        );
    };

    return (
        <div className="hidden sm:flex h-9 items-center gap-0.5 rounded-md border border-input bg-background p-0.5">
            <Tab
                label="Shop"
                icon={Store}
                active={auth.workspace === "shop"}
                onClick={() => go("shop")}
            />
            <Tab
                label="Logistics"
                icon={Truck}
                active={auth.workspace === "logistics"}
                onClick={() => go("logistics")}
            />
        </div>
    );
}

function Tab({
    label,
    icon: Icon,
    active,
    onClick,
}: {
    label: string;
    icon: typeof Store;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-current={active ? "true" : undefined}
            className={`flex h-8 items-center gap-1.5 rounded px-2.5 text-sm transition-colors ${
                active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
            }`}
        >
            <Icon className="size-4 shrink-0" />
            <span>{label}</span>
        </button>
    );
}
