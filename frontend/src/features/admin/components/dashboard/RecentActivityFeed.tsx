import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAdminRecentActivity } from "../../hooks/data/useAdminDashboard";
import { formatDistanceToNow } from "date-fns";
import { ShoppingCart, CreditCard, Sparkles, Award, ArrowRightLeft, Loader2, RefreshCw, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcons = {
  purchase: ShoppingCart,
  reveal: CreditCard,
  room_entry: Sparkles,
  award: Award,
  transfer: ArrowRightLeft,
};

const typeColors = {
  purchase: "text-green-500 bg-green-500/10",
  reveal: "text-purple-500 bg-purple-500/10",
  room_entry: "text-blue-500 bg-blue-500/10",
  award: "text-yellow-500 bg-yellow-500/10",
  transfer: "text-orange-500 bg-orange-500/10",
};

const typeLabels = {
  purchase: "Purchases",
  reveal: "Reveals",
  room_entry: "Drop Entries",
  award: "Awards",
  transfer: "Transfers",
};

type ActivityType = keyof typeof typeIcons;

export function RecentActivityFeed() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { data, isLoading, refetch, isFetching } = useAdminRecentActivity(30);

  const activities = data?.activities ?? [];
  
  const filteredActivities = typeFilter === "all" 
    ? activities 
    : activities.filter(a => a.type === typeFilter);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-8">
              <Filter className="h-3 w-3 mr-1.5" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(typeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {typeFilter === "all" ? "No recent activity" : `No ${typeLabels[typeFilter as ActivityType]?.toLowerCase() || typeFilter} activity`}
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {filteredActivities.map((item) => {
                const Icon = typeIcons[item.type as ActivityType] ?? CreditCard;
                const colors = typeColors[item.type as ActivityType] ?? "text-muted-foreground bg-muted";
                const [textColor, bgColor] = colors.split(" ");

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn("mt-0.5 p-1.5 rounded-md", bgColor)}>
                      <Icon className={cn("h-3.5 w-3.5", textColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                        {item.amount && item.amount > 0 && (
                          <span className="text-xs font-medium text-green-500">
                            +${item.amount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
