"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Revenue = { name: string; revenue: number };
type Stage = { name: string; count: number; color: string };
type InvoiceStatus = { name: string; value: number; key: string };
type ClientRevenue = { name: string; revenue: number };

type Labels = {
  revenueOverTime: string;
  dealConversion: string;
  winLoss: string;
  invoiceBreakdown: string;
  revenueByContact: string;
  taskCompletion: string;
  noData: string;
  winRate: string;
  won: string;
  lost: string;
  avgDealSize: string;
  allTasks: string;
};

export function AnalyticsCharts({
  locale,
  revenue,
  stages,
  invoiceStatus,
  clientRevenue,
  taskRate,
  avgDeal,
  won,
  lost,
  currency,
  labels,
}: {
  locale: "en" | "ar";
  revenue: Revenue[];
  stages: Stage[];
  invoiceStatus: InvoiceStatus[];
  clientRevenue: ClientRevenue[];
  taskRate: number | null;
  avgDeal: number;
  won: number;
  lost: number;
  currency: string;
  labels: Labels;
}) {
  const statusColors = [
    "var(--color-success)",
    "var(--color-secondary)",
    "var(--color-danger)",
    "var(--color-text-muted)",
    "var(--color-text-muted)",
  ];
  const totalClosed = won + lost;
  const winRate = totalClosed ? Math.round((won / totalClosed) * 100) : null;
  const numberFormat = new Intl.NumberFormat(
    locale === "ar" ? "ar-EG" : "en-US",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    },
  );

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{labels.revenueOverTime}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {revenue.every((item) => item.revenue === 0) ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {labels.noData}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenue} accessibilityLayer>
                  <CartesianGrid
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-primary-light)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{labels.dealConversion}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {stages.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stages} accessibilityLayer>
                  <CartesianGrid
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis dataKey="name" hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    fill="var(--color-primary)"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {labels.noData}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{labels.winLoss}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-72 items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-semibold text-primary">
                {winRate === null ? "-" : `${winRate}%`}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {labels.winRate}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                {labels.won}:{" "}
                <span className="font-semibold text-success">{won}</span> ·{" "}
                {labels.lost}:{" "}
                <span className="font-semibold text-danger">{lost}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{labels.invoiceBreakdown}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {invoiceStatus.some((item) => item.value) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart accessibilityLayer>
                  <Pie
                    data={invoiceStatus.filter((item) => item.value)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                  >
                    {invoiceStatus
                      .filter((item) => item.value)
                      .map((item, index) => (
                        <Cell
                          key={item.key}
                          fill={statusColors[index % statusColors.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {labels.noData}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{labels.revenueByContact}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {clientRevenue.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={clientRevenue}
                  layout="vertical"
                  accessibilityLayer
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    horizontal={false}
                  />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-accent)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {labels.noData}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{labels.taskCompletion}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-72 items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-semibold text-primary">
                {taskRate === null ? "-" : `${Math.round(taskRate)}%`}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {taskRate === null ? labels.noData : labels.allTasks}
              </p>
              <p className="mt-6 text-sm text-muted-foreground">
                {labels.avgDealSize}:{" "}
                <span className="font-semibold text-foreground">
                  {numberFormat.format(avgDeal)}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
