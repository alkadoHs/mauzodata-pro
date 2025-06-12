import { useEffect, useState } from "react";
import axios from "axios";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { numberFormat } from "@/lib/utils";


const chartConfig = {
  total: {
    label: "Total Cost",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function SupplierPurchasesBarChart() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    axios.get(route('reports.charts.supplier-purchases')).then(res => {
        setChartData(res.data);
    });
  }, []);

  if (chartData.length === 0) {
    return (
        <Card>
            <CardHeader><CardTitle>Top Suppliers</CardTitle><CardDescription>By purchase value</CardDescription></CardHeader>
            <CardContent className="h-80 flex items-center justify-center"><p>No purchase data available.</p></CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Suppliers</CardTitle>
        <CardDescription>By total purchase value</CardDescription>
      </CardHeader>
      <CardContent className="h-80 -mt-4">
        <ChartContainer config={chartConfig}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 30 }}
            accessibilityLayer
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 15)}
              className="text-xs"
            />
            <XAxis dataKey="total" type="number" hide />
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel indicator="line" />}
            />
            <Bar dataKey="total" layout="vertical" fill="var(--color-total)" radius={4}>
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}