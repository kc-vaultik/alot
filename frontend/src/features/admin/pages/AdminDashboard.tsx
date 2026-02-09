import { useQueryClient } from "@tanstack/react-query";
import { useAdminDashboardStats, useAdminRevenue, useAdminUserGrowth } from "../hooks/data/useAdminDashboard";
import { StatCard, ActiveDropsWidget, RevenueChart, RecentActivityFeed, PoolBalancesWidget, UserGrowthWidget } from "../components/dashboard";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, CreditCard, Award, RefreshCw, Sparkles } from "lucide-react";
import { ADMIN_ROUTES, ADMIN_QUERY_KEYS } from "../constants";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading, refetch: refetchStats, isFetching: isFetchingStats } = useAdminDashboardStats();
  const { data: revenueData } = useAdminRevenue(7);
  const { data: userGrowthData } = useAdminUserGrowth(7);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stats }),
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.revenue }),
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.drops }),
    ]);
    setIsRefreshingAll(false);
  };

  // Calculate trends from recent data
  const revenueToday = stats?.revenueToday ?? 0;
  const revenueThisWeek = stats?.revenueThisWeek ?? 0;
  const avgDailyRevenue = revenueThisWeek / 7;
  const revenueTrend = avgDailyRevenue > 0 ? ((revenueToday - avgDailyRevenue) / avgDailyRevenue) * 100 : 0;

  const newUsersToday = stats?.newUsersToday ?? 0;
  const avgDailyUsers = userGrowthData?.summary?.avgDailySignups ?? 0;
  const userTrend = avgDailyUsers > 0 ? ((newUsersToday - avgDailyUsers) / avgDailyUsers) * 100 : 0;

  // Sparkline data
  const revenueSparkline = revenueData?.revenueData?.slice(-7).map(d => d.totalRevenue) ?? [];
  const userSparkline = userGrowthData?.growthData?.slice(-7).map(d => d.newUsers) ?? [];

  return (
    <div className="space-y-6">
      {/* Header with global refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">Monitor your platform performance</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefreshAll}
          disabled={isRefreshingAll}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshingAll && "animate-spin")} />
          Refresh All
        </Button>
      </div>

      {/* Quick Stats Row - 4 columns on large, 2 on medium, 1 on small */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={isLoading ? "..." : formatCurrency(stats?.totalRevenue ?? 0)}
          subtitle={`Week: ${formatCurrency(stats?.revenueThisWeek ?? 0)}`}
          icon={DollarSign}
          trend={!isLoading && revenueTrend !== 0 ? {
            value: Math.round(revenueTrend),
            isPositive: revenueTrend > 0,
            label: "vs avg"
          } : undefined}
          sparklineData={revenueSparkline}
          href={ADMIN_ROUTES.ECONOMY}
          tooltipContent="Click to view economy details"
        />
        <StatCard
          title="Total Users"
          value={isLoading ? "..." : stats?.totalUsers?.toLocaleString() ?? 0}
          subtitle={`+${stats?.newUsersToday ?? 0} today`}
          icon={Users}
          trend={!isLoading && userTrend !== 0 ? {
            value: Math.round(userTrend),
            isPositive: userTrend > 0,
            label: "vs avg"
          } : undefined}
          sparklineData={userSparkline}
          href={ADMIN_ROUTES.USERS}
          tooltipContent="Click to manage users"
        />
        <StatCard
          title="Total Cards"
          value={isLoading ? "..." : stats?.totalCards?.toLocaleString() ?? 0}
          icon={CreditCard}
          href={ADMIN_ROUTES.INVENTORY}
          tooltipContent="Click to view inventory"
        />
        <StatCard
          title="Pending Awards"
          value={isLoading ? "..." : stats?.pendingAwards ?? 0}
          icon={Award}
          tooltipContent="Awards awaiting fulfillment"
        />
      </div>

      {/* Main Charts Row - 2 columns: Revenue (wider) + Drops Status */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <RevenueChart />
        <ActiveDropsWidget />
      </div>

      {/* Secondary Row - 3 equal columns */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <UserGrowthWidget />
        <PoolBalancesWidget />
        <RecentActivityFeed />
      </div>
    </div>
  );
}
