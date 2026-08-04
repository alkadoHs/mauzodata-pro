import { Button } from "@/components/ui/button";
import { PageProps } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import { Building2, Layers, LogOut, MapPin } from "lucide-react";
import { useState } from "react";

type BranchOption = {
    id: number;
    name: string;
    city: string | null;
    address: string | null;
    phone: string | null;
};

/**
 * Shown once per session to anyone who can work in more than one branch.
 * Deliberately outside the app layout: until a branch is picked, the sidebar
 * and its branch-scoped counts would be showing an arbitrary shop's numbers.
 */
export default function Choose({
    auth,
    branches,
    company,
}: PageProps<{ branches: BranchOption[]; company: string | null }>) {
    const [choosing, setChoosing] = useState<string | null>(null);

    const select = (value: string) => {
        setChoosing(value);
        router.post(
            route("branch.switch"),
            { branch_id: value },
            { preserveState: false, onFinish: () => setChoosing(null) }
        );
    };

    return (
        <>
            <Head title="Choose a branch" />

            <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 px-4 py-10">
                <div className="w-full max-w-2xl">
                    <header className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Which branch are you working in?
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Hello {auth.user.name}
                            {company ? ` — ${company}` : ""}. You have access to
                            more than one branch, so pick one to continue.
                            Everything you sell, spend and report on belongs to
                            the branch you choose.
                        </p>
                    </header>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {branches.map((branch) => {
                            const where = [branch.address, branch.city]
                                .filter(Boolean)
                                .join(", ");

                            return (
                                <button
                                    key={branch.id}
                                    type="button"
                                    disabled={choosing !== null}
                                    onClick={() => select(String(branch.id))}
                                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent disabled:opacity-60"
                                >
                                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <Building2 className="size-5" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium">
                                            {branch.name}
                                        </span>
                                        {where && (
                                            <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="size-3 shrink-0" />
                                                <span className="truncate">
                                                    {where}
                                                </span>
                                            </span>
                                        )}
                                        {choosing === String(branch.id) && (
                                            <span className="mt-1 block text-xs text-primary">
                                                Opening…
                                            </span>
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Company-wide view: reporting across every branch at once. */}
                    <button
                        type="button"
                        disabled={choosing !== null}
                        onClick={() => select("all")}
                        className="mt-3 flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-card/50 p-4 text-left transition-colors hover:border-primary hover:bg-accent disabled:opacity-60"
                    >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <Layers className="size-5" />
                        </span>
                        <span>
                            <span className="block font-medium">
                                All branches
                            </span>
                            <span className="text-xs text-muted-foreground">
                                See the whole company at once. New records are
                                saved to your own branch.
                            </span>
                        </span>
                    </button>

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        You can change branch at any time from the switcher at
                        the top of the page.
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
