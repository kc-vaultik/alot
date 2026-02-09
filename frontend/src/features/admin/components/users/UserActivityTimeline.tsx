import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { 
  ShoppingCart, 
  Sparkles, 
  Trophy, 
  Gift, 
  ArrowRightLeft,
  CreditCard,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserActivityTimelineProps {
  userId: string;
}

interface ActivityEvent {
  id: string;
  type: "purchase" | "reveal" | "room_entry" | "room_win" | "gift_sent" | "gift_received" | "swap" | "joined";
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const activityIcons: Record<string, React.ElementType> = {
  purchase: ShoppingCart,
  reveal: Sparkles,
  room_entry: CreditCard,
  room_win: Trophy,
  gift_sent: Gift,
  gift_received: Gift,
  swap: ArrowRightLeft,
  joined: UserPlus,
};

const activityColors: Record<string, string> = {
  purchase: "bg-green-500/20 text-green-500 border-green-500/30",
  reveal: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  room_entry: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  room_win: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  gift_sent: "bg-pink-500/20 text-pink-500 border-pink-500/30",
  gift_received: "bg-pink-500/20 text-pink-500 border-pink-500/30",
  swap: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
  joined: "bg-muted text-muted-foreground",
};

export function UserActivityTimeline({ userId }: UserActivityTimelineProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["admin", "user-activity", userId],
    queryFn: async (): Promise<ActivityEvent[]> => {
      const events: ActivityEvent[] = [];

      // Fetch purchases
      const { data: purchases } = await supabase
        .from("purchases")
        .select("id, created_at, quantity, total_price_usd, tier")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      purchases?.forEach((p) => {
        events.push({
          id: `purchase-${p.id}`,
          type: "purchase",
          title: "Card Pack Purchase",
          description: `Bought ${p.quantity}x ${p.tier} pack for $${p.total_price_usd.toFixed(2)}`,
          timestamp: p.created_at,
        });
      });

      // Fetch reveals
      const { data: reveals } = await supabase
        .from("reveals")
        .select("id, created_at, band, is_golden, product_class_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      reveals?.forEach((r) => {
        events.push({
          id: `reveal-${r.id}`,
          type: "reveal",
          title: r.is_golden ? "Golden Card Reveal!" : "Card Reveal",
          description: `Revealed a ${r.band} rarity card`,
          timestamp: r.created_at,
        });
      });

      // Fetch room entries
      const { data: entries } = await supabase
        .from("room_entries")
        .select("id, staked_at, room_id, outcome, tickets")
        .eq("user_id", userId)
        .order("staked_at", { ascending: false })
        .limit(10);

      entries?.forEach((e) => {
        const isWin = e.outcome === "WON";
        events.push({
          id: `entry-${e.id}`,
          type: isWin ? "room_win" : "room_entry",
          title: isWin ? "Drop Win!" : "Drop Entry",
          description: isWin 
            ? `Won the drop with ${e.tickets} tickets!` 
            : `Entered drop with ${e.tickets} tickets`,
          timestamp: e.staked_at,
        });
      });

      // Fetch transfers (gifts/swaps)
      const { data: transfers } = await supabase
        .from("card_transfers")
        .select("id, created_at, transfer_type, status, from_user_id, to_user_id")
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(10);

      transfers?.forEach((t) => {
        const isSent = t.from_user_id === userId;
        if (t.transfer_type === "GIFT") {
          events.push({
            id: `transfer-${t.id}`,
            type: isSent ? "gift_sent" : "gift_received",
            title: isSent ? "Gift Sent" : "Gift Received",
            description: `${t.status} gift transfer`,
            timestamp: t.created_at,
          });
        } else if (t.transfer_type === "SWAP") {
          events.push({
            id: `transfer-${t.id}`,
            type: "swap",
            title: "Swap",
            description: `${t.status} swap`,
            timestamp: t.created_at,
          });
        }
      });

      // Sort by timestamp
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return events.slice(0, 20);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {!activities?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No activity found
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

            <div className="space-y-4">
              {activities.map((event, index) => {
                const Icon = activityIcons[event.type] || Sparkles;
                const isLast = index === activities.length - 1;

                return (
                  <div key={event.id} className="relative flex gap-4">
                    <div
                      className={cn(
                        "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
                        activityColors[event.type]
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className={cn("flex-1", !isLast && "pb-4")}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{event.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.timestamp), "MMM d, HH:mm")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
