import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useRoomDetail } from "../../hooks/data/useRoomsData";
import { useAdminGetEntries, useAdminSetWinner } from "../../hooks/mutations/useAdminRoomActions";
import { format } from "date-fns";
import { ArrowLeft, Trophy, Loader2, User } from "lucide-react";

interface DropDetailProps {
  dropId: string;
  onBack: () => void;
}

export function DropDetail({ dropId, onBack }: DropDetailProps) {
  const { data, isLoading } = useRoomDetail(dropId);
  const { data: entriesData, isLoading: loadingEntries } = useAdminGetEntries(dropId);
  const setWinner = useAdminSetWinner();
  const [confirmWinnerEntry, setConfirmWinnerEntry] = useState<string | null>(null);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  const handleSetWinner = async () => {
    if (!confirmWinnerEntry) return;
    await setWinner.mutateAsync({ roomId: dropId, winnerEntryId: confirmWinnerEntry });
    setConfirmWinnerEntry(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.room) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Drop not found
      </div>
    );
  }

  const { room, entriesCount, productClass, lotteryDraw } = data;
  const entries = entriesData?.entries || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">Drop Details</h2>
          <p className="text-sm text-muted-foreground">{room.id}</p>
        </div>
      </div>

      {/* Drop Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant="outline" className="mt-1">
              {room.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Tier</p>
            <p className="text-2xl font-bold">{room.tier}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Escrow</p>
            <p className="text-2xl font-bold">
              {formatCurrency(Number(room.escrow_balance_cents))}
            </p>
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(Number(room.escrow_target_cents))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Entrants</p>
            <p className="text-2xl font-bold">{entriesCount}</p>
            <p className="text-xs text-muted-foreground">
              {room.min_participants} min, {room.max_participants} max
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product & Dates */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prize Product</CardTitle>
          </CardHeader>
          <CardContent>
            {productClass ? (
              <div className="flex items-center gap-4">
                {productClass.image_url && (
                  <img
                    src={productClass.image_url}
                    alt={productClass.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{productClass.name}</p>
                  <p className="text-sm text-muted-foreground">{productClass.brand}</p>
                  <p className="text-sm font-medium text-green-500">
                    ${Number(productClass.retail_value_usd).toFixed(2)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No product set</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Start</span>
              <span>{format(new Date(room.start_at), "PPpp")}</span>
            </div>
            {room.lock_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lock</span>
                <span>{format(new Date(room.lock_at), "PPpp")}</span>
              </div>
            )}
            {room.deadline_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deadline</span>
                <span>{format(new Date(room.deadline_at), "PPpp")}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">End</span>
              <span>{format(new Date(room.end_at), "PPpp")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Winner Info */}
      {lotteryDraw && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Lottery Draw
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Winner Entry</span>
              <span className="font-mono text-xs">{lotteryDraw.winner_entry_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Winning Ticket</span>
              <span>#{lotteryDraw.winning_ticket_number} of {lotteryDraw.total_tickets}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Drawn At</span>
              <span>{format(new Date(lotteryDraw.drawn_at), "PPpp")}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entrants Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Entrants Leaderboard</CardTitle>
          {room.status !== "SETTLED" && room.status !== "CANCELLED" && (
            <p className="text-xs text-muted-foreground">
              Click on an entry to manually set as winner
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loadingEntries ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No entrants yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Priority Score</TableHead>
                  <TableHead>Outcome</TableHead>
                  {room.status !== "SETTLED" && room.status !== "CANCELLED" && (
                    <TableHead className="text-right">Action</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry: {
                  id: string;
                  user_id: string;
                  rank: number | null;
                  tickets: number;
                  priority_score: number | null;
                  outcome: string;
                }, index: number) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.rank || index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs">{entry.user_id.slice(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>{entry.tickets}</TableCell>
                    <TableCell>{entry.priority_score?.toFixed(2) || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={entry.outcome === "WINNER" ? "default" : "secondary"}>
                        {entry.outcome}
                      </Badge>
                    </TableCell>
                    {room.status !== "SETTLED" && room.status !== "CANCELLED" && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmWinnerEntry(entry.id)}
                        >
                          <Trophy className="h-3 w-3 mr-1" />
                          Set Winner
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Set Winner Confirmation */}
      <Dialog open={!!confirmWinnerEntry} onOpenChange={() => setConfirmWinnerEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manually Set Winner</DialogTitle>
            <DialogDescription>
              Are you sure you want to set this entry as the winner? This will settle
              the drop and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmWinnerEntry(null)}>
              Cancel
            </Button>
            <Button onClick={handleSetWinner} disabled={setWinner.isPending}>
              {setWinner.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Winner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Legacy alias for backward compatibility
export function RoomDetail({ roomId, onBack }: { roomId: string; onBack: () => void }) {
  return <DropDetail dropId={roomId} onBack={onBack} />;
}
