import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { numberFormat } from "@/lib/utils";
import { DollarSign, ShoppingCart, BarChart, TrendingUp, TrendingDown, HandCoins, AlertCircle, Banknote } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis } from "recharts";
import { Heading4 } from "@/components/Typography/Heading4";
import { DashboardDateFilter } from "@/components/DashboardDateFilter";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";


type KpiProps = {
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
    salesChartData: {
        date: string;
        sales: number;
        profit: number;
    }[];
    filters: {
        start_date?: string;
        end_date?: string;
    }
};

const chartConfig = {
    sales: {
        label: "Sales",
        color: "hsl(var(--chart-1))",
    },
    profit: {
        label: "Profit",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig;

export default function Dashboard({ auth, kpis, salesChartData, filters }: PageProps<KpiProps>) {
    
    const isAdmin = auth.user.role === 'admin';
    const filterTitle = filters.start_date && filters.end_date ? `Performance for ${filters.start_date} to ${filters.end_date}` : "Today's Performance";

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Dashboard" />

            <div className="flex justify-between items-center mb-4">
                <Heading4>Dashboard</Heading4>
                {isAdmin && <DashboardDateFilter filters={filters} />}
            </div>

            <div className="space-y-6">
                {/* User-specific KPIs */}
                <Heading4>{isAdmin ? "Your Performance" : "Today's Performance"}</Heading4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Your Sales</CardTitle><ShoppingCart className="size-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{numberFormat(kpis.mySales)}</div><p className="text-xs text-muted-foreground">Total cash & credit sales made.</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Credit Received</CardTitle><HandCoins className="size-5 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{numberFormat(kpis.myCreditReceived)}</div><p className="text-xs text-muted-foreground">Payments received for credit sales.</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Your Expenses</CardTitle><TrendingDown className="size-5 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{numberFormat(kpis.myExpenses)}</div><p className="text-xs text-muted-foreground">Your logged expenses.</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">My Outstanding Debt</CardTitle><AlertCircle className="size-5 text-orange-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{numberFormat(kpis.myOutstandingDebt)}</div><p className="text-xs text-muted-foreground">Total debt owed from your credit sales.</p></CardContent></Card>
                </div>

                {/* Admin-specific Section */}
                {isAdmin && (
                    <div className="space-y-6">
                        <Heading4>Branch Overview</Heading4>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                             <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Branch Sales</CardTitle><DollarSign className="size-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{numberFormat(kpis.branchSales)}</div></CardContent></Card>
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Est. Profit</CardTitle><TrendingUp className="size-5 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{numberFormat(kpis.branchProfit)}</div></CardContent></Card>
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Expenses</CardTitle><Banknote className="size-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{numberFormat(kpis.branchExpenses)}</div></CardContent></Card>
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Outstanding Debt</CardTitle><AlertCircle className="size-5 text-orange-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{numberFormat(kpis.totalDebt)}</div></CardContent></Card>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Branch Performance</CardTitle>
                                <CardDescription>{filterTitle}</CardDescription>
                            </CardHeader>
                            <CardContent className="h-96 -ml-6">
                                <ChartContainer config={chartConfig} className="w-full h-full">
                                    <RechartsBarChart accessibilityLayer data={salesChartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} stroke="hsl(var(--muted-foreground))"/>
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                                        <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
                                    </RechartsBarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}