import { Badge } from "@/components/ui/badge";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { cn, numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowRight,
    Coins,
    Contact,
    Route as RouteIcon,
    Truck,
    Users2,
    Wallet,
} from "lucide-react";
import { Figure } from "./partials/Figure";
import { Trend, TrendMonth } from "./partials/Trend";
import { StatusBadge } from "./Trips";
import { TripStatus } from "./partials/types";

type Fleet = {
    trucks_active: number;
    trucks_in_repair: number;
    trucks_total: number;
    drivers: number;
    clients: number;
};

type OnRoad = {
    id: number;
    reference: string;
    origin: string;
    destination: string;
    truck: string | null;
    driver: string | null;
    client: string | null;
    dispatched_at: string | null;
    days_out: number | null;
};

type Recent = {
    id: number;
    reference: string;
    origin: string;
    destination: string;
    client: string | null;
    truck: string | null;
    status: TripStatus;
    dispatched_at: string | null;
    margin: number;
};

type Props = {
    started: boolean;
    fleet: Fleet;
    month?: TrendMonth & {
        trip_expenses: number;
        trip_margin: number;
        running_costs: number;
        cash_in: number;
    };
    trend?: TrendMonth[];
    onRoad?: OnRoad[];
    recent?: Recent[];
    owed?: { total: number; trips: number };
};

/**
 * The front door of the haulage business.
 *
 * How are we doing this month, what is out on the road, and who owes us — in
 * that order, because that is the order they get asked.
 */
export default function Home({ auth, ...props }: PageProps<Props>) {
    return (
        <Authenticated user={auth.user}>
            <Head title="Logistics" />

            {props.started ? <Dashboard {...props} /> : <GettingStarted fleet={props.fleet} />}
        </Authenticated>
    );
}

function Dashboard({ month, trend, onRoad, recent, owed, fleet }: Props) {
    if (!month || !trend || !onRoad || !recent || !owed) return null;

    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
                    <p className="text-sm text-muted-foreground">
                        This month so far — {numberFormat(month.trips)} trip(s) run.
                    </p>
                </div>
                <Link
                    href={route("logistics.trips.index")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Record a trip <ArrowRight className="size-4" />
                </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Figure
                    label="Net profit"
                    value={month.net_profit}
                    hint="this month, after everything"
                    tone={month.net_profit >= 0 ? "in" : "out"}
                    emphasis
                />
                <Figure label="Freight earned" value={month.freight} hint="this month" />
                <Figure
                    label="Costs"
                    value={month.trip_expenses + month.running_costs}
                    hint="trips and running costs"
                    tone="out"
                />
                <Figure
                    label="Still owed"
                    value={owed.total}
                    hint={
                        owed.trips > 0
                            ? `across ${numberFormat(owed.trips)} trip(s), all time`
                            : "everything is settled"
                    }
                    tone={owed.total > 0 ? "out" : undefined}
                />
            </div>

            <Trend months={trend} />

            <div className="grid gap-4 lg:grid-cols-2">
                <Panel
                    title="On the road"
                    subtitle={
                        onRoad.length
                            ? `${numberFormat(onRoad.length)} truck(s) out now`
                            : "Nothing out at the moment"
                    }
                    icon={Truck}
                >
                    {onRoad.length === 0 ? (
                        <Empty>Every trip is delivered or cancelled.</Empty>
                    ) : (
                        <ul className="divide-y">
                            {onRoad.map((trip) => (
                                <li key={trip.id}>
                                    <Link
                                        href={route("logistics.trips.show", trip.id)}
                                        className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">
                                                {trip.origin} → {trip.destination}
                                            </div>
                                            <div className="truncate text-xs text-muted-foreground">
                                                {[trip.truck, trip.driver, trip.client]
                                                    .filter(Boolean)
                                                    .join(" · ")}
                                            </div>
                                        </div>
                                        <DaysOut days={trip.days_out} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel title="Recent trips" subtitle="What the last journeys made" icon={RouteIcon}>
                    <ul className="divide-y">
                        {recent.map((trip) => (
                            <li key={trip.id}>
                                <Link
                                    href={route("logistics.trips.show", trip.id)}
                                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">
                                            {trip.origin} → {trip.destination}
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            {trip.dispatched_at}
                                            {trip.client ? ` · ${trip.client}` : ""}
                                        </div>
                                    </div>
                                    {trip.status === "cancelled" ? (
                                        <StatusBadge status={trip.status} />
                                    ) : (
                                        <span
                                            className={cn(
                                                "shrink-0 text-sm font-medium tabular-nums",
                                                trip.margin >= 0
                                                    ? "text-emerald-700 dark:text-emerald-400"
                                                    : "text-red-700 dark:text-red-400"
                                            )}
                                        >
                                            {numberFormat(trip.margin)}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Panel>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 text-sm">
                <span className="text-muted-foreground">Fleet:</span>
                <Badge variant="secondary">
                    {numberFormat(fleet.trucks_active)} truck(s) active
                </Badge>
                {fleet.trucks_in_repair > 0 && (
                    <Badge className="border-transparent bg-amber-500 text-white hover:bg-amber-500/90">
                        {numberFormat(fleet.trucks_in_repair)} in repair
                    </Badge>
                )}
                <Badge variant="secondary">{numberFormat(fleet.drivers)} driver(s)</Badge>
                <Badge variant="secondary">{numberFormat(fleet.clients)} client(s)</Badge>
                <Link
                    href={route("logistics.profit")}
                    className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                    Full profit report <ArrowRight className="size-3.5" />
                </Link>
            </div>
        </section>
    );
}

/**
 * Shown until the first trip exists.
 *
 * A wall of zeroes would tell a new user only that the system is empty, which
 * they already know — this tells them where to start instead.
 */
function GettingStarted({ fleet }: { fleet: Fleet }) {
    const steps = [
        {
            href: "logistics.trucks.index",
            icon: Truck,
            title: "Add your trucks",
            body: "The fleet, and what each lorry can carry.",
            done: fleet.trucks_total > 0,
        },
        {
            href: "logistics.clients.index",
            icon: Users2,
            title: "Add your clients",
            body: "The people whose mizigo you carry.",
            done: fleet.clients > 0,
        },
        {
            href: "logistics.drivers.index",
            icon: Contact,
            title: "Add your drivers",
            body: "Who takes the trucks out. Optional — a trip can wait for one.",
            done: fleet.drivers > 0,
        },
        {
            href: "logistics.trips.index",
            icon: RouteIcon,
            title: "Record your first trip",
            body: "One journey, one job: the price agreed, then every cost against it.",
            done: false,
        },
    ];

    return (
        <section className="flex flex-col gap-6">
            <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-card to-card p-6">
                <span className="inline-flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Truck className="size-6" />
                </span>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight">Logistics</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Its own trucks, its own trips, its own money. Nothing here
                    touches the shop's sales, stock or reports, and nothing
                    there touches this. Record a trip and this page becomes your
                    overview.
                </p>
            </div>

            <div>
                <h2 className="text-sm font-medium">Getting started</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {steps.map((step) => (
                        <Link
                            key={step.href}
                            href={route(step.href)}
                            className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary hover:bg-accent"
                        >
                            <span className="flex items-center gap-2 font-medium">
                                <step.icon className="size-4 shrink-0 text-muted-foreground" />
                                {step.title}
                                {step.done && (
                                    <Badge variant="secondary" className="ml-auto">
                                        Done
                                    </Badge>
                                )}
                            </span>
                            <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <Link
                    href={route("logistics.running-costs.index")}
                    className="rounded-lg border border-dashed bg-card/50 p-4 transition-colors hover:border-primary"
                >
                    <span className="flex items-center gap-2 font-medium">
                        <Wallet className="size-4 shrink-0 text-muted-foreground" />
                        Running costs
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Insurance, licences, servicing, salaries — what the
                        business costs between journeys.
                    </p>
                </Link>
                <Link
                    href={route("logistics.profit")}
                    className="rounded-lg border border-dashed bg-card/50 p-4 transition-colors hover:border-primary"
                >
                    <span className="flex items-center gap-2 font-medium">
                        <Coins className="size-4 shrink-0 text-muted-foreground" />
                        Profit
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">
                        What the trips earned, what the running costs took, and
                        the net profit left over.
                    </p>
                </Link>
            </div>
        </section>
    );
}

function Panel({
    title,
    subtitle,
    icon: Icon,
    children,
}: {
    title: string;
    subtitle: string;
    icon: typeof Truck;
    children: React.ReactNode;
}) {
    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div className="border-b p-3">
                <h2 className="flex items-center gap-2 font-medium">
                    <Icon className="size-4 text-muted-foreground" />
                    {title}
                </h2>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            {children}
        </div>
    );
}

function Empty({ children }: { children: React.ReactNode }) {
    return <p className="p-8 text-center text-sm text-muted-foreground">{children}</p>;
}

function DaysOut({ days }: { days: number | null }) {
    if (days === null) return null;

    return (
        <span
            className={cn(
                "shrink-0 text-xs tabular-nums",
                days >= 7 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
            )}
        >
            {days === 0 ? "today" : days === 1 ? "1 day out" : `${days} days out`}
        </span>
    );
}
