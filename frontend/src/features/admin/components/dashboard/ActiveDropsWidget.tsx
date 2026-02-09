import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRoomStatusCounts } from "../../hooks/data/useAdminStats";
import { Sparkles, Lock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ADMIN_ROUTES } from "../../constants";

export function ActiveDropsWidget() {
  const { data: counts, isLoading, refetch, isFetching } = useRoomStatusCounts();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Drop Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = [
    { label: "Open", value: counts?.open ?? 0, icon: Sparkles, color: "text-green-500", bgColor: "bg-green-500/10" },
    { label: "Locked", value: counts?.locked ?? 0, icon: Lock, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { label: "Settled", value: counts?.settled ?? 0, icon: CheckCircle, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { label: "Cancelled", value: counts?.cancelled ?? 0, icon: XCircle, color: "text-red-500", bgColor: "bg-red-500/10" },
  ];

  const totalActive = (counts?.open ?? 0) + (counts?.locked ?? 0);

  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => navigate(ADMIN_ROUTES.DROPS)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">Drop Status</CardTitle>
          <p className="text-2xl font-bold">{totalActive} <span className="text-sm font-normal text-muted-foreground">active</span></p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            refetch();
          }}
          disabled={isFetching}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-2 rounded-lg p-2.5",
                item.bgColor
              )}
            >
              <item.icon className={cn("h-4 w-4", item.color)} />
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold">{item.value}</span>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Legacy alias
export { ActiveDropsWidget as ActiveRoomsWidget };
