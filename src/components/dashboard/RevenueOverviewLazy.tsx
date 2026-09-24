"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import type { RevenueDataPoint } from "./RevenueOverview";
import dynamic from "next/dynamic";

const RevenueOverview = dynamic(
  () => import("./RevenueOverview").then((mod) => mod.RevenueOverview),
  {
    ssr: false,
    loading: () => (
      <Card className="h-full rounded-2xl">
        <CardHeader className="pb-2">
          <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-70 w-full animate-pulse rounded-xl bg-muted" />
        </CardContent>
      </Card>
    ),
  },
);

export function RevenueOverviewLazy({
  data,
  currency,
}: {
  data: RevenueDataPoint[];
  currency: string;
}) {
  return <RevenueOverview data={data} currency={currency} />;
}
