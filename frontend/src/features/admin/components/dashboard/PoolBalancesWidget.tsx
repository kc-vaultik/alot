import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminDashboardStats } from "../../hooks/data/useAdminDashboard";
import { Wallet, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function PoolBalancesWidget() {
  const { data, isLoading, refetch, isFetching } = useAdminDashboardStats();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  const formatCompact = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" }).format(value);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Pool Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const bucketBalances = data?.bucketBalances ?? [];
  const tierEscrowPools = data?.tierEscrowPools ?? [];

  const totalBucketBalance = bucketBalances.reduce((sum, b) => sum + Number(b.balance_usd), 0);
  const totalEscrowBalance = tierEscrowPools.reduce((sum, t) => sum + Number(t.balance_cents) / 100, 0);

  // Check for low pool warnings
  const lowPools = tierEscrowPools.filter(pool => {
    const balance = Number(pool.balance_cents);
    const cap = Number(pool.tier_cap_cents);
    return cap > 0 && (balance / cap) < 0.2;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Pool Balances
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
        {/* Low pool warning */}
        {lowPools.length > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
            <p className="text-xs text-yellow-500">
              {lowPools.length} pool{lowPools.length > 1 ? "s" : ""} below 20% capacity
            </p>
          </div>
        )}

        {/* Award Buckets - compact view */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Award Buckets</h4>
            <span className="text-sm font-bold">{formatCompact(totalBucketBalance)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {bucketBalances.slice(0, 4).map((bucket) => (
              <div key={bucket.bucket} className="flex justify-between items-center p-1.5 rounded bg-muted/50">
                <span className="text-xs capitalize truncate">{bucket.bucket.replace(/([A-Z])/g, " $1").trim()}</span>
                <span className="text-xs font-medium">{formatCompact(Number(bucket.balance_usd))}</span>
              </div>
            ))}
          </div>
          {bucketBalances.length > 4 && (
            <p className="text-xs text-muted-foreground mt-1">+{bucketBalances.length - 4} more</p>
          )}
        </div>

        {/* Tier Escrow Pools - visual progress bars */}
        <div className="border-t border-border pt-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tier Escrow</h4>
            <span className="text-sm font-bold">{formatCompact(totalEscrowBalance)}</span>
          </div>
          <div className="space-y-2">
            {tierEscrowPools.map((pool) => {
              const balance = Number(pool.balance_cents) / 100;
              const cap = Number(pool.tier_cap_cents) / 100;
              const percentage = cap > 0 ? (balance / cap) * 100 : 0;
              const isLow = percentage < 20;

              return (
                <div key={pool.tier}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium">{pool.tier}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatCompact(balance)} / {formatCompact(cap)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isLow ? "bg-yellow-500" : "bg-primary"
                      )}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
