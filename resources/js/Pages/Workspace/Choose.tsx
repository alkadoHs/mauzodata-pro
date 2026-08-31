import { PageProps } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowRight, LogOut, Store, Truck } from "lucide-react";
import { useState } from "react";

/**
 * Shown once per session to the admin who runs both businesses.
 *
 * Deliberately outside the app layout: the two systems have entirely
 * different menus, so until one is picked there is no sidebar to show.
 */
export default function Choose({
    auth,
    company,
}: PageProps<{ company: string | null }>) {
    const [opening, setOpening] = useState<string | null>(null);

    const select = (workspace: string) => {
        setOpening(workspace);
        router.post(
            route("workspace.switch"),
            { workspace },
            { preserveState: false, onFinish: () => setOpening(null) }
        );
    };

    return (
        <>
            <Head title="Choose a system" />

            <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 px-4 py-10">
                <div className="w-full max-w-3xl">
                    <header className="mb-8 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Karibu, {auth.user.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {company ? `${company} — which ` : "Which "}
                            business are you working on today?
                        </p>
                    </header>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Choice
                            title="Shop"
                            description="Sales, stock, customers, expenses and every report you already use."
                            icon={Store}
                            accent="text-sky-600 dark:text-sky-400"
                            ring="hover:border-sky-500"
                            bg="bg-sky-500/10"
                            busy={opening === "shop"}
                            disabled={opening !== null}
                            onClick={() => select("shop")}
                        />
                        <Choice
                            title="Logistics"
                            description="Trucks, trips and loads — what each journey earns after fuel, posho and every other cost."
                            icon={Truck}
                            accent="text-amber-600 dark:text-amber-400"
                            ring="hover:border-amber-500"
                            bg="bg-amber-500/10"
                            busy={opening === "logistics"}
                            disabled={opening !== null}
                            onClick={() => select("logistics")}
                        />
                    </div>

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        You can move between the two at any time from the
                        switcher at the top of the page — the shop and the
                        trucks keep their own separate records either way.
                    </p>

                    <div className="mt-4 text-center">
                        <Link
                            href={route("logout")}
                            method="post"
                            as="button"
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <LogOut className="size-3.5" /> Sign out
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

function Choice({
    title,
    description,
    icon: Icon,
    accent,
    ring,
    bg,
    busy,
    disabled,
    onClick,
}: {
    title: string;
    description: string;
    icon: typeof Store;
    accent: string;
    ring: string;
    bg: string;
    busy: boolean;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6 text-left transition-colors hover:bg-accent disabled:opacity-60 ${ring}`}
        >
            <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${bg} ${accent}`}
            >
                <Icon className="size-6" />
            </span>
            <span className="text-lg font-semibold">{title}</span>
            <span className="text-sm text-muted-foreground">{description}</span>
            <span
                className={`mt-1 inline-flex items-center gap-1 text-sm font-medium ${accent}`}
            >
                {busy ? "Opening…" : "Open"}
                {!busy && (
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                )}
            </span>
        </button>
    );
}
