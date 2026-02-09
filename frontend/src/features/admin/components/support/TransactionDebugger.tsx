import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Receipt, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function TransactionDebugger() {
  const [searchType, setSearchType] = useState<"stripe_id" | "user_id" | "room_id">("stripe_id");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);

  const { data: recentPurchases, isLoading: loadingPurchases } = useQuery({
    queryKey: ["admin", "recent-purchases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchases")
        .select("*, collector_profiles!inner(username, display_name)")
        .order("created_at", { ascending: false })
        .limit(20);
      return data;
    },
  });

  const { data: recentRoomPurchases, isLoading: loadingRoomPurchases } = useQuery({
    queryKey: ["admin", "recent-room-purchases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("room_entry_purchases")
        .select("*, rooms(tier, status)")
        .order("created_at", { ascending: false })
        .limit(20);
      return data;
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    let results: any = { purchases: [], roomPurchases: [] };

    if (searchType === "stripe_id") {
      const { data: purchases } = await supabase
        .from("purchases")
        .select("*, collector_profiles!inner(username)")
        .or(`stripe_payment_intent_id.eq.${searchQuery},stripe_session_id.eq.${searchQuery}`);
      
      const { data: roomPurchases } = await supabase
        .from("room_entry_purchases")
        .select("*, rooms(tier)")
        .or(`stripe_payment_intent_id.eq.${searchQuery},stripe_session_id.eq.${searchQuery}`);

      results = { purchases: purchases ?? [], roomPurchases: roomPurchases ?? [] };
    } else if (searchType === "user_id") {
      const { data: purchases } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", searchQuery)
        .order("created_at", { ascending: false });
      
      const { data: roomPurchases } = await supabase
        .from("room_entry_purchases")
        .select("*, rooms(tier)")
        .eq("user_id", searchQuery)
        .order("created_at", { ascending: false });

      results = { purchases: purchases ?? [], roomPurchases: roomPurchases ?? [] };
    } else if (searchType === "room_id") {
      const { data: roomPurchases } = await supabase
        .from("room_entry_purchases")
        .select("*, rooms(tier)")
        .eq("room_id", searchQuery)
        .order("created_at", { ascending: false });

      results = { purchases: [], roomPurchases: roomPurchases ?? [] };
    }

    setSearchResults(results);
  };

  const getPaymentStatusBadge = (purchase: any) => {
    if (purchase.stripe_payment_intent_id) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" /> Confirmed
        </Badge>
      );
    }
    if (purchase.stripe_session_id) {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" /> Pending
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" /> Unknown
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" /> Transaction Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={searchType} onValueChange={(v: any) => setSearchType(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe_id">Stripe ID</SelectItem>
                <SelectItem value="user_id">User ID</SelectItem>
                <SelectItem value="room_id">Room ID</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={
                searchType === "stripe_id" ? "pi_... or cs_..."
                : searchType === "user_id" ? "User UUID..."
                : "Room UUID..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-1" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="purchases">
              <TabsList>
                <TabsTrigger value="purchases">
                  Pack Purchases ({searchResults.purchases?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="room">
                  Room Purchases ({searchResults.roomPurchases?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="purchases" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stripe ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.purchases?.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.created_at), "MMM d, HH:mm")}</TableCell>
                        <TableCell>{p.collector_profiles?.username || p.user_id.slice(0, 8)}</TableCell>
                        <TableCell><Badge>{p.tier}</Badge></TableCell>
                        <TableCell>{p.quantity}</TableCell>
                        <TableCell className="text-right">${p.total_price_usd}</TableCell>
                        <TableCell>{getPaymentStatusBadge(p)}</TableCell>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate">
                          {p.stripe_payment_intent_id || p.stripe_session_id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="room" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Stripe ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.roomPurchases?.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.created_at), "MMM d, HH:mm")}</TableCell>
                        <TableCell className="font-mono text-xs">{p.room_id.slice(0, 8)}...</TableCell>
                        <TableCell><Badge variant="outline">{p.rooms?.tier}</Badge></TableCell>
                        <TableCell>{p.tickets_granted}</TableCell>
                        <TableCell className="text-right">${(p.amount_cents / 100).toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate">
                          {p.stripe_payment_intent_id || p.stripe_session_id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pack-purchases">
            <TabsList>
              <TabsTrigger value="pack-purchases">Pack Purchases</TabsTrigger>
              <TabsTrigger value="room-purchases">Room Purchases</TabsTrigger>
            </TabsList>

            <TabsContent value="pack-purchases" className="mt-4">
              {loadingPurchases ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPurchases?.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.created_at), "MMM d, HH:mm")}</TableCell>
                        <TableCell>@{p.collector_profiles?.username}</TableCell>
                        <TableCell><Badge>{p.tier}</Badge></TableCell>
                        <TableCell>{p.quantity}</TableCell>
                        <TableCell className="text-right">${p.total_price_usd}</TableCell>
                        <TableCell>{getPaymentStatusBadge(p)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="room-purchases" className="mt-4">
              {loadingRoomPurchases ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRoomPurchases?.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.created_at), "MMM d, HH:mm")}</TableCell>
                        <TableCell className="font-mono text-xs">{p.room_id.slice(0, 8)}...</TableCell>
                        <TableCell><Badge variant="outline">{p.rooms?.tier}</Badge></TableCell>
                        <TableCell>{p.tickets_granted}</TableCell>
                        <TableCell className="text-right">${(p.amount_cents / 100).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
