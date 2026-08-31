import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import { Coins, Route, Truck, Users } from "lucide-react";

/**
 * The front door of the haulage business.
 *
 * Deliberately honest while the system is being built: it says what is here
 * and what is coming rather than showing empty cards that look like a
 * business with no work in it.
 */
export default function Home({ auth }: PageProps) {
    return (
        <Authenticated user={auth.user}>
            <Head title="Logistics" />

            <section className="flex flex-col gap-6">
                <div className="rounded-xl border bg-gradient-to-br from-amber-500/10 via-card to-card p-6">
                    <span className="inline-flex size-11 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <Truck className="size-6" />
                    </span>
                    <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                        Logistics
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Its own trucks, its own trips, its own money. Nothing
                        here touches the shop's sales, stock or reports, and
                        nothing there touches this.
                    </p>
                </div>

                <div>
                    <h2 className="text-sm font-medium">Being built</h2>
                    <p className="text-sm text-muted-foreground">
                        Each piece arrives ready to use — you can start
                        recording as soon as it lands.
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Coming
                            icon={Truck}
                            title="Trucks & drivers"
                            body="The fleet, and who drives it."
                        />
                        <Coming
                            icon={Users}
                            title="Clients"
                            body="The people whose mizigo you carry."
                        />
                        <Coming
                            icon={Route}
                            title="Trips"
                            body="One journey, one job: the price agreed, and every cost against it — mafuta, kupakia, kushusha, posho."
                        />
                        <Coming
                            icon={Coins}
                            title="Profit report"
                            body="What each trip earned, what the running costs took, and the net profit left."
                        />
                    </div>
                </div>
            </section>
        </Authenticated>
    );
}

function Coming({
    icon: Icon,
    title,
    body,
}: {
    icon: typeof Truck;
    title: string;
    body: string;
}) {
    return (
        <div className="rounded-lg border border-dashed bg-card/50 p-4">
            <span className="flex items-center gap-2 font-medium">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                {title}
            </span>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
    );
}
