import { useEffect, useState } from "react";
import axios from "axios";
import { Pie, PieChart, Sector } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  quantity: {
    label: "Quantity",
  },
};

export function TopSellingProductsPieChart() {
  const [chartData, setChartData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    axios.get(route('reports.charts.top-products')).then(res => {
        setChartData(res.data);
    });
  }, []);

  if (chartData.length === 0) {
    return (
        <Card>
            <CardHeader><CardTitle>Top Selling Products</CardTitle><CardDescription>By quantity sold</CardDescription></CardHeader>
            <CardContent className="h-80 flex items-center justify-center"><p>No sales data available.</p></CardContent>
        </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Top 5 Selling Products</CardTitle>
            <CardDescription>By quantity sold all time</CardDescription>
        </CardHeader>
        <CardContent className="h-80 -mt-4">
            <ChartContainer config={chartConfig}>
            <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                    data={chartData}
                    dataKey="quantity"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                    activeIndex={activeIndex}
                    activeShape={({ outerRadius = 0, ...props }) => (
                        <g>
                            <Sector {...props} outerRadius={outerRadius + 10} />
                            <Sector {...props} outerRadius={outerRadius} stroke="hsl(var(--primary))" />
                        </g>
                    )}
                    onMouseOver={(_, index) => setActiveIndex(index)}
                />
            </PieChart>
            </ChartContainer>
        </CardContent>
    </Card>
  );
}