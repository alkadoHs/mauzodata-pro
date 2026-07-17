import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import { cn, numberFormat } from "@/lib/utils";
import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    Boxes,
    HandCoins,
    PackageX,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DashboardDateFilter } from "@/components/DashboardDateFilter";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { ReactNode } from "react";

type Trend = { percent: number; previous: number } | null;

type DashboardProps = {
    kpis: {
        mySales: number;
        myProfit: number;
        myExpenses: number;
        myCreditReceived: number;
        myOutstandingDebt: number;
        branchSales: number;
        branchProfit: number;
        branchExpenses: number;
        totalDebt: number;
        totalCapital: number;
    };
    trends: { sales?: Trend; profit?: Trend; expenses?: Trend };
    alerts: { lowStock: number; outOfStock: number };
    salesChartData: { date: string; sales: number; profit: number }[];
    filters: { start_date?: string; end_date?: string };
    branchLabel: string;
    isManager: boolean;
};

// Fixed order, never cycled. Both steps are validated against the card surface
// for CVD separation and >= 3:1 contrast (see --chart-1 / --chart-2 in app.css).
const chartConfig = {
    sales: { label: "Sales", color: "hsl(var(--chart-1))" },
    profit: { label: "Profit", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

/** Compact axis money: 1.2M / 45k */
const shortMoney = (v: number) =>
    Math.abs(v) >= 1_000_000
        ? `${(v / 1_000_000).toFixed(1)}M`
        : Math.abs(v) >= 1_000
          ? `${Math.round(v / 1_000)}k`
          : String(v);

function Delta({ trend, invert = false }: { trend?: Trend; invert?: boolean }) {
    if (!trend) return null;
    const up = trend.percent >= 0;
    // For expenses, "up" is bad — so the sentiment flips.
    const good = invert ? !up : up;
    const Icon = up ? ArrowUpRight : ArrowDownRight;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                good ? "text-accent-foreground" : "text-destructive"
            )}
        >
            <Icon className="size-3.5" />
            {Math.abs(trend.percent)}%
            <span className="font-normal text-muted-foreground">vs prev.</span>
        </span>
    );
}

function Stat({
    label,
    value,
    hint,
    icon: Icon,
    trend,
    invert,
}: {
    label: string;
    value: string;
    hint?: ReactNode;
    icon: typeof ShoppingCart;
    trend?: Trend;
    invert?: boolean;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <Icon className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
            <div className="mt-1 flex items-center gap-2">
                <Delta trend={trend} invert={invert} />
                {hint && (
                    <span className="text-xs text-muted-foreground">{hint}</span>
                )}
            </div>
        </div>
    );
}

export default function Dashboard({
    auth,
    kpis,
    trends,
    alerts,
    salesChartData,
    filters,
    branchLabel,
    isManager,
}: PageProps<DashboardProps>) {
    // Comes from the server (admin OR manager). Deriving it here from the role
    // missed managers entirely — they'd get the data but not the UI.
    const isAdmin = isManager;

    const ranged = !!(filters.start_date && filters.end_date);
    const periodLabel = ranged
        ? `${filters.start_date} → ${filters.end_date}`
        : "Today";

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Dashboard" />

            <section className="space-y-6">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            {branchLabel} · {periodLabel}
                        </p>
                    </div>
                    {isAdmin && <DashboardDateFilter filters={filters} />}
                </header>

                {/* Branch overview first — it's what a manager opens the page for. */}
                {isAdmin && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-medium text-muted-foreground">
                            Branch overview
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Stat
                                label="Sales"
                                value={numberFormat(kpis.branchSales)}
                                icon={ShoppingCart}
                                trend={trends?.sales}
                            />
                            <Stat
                                label="Est. profit"
                                value={numberFormat(kpis.branchProfit)}
                                icon={TrendingUp}
                                trend={trends?.profit}
                            />
                            <Stat
                                label="Expenses"
                                value={numberFormat(kpis.branchExpenses)}
                                icon={Banknote}
                                trend={trends?.expenses}
                                invert
                            />
                            <Stat
                                label="Outstanding debt"
                                value={numberFormat(kpis.totalDebt)}
                                icon={AlertCircle}
                                hint="owed on credit sales"
                            />
                        </div>

                        {/* Stock value & actionable alerts */}
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Stat
                                label="Stock value"
                                value={numberFormat(kpis.totalCapital)}
                                icon={Boxes}
                                hint="at buying price"
                            />
                            <Link
                                href={route("reports.outstock")}
                                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Low stock
                                    </span>
                                    <TrendingDown className="size-4 text-muted-foreground" />
                                </div>
                                <p
                                    className={cn(
                                        "mt-2 text-2xl font-semibold tabular-nums",
                                        alerts.lowStock > 0 && "text-destructive"
                                    )}
                                >
                                    {alerts.lowStock}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    below alert level — view report
                                </p>
                            </Link>
                            <Link
                                href={route("reports.zerostock")}
                                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Out of stock
                                    </span>
                                    <PackageX className="size-4 text-muted-foreground" />
                                </div>
                                <p
                                    className={cn(
                                        "mt-2 text-2xl font-semibold tabular-nums",
                                        alerts.outOfStock > 0 && "text-destructive"
                                    )}
                                >
                                    {alerts.outOfStock}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    nothing left to sell — view report
                                </p>
                            </Link>
                        </div>

                        <div className="rounded-xl border border-border bg-card">
                            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border p-4">
                                <h3 className="font-medium">Sales &amp; profit</h3>
                                <p className="text-xs text-muted-foreground">
                                    {periodLabel}
                                </p>
                            </div>
                            <div className="p-4">
                                {salesChartData.length === 0 ? (
                                    <p className="py-16 text-center text-sm text-muted-foreground">
                                        No sales in this period.
                                    </p>
                                ) : (
                                    <ChartContainer
                                        config={chartConfig}
                                        className="h-72 w-full"
                                    >
                                        <RechartsBarChart
                                            accessibilityLayer
                                            data={salesChartData}
                                        >
                                            {/* Recessive grid; horizontal only */}
                                            <CartesianGrid
                                                vertical={false}
                                                stroke="hsl(var(--border))"
                                            />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                            />
                                            {/* One axis — never a second scale */}
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                width={44}
                                                tickFormatter={shortMoney}
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                            />
                                            <ChartTooltip
                                                cursor={false}
                                                content={
                                                    <ChartTooltipContent indicator="dot" />
                                                }
                                            />
                                            <ChartLegend content={<ChartLegendContent />} />
                                            <Bar
                                                dataKey="sales"
                                                fill="var(--color-sales)"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="profit"
                                                fill="var(--color-profit)"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </RechartsBarChart>
                                    </ChartContainer>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Personal performance */}
                <div className="space-y-3">
                    <h2 className="text-sm font-medium text-muted-foreground">
                        {isAdmin ? "Your performance" : `Your performance · ${periodLabel}`}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Stat
                            label="Your sales"
                            value={numberFormat(kpis.mySales)}
                            icon={ShoppingCart}
                            hint="cash & credit"
                        />
                        {isAdmin && (
                            <Stat
                                label="Your profit"
                                value={numberFormat(kpis.myProfit)}
                                icon={TrendingUp}
                            />
                        )}
                        <Stat
                            label="Credit received"
                            value={numberFormat(kpis.myCreditReceived)}
                            icon={HandCoins}
                            hint="payments collected"
                        />
                        <Stat
                            label="Your expenses"
                            value={numberFormat(kpis.myExpenses)}
                            icon={TrendingDown}
                        />
                        <Stat
                            label="Owed to you"
                            value={numberFormat(kpis.myOutstandingDebt)}
                            icon={AlertCircle}
                            hint="from your credit sales"
                        />
                    </div>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}
