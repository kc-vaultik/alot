import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, CreditCard, Package, Trophy, Swords, ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";
import { useSearchUser, useAllUserData, useTransactionHistory } from "../../hooks/mutations/useAdminUsers";

export function UserLookup() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any>(null);

  const searchUser = useSearchUser();
  const { data: userData, isLoading: loadingUserData } = useAllUserData(selectedUserId);
  const { data: transactions, isLoading: loadingTransactions } = useTransactionHistory(selectedUserId);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    searchUser.mutate(searchQuery, {
      onSuccess: (data) => {
        setSearchResults(data);
        if (data && !Array.isArray(data)) {
          setSelectedUserId(data.user_id);
        } else if (Array.isArray(data) && data.length === 1) {
          setSelectedUserId(data[0].user_id);
        }
      },
    });
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> User Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by email, user ID, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searchUser.isPending}>
              {searchUser.isPending ? "Searching..." : "Search"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Enter a full email address, UUID, or partial username
          </p>
        </CardContent>
      </Card>

      {/* Search Results (multiple) */}
      {Array.isArray(searchResults) && searchResults.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((user: any) => (
                  <TableRow key={user.user_id}>
                    <TableCell>@{user.username}</TableCell>
                    <TableCell>{user.display_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "default" : "destructive"}>
                        {user.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleSelectUser(user.user_id)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* User Detail View */}
      {selectedUserId && userData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {userData.profile?.display_name || userData.profile?.username}
              </CardTitle>
              <Badge variant={userData.profile?.status === "active" ? "default" : "destructive"}>
                {userData.profile?.status || "active"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>@{userData.profile?.username}</div>
              <div className="font-mono text-xs">{selectedUserId}</div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cards">
              <TabsList className="w-full flex-wrap h-auto">
                <TabsTrigger value="cards" className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" /> Cards ({userData.reveals?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex items-center gap-1">
                  <Package className="h-4 w-4" /> Transactions
                </TabsTrigger>
                <TabsTrigger value="rooms" className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" /> Rooms ({userData.roomEntries?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="awards" className="flex items-center gap-1">
                  Awards ({userData.awards?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="battles" className="flex items-center gap-1">
                  <Swords className="h-4 w-4" /> Battles ({userData.battles?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="transfers" className="flex items-center gap-1">
                  <ArrowLeftRight className="h-4 w-4" /> Transfers ({userData.transfers?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cards" className="mt-4">
                {loadingUserData ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Band</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userData.reveals?.slice(0, 50).map((card: any) => (
                        <TableRow key={card.id}>
                          <TableCell className="font-medium">{card.product_classes?.name}</TableCell>
                          <TableCell>{card.product_classes?.category}</TableCell>
                          <TableCell><Badge variant="outline">{card.band}</Badge></TableCell>
                          <TableCell>{card.card_state}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(card.created_at), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="transactions" className="mt-4 space-y-4">
                {loadingTransactions ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : (
                  <>
                    <div>
                      <h4 className="font-medium mb-2">Pack Purchases</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Stripe ID</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions?.purchases?.map((p: any) => (
                            <TableRow key={p.id}>
                              <TableCell>{format(new Date(p.created_at), "MMM d, HH:mm")}</TableCell>
                              <TableCell><Badge>{p.tier}</Badge></TableCell>
                              <TableCell>{p.quantity}</TableCell>
                              <TableCell className="text-right">${p.total_price_usd}</TableCell>
                              <TableCell className="font-mono text-xs truncate max-w-[150px]">
                                {p.stripe_payment_intent_id || p.stripe_session_id || "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Room Entry Purchases</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead>Tickets</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions?.roomPurchases?.map((p: any) => (
                            <TableRow key={p.id}>
                              <TableCell>{format(new Date(p.created_at), "MMM d, HH:mm")}</TableCell>
                              <TableCell><Badge variant="outline">{p.rooms?.tier}</Badge></TableCell>
                              <TableCell>{p.tickets_granted}</TableCell>
                              <TableCell className="text-right">${(p.amount_cents / 100).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="rooms" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Staked At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.roomEntries?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs">{entry.room_id.slice(0, 8)}...</TableCell>
                        <TableCell><Badge>{entry.rooms?.tier}</Badge></TableCell>
                        <TableCell>{entry.tickets}</TableCell>
                        <TableCell>{entry.status}</TableCell>
                        <TableCell>
                          <Badge variant={entry.outcome === "won" ? "default" : "outline"}>
                            {entry.outcome}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(entry.staked_at), "MMM d, HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="awards" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.awards?.map((award: any) => (
                      <TableRow key={award.id}>
                        <TableCell className="font-medium">{award.product_classes?.name}</TableCell>
                        <TableCell>${award.product_classes?.retail_value_usd}</TableCell>
                        <TableCell>
                          <Badge variant={award.status === "FULFILLED" ? "default" : "outline"}>
                            {award.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(award.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="battles" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Battle ID</TableHead>
                      <TableHead>Opponent</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.battles?.map((battle: any) => {
                      const isUserA = battle.user_a === selectedUserId;
                      return (
                        <TableRow key={battle.id}>
                          <TableCell className="font-mono text-xs">{battle.id.slice(0, 8)}...</TableCell>
                          <TableCell>{battle.opponent_type}</TableCell>
                          <TableCell>
                            {isUserA ? battle.score_a : battle.score_b} - {isUserA ? battle.score_b : battle.score_a}
                          </TableCell>
                          <TableCell>
                            <Badge variant={battle.status === "COMPLETE" ? "default" : "outline"}>
                              {battle.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(battle.created_at), "MMM d, HH:mm")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="transfers" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Card</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.transfers?.map((transfer: any) => (
                      <TableRow key={transfer.id}>
                        <TableCell>{transfer.transfer_type}</TableCell>
                        <TableCell>{transfer.reveals?.product_classes?.name}</TableCell>
                        <TableCell>
                          {transfer.from_user_id === selectedUserId ? "Sent" : "Received"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transfer.status === "claimed" ? "default" : "outline"}>
                            {transfer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(transfer.created_at), "MMM d, HH:mm")}
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
    </div>
  );
}
