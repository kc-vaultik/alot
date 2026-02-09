import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminRooms } from "../../hooks/data/useRoomsData";
import { useAdminCancelRoom, useAdminExtendDeadline, useAdminForceSettle } from "../../hooks/mutations/useAdminRoomActions";
import { TIER_OPTIONS, DROP_STATUS_OPTIONS } from "../../constants";
import { format } from "date-fns";
import { MoreHorizontal, Clock, XCircle, Gavel, Users, Loader2, Eye } from "lucide-react";
import type { Room } from "../../types";

const statusColors: Record<string, string> = {
  OPEN: "bg-green-500/20 text-green-500 border-green-500/30",
  LOCKED: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  SETTLED: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  CANCELLED: "bg-red-500/20 text-red-500 border-red-500/30",
};

interface DropsListProps {
  onViewDrop?: (dropId: string) => void;
}

export function DropsList({ onViewDrop }: DropsListProps) {
  const [filters, setFilters] = useState<{ status?: string; tier?: string }>({});
  const [extendDialogDrop, setExtendDialogDrop] = useState<Room | null>(null);
  const [newDeadline, setNewDeadline] = useState("");
  const [confirmCancelDrop, setConfirmCancelDrop] = useState<Room | null>(null);
  const [confirmSettleDrop, setConfirmSettleDrop] = useState<Room | null>(null);

  const { data: drops, isLoading } = useAdminRooms(filters);
  const cancelDrop = useAdminCancelRoom();
  const extendDeadline = useAdminExtendDeadline();
  const forceSettle = useAdminForceSettle();

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  const handleExtendDeadline = async () => {
    if (!extendDialogDrop || !newDeadline) return;
    await extendDeadline.mutateAsync({
      roomId: extendDialogDrop.id,
      newDeadline: new Date(newDeadline).toISOString(),
    });
    setExtendDialogDrop(null);
    setNewDeadline("");
  };

  const handleCancelDrop = async () => {
    if (!confirmCancelDrop) return;
    await cancelDrop.mutateAsync(confirmCancelDrop.id);
    setConfirmCancelDrop(null);
  };

  const handleForceSettle = async () => {
    if (!confirmSettleDrop) return;
    await forceSettle.mutateAsync(confirmSettleDrop.id);
    setConfirmSettleDrop(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Drops</CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={filters.status || "all"}
            onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {DROP_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.tier || "all"}
            onValueChange={(v) => setFilters({ ...filters, tier: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              {TIER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : drops?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No drops found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Escrow</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drops?.map((drop) => (
                <TableRow key={drop.id}>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[drop.status] || ""}>
                      {drop.status}
                    </Badge>
                    {drop.is_mystery && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Mystery
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{drop.tier}</TableCell>
                  <TableCell>{drop.category || "-"}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatCurrency(Number(drop.escrow_balance_cents))} / {formatCurrency(Number(drop.escrow_target_cents))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((Number(drop.escrow_balance_cents) / Number(drop.escrow_target_cents)) * 100)}% funded
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      Start: {format(new Date(drop.start_at), "MMM d, HH:mm")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      End: {format(new Date(drop.end_at), "MMM d, HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDrop?.(drop.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewDrop?.(drop.id)}>
                          <Users className="mr-2 h-4 w-4" />
                          View Entrants
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {(drop.status === "OPEN" || drop.status === "LOCKED") && (
                          <>
                            <DropdownMenuItem onClick={() => setExtendDialogDrop(drop)}>
                              <Clock className="mr-2 h-4 w-4" />
                              Extend Deadline
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setConfirmSettleDrop(drop)}
                              className="text-blue-500"
                            >
                              <Gavel className="mr-2 h-4 w-4" />
                              Force Settle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setConfirmCancelDrop(drop)}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Drop
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Extend Deadline Dialog */}
      <Dialog open={!!extendDialogDrop} onOpenChange={() => setExtendDialogDrop(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Drop Deadline</DialogTitle>
            <DialogDescription>
              Set a new deadline for drop {extendDialogDrop?.id.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current End Date</Label>
              <p className="text-sm text-muted-foreground">
                {extendDialogDrop && format(new Date(extendDialogDrop.end_at), "PPpp")}
              </p>
            </div>
            <div>
              <Label htmlFor="new-deadline">New Deadline</Label>
              <Input
                id="new-deadline"
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogDrop(null)}>
              Cancel
            </Button>
            <Button onClick={handleExtendDeadline} disabled={extendDeadline.isPending || !newDeadline}>
              {extendDeadline.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!confirmCancelDrop} onOpenChange={() => setConfirmCancelDrop(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Drop</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this drop? This action cannot be undone.
              All entrants will need to be refunded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancelDrop(null)}>
              Keep Drop
            </Button>
            <Button variant="destructive" onClick={handleCancelDrop} disabled={cancelDrop.isPending}>
              {cancelDrop.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Drop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Settle Confirmation Dialog */}
      <Dialog open={!!confirmSettleDrop} onOpenChange={() => setConfirmSettleDrop(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Settle Drop</DialogTitle>
            <DialogDescription>
              Are you sure you want to force settle this drop? This will draw a winner
              immediately using the current entrants.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSettleDrop(null)}>
              Cancel
            </Button>
            <Button onClick={handleForceSettle} disabled={forceSettle.isPending}>
              {forceSettle.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Force Settle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Legacy alias
export { DropsList as RoomsList };
