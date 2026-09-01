import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { ArrowRight, Coins, Contact, Route, Truck, Users2 } from "lucide-react";

/**
 * The front door of the haulage business.
 *
 * Says what is here and what is still coming, rather than showing empty
 * figures that would read as a business with no work in it.
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
                    <Link
                        href={route("logistics.trips.index")}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Go to trips <ArrowRight className="size-4" />
                    </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Card
                        href="logistics.trips.index"
                        icon={Route}
                        title="Trips"
                        body="One journey, one job: the price agreed, and every cost against it — mafuta, kupakia, kushusha, posho."
                    />
                    <Card
                        href="logistics.trucks.index"
                        icon={Truck}
                        title="Trucks"
                        body="The fleet, and what each lorry can carry."
                    />
                    <Card
                        href="logistics.drivers.index"
                        icon={Contact}
                        title="Drivers"
                        body="Who takes the trucks out."
                    />
                    <Card
                        href="logistics.clients.index"
                        icon={Users2}
                        title="Clients"
                        body="The people whose mizigo you carry."
                    />
                    <div className="rounded-lg border border-dashed bg-card/50 p-4">
                        <span className="flex items-center gap-2 font-medium text-muted-foreground">
                            <Coins className="size-4 shrink-0" />
                            Profit report
                        </span>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Coming next: what the trips earned, what the running
                            costs took, and the net profit left over.
                        </p>
                    </div>
                </div>
            </section>
        </Authenticated>
    );
}

function Card({
    href,
    icon: Icon,
    title,
    body,
}: {
    href: string;
    icon: typeof Truck;
    title: string;
    body: string;
}) {
    return (
        <Link
            href={route(href)}
            className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary hover:bg-accent"
        >
            <span className="flex items-center gap-2 font-medium">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                {title}
                <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </Link>
    );
}
