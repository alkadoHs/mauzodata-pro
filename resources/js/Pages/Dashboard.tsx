import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { numberFormat } from "@/lib/utils";
import { DollarSign, ShoppingCart, BarChart, TrendingUp, TrendingDown } from "lucide-react";
import { ResponsiveContainer, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { Heading4 } from "@/components/Typography/Heading4";

type KpiProps = {
    kpis: {
        myTodaysSales: number;
        myTodaysProfit: number;
        myTodaysExpenses: number;
        branchTodaysSales: number;
        totalCapital: number;
    };
    salesChartData: {
        date: string;
        sales: number;
    }[];
};

export default function Dashboard({ auth, kpis, salesChartData }: PageProps<KpiProps>) {
    
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* User-specific KPIs */}
                <Heading4>Your Performance Today</Heading4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                            <ShoppingCart className="size-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{numberFormat(kpis.myTodaysSales)}</div>
                            <p className="text-xs text-muted-foreground">Your total sales for today.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Profit</CardTitle>
                            <TrendingUp className="size-5 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{numberFormat(kpis.myTodaysProfit)}</div>
                            <p className="text-xs text-muted-foreground">Estimated profit from your sales.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
                            <TrendingDown className="size-5 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{numberFormat(kpis.myTodaysExpenses)}</div>
                             <p className="text-xs text-muted-foreground">Your logged expenses for today.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Admin-specific KPIs and Charts */}
                {auth.user.role === 'admin' && (
                    <div className="space-y-6">
                        <Heading4>Branch Overview</Heading4>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Branch Sales (Today)</CardTitle>
                                    <DollarSign className="size-5 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{numberFormat(kpis.branchTodaysSales)}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Inventory Value (Capital)</CardTitle>
                                    <BarChart className="size-5 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{numberFormat(kpis.totalCapital)}</div>
                                </CardContent>
                            </Card>
                        </div>

                         <Card>
                            <CardHeader>
                                <CardTitle>Sales - Last 7 Days</CardTitle>
                                <CardDescription>A summary of sales across the branch.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={salesChartData}>
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${numberFormat(value as number)}`}
                                        />
                                        <Tooltip
                                            cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}
                                            contentStyle={{ backgroundColor: 'black', border: '1px solid #333', color: 'white' }}
                                        />
                                        <Bar dataKey="sales" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}