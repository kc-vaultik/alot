import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminRevenue } from "../../hooks/data/useAdminDashboard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function RevenueChart() {
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useAdminRevenue(days);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  const formatCompact = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" }).format(value);

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-[250px] bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const revenueData = data?.revenueData ?? [];
  const totals = data?.totals;
  const tierBreakdown = data?.tierBreakdown ?? {};

  // Calculate comparison (first half vs second half of period)
  const midpoint = Math.floor(revenueData.length / 2);
  const firstHalf = revenueData.slice(0, midpoint).reduce((sum, d) => sum + d.totalRevenue, 0);
  const secondHalf = revenueData.slice(midpoint).reduce((sum, d) => sum + d.totalRevenue, 0);
  const changePercent = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
  const isPositiveTrend = changePercent >= 0;

  // Get max value for scaling the bars
  const maxRevenue = Math.max(...revenueData.map((d) => d.totalRevenue), 1);

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Revenue Overview</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            </Button>
          </div>
          {totals && (
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totals.totalRevenue)}
              </p>
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                isPositiveTrend ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              )}>
                {isPositiveTrend ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPositiveTrend ? "+" : ""}{changePercent.toFixed(1)}%
                <span className="text-muted-foreground ml-1">vs prior</span>
              </div>
            </div>
          )}
        </div>
        <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <TabsList>
            <TabsTrigger value="7">7D</TabsTrigger>
            <TabsTrigger value="30">30D</TabsTrigger>
            <TabsTrigger value="90">90D</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {/* Bar chart with improved styling */}
        <div className="h-[180px] flex items-end gap-[2px] mb-4">
          {revenueData.slice(-Math.min(days, 30)).map((point) => {
            const height = (point.totalRevenue / maxRevenue) * 100;
            const hasRevenue = point.totalRevenue > 0;
            return (
              <div
                key={point.date}
                className="flex-1 group relative"
              >
                <div
                  className={cn(
                    "w-full rounded-t transition-all",
                    hasRevenue ? "bg-primary/70 hover:bg-primary" : "bg-muted"
                  )}
                  style={{ height: `${Math.max(height, 3)}%` }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  <p className="font-semibold">{formatCurrency(point.totalRevenue)}</p>
                  <p className="text-muted-foreground">{new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue breakdown - improved layout */}
        <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pack Sales</p>
            <p className="text-lg font-bold">
              {formatCompact(totals?.packRevenue ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totals?.packPurchases ?? 0} purchases
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Drop Entries</p>
            <p className="text-lg font-bold">
              {formatCompact(totals?.roomEntryRevenue ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totals?.roomEntries ?? 0} entries
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By Tier</p>
            <div className="text-sm space-y-0.5">
              {Object.entries(tierBreakdown).map(([tier, stats]) => (
                <div key={tier} className="flex justify-between">
                  <span className="text-muted-foreground text-xs">{tier}</span>
                  <span className="font-medium text-xs">{formatCompact(stats.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
