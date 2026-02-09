import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminUserGrowth } from "../../hooks/data/useAdminDashboard";
import { Users, TrendingUp, TrendingDown, RefreshCw, UserPlus, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserGrowthWidget() {
  const { data, isLoading, refetch, isFetching } = useAdminUserGrowth(30);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded" />
            <div className="h-[60px] bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary;
  const growthData = data?.growthData ?? [];

  // Get max for scaling
  const maxNewUsers = Math.max(...growthData.map((d) => d.newUsers), 1);

  // Calculate week-over-week growth
  const lastWeek = growthData.slice(-7).reduce((sum, d) => sum + d.newUsers, 0);
  const priorWeek = growthData.slice(-14, -7).reduce((sum, d) => sum + d.newUsers, 0);
  const weekGrowth = priorWeek > 0 ? ((lastWeek - priorWeek) / priorWeek) * 100 : 0;
  const isGrowthPositive = weekGrowth >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          User Growth
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats - improved */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-3xl font-bold">{summary?.totalUsers?.toLocaleString() ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-green-500">+{summary?.newUsersInPeriod ?? 0}</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">Last 30 Days</p>
              {weekGrowth !== 0 && (
                <span className={cn(
                  "text-xs font-medium flex items-center gap-0.5",
                  isGrowthPositive ? "text-green-500" : "text-red-500"
                )}>
                  {isGrowthPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {weekGrowth.toFixed(0)}% WoW
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mini chart - improved */}
        <div className="h-[50px] flex items-end gap-[2px]">
          {growthData.slice(-14).map((point, i) => {
            const height = (point.newUsers / maxNewUsers) * 100;
            const isToday = i === growthData.slice(-14).length - 1;
            return (
              <div
                key={point.date}
                className="flex-1 group relative"
              >
                <div
                  className={cn(
                    "w-full rounded-t transition-colors",
                    isToday ? "bg-primary" : "bg-primary/50 hover:bg-primary/70"
                  )}
                  style={{ height: `${Math.max(height, 6)}%` }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  <p className="font-medium">{point.newUsers} signups</p>
                  <p className="text-muted-foreground text-[10px]">{new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional metrics - improved layout */}
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/50">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">{summary?.avgDailySignups?.toFixed(1) ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Avg Daily</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/50">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">{summary?.conversionRate?.toFixed(1) ?? 0}%</p>
              <p className="text-[10px] text-muted-foreground">Conversion</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
