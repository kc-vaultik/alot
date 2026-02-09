import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAdminRooms } from "../../hooks/data/useRoomsData";
import { TIER_OPTIONS, DROP_STATUS_OPTIONS } from "../../constants";
import { format } from "date-fns";
import { MoreHorizontal, Clock, XCircle, Gavel, Copy, Eye, Loader2, Plus, Filter } from "lucide-react";
import { DropCreatorWizard } from "./DropCreatorWizard";
import { BulkActionsDialog } from "./BulkActionsDialog";
import { DropTimeline } from "./DropTimeline";
import type { Room } from "../../types";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  OPEN: "bg-green-500/20 text-green-500 border-green-500/30",
  LOCKED: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  SETTLED: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  CANCELLED: "bg-red-500/20 text-red-500 border-red-500/30",
};

interface DropsManagerProps {
  onViewDrop?: (dropId: string) => void;
}

export function DropsManager({ onViewDrop }: DropsManagerProps) {
  const [filters, setFilters] = useState<{ status?: string; tier?: string }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrops, setSelectedDrops] = useState<Set<string>>(new Set());
  const [wizardOpen, setWizardOpen] = useState(false);
  const [duplicateData, setDuplicateData] = useState<Partial<Room> | null>(null);
  const [bulkAction, setBulkAction] = useState<"cancel" | "extend" | null>(null);
  const [expandedDrop, setExpandedDrop] = useState<string | null>(null);

  const { data: drops, isLoading, refetch } = useAdminRooms(filters);

  const filteredDrops = drops?.filter((drop) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      drop.id.toLowerCase().includes(searchLower) ||
      drop.tier.toLowerCase().includes(searchLower) ||
      (drop.category?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedDrops);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedDrops(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedDrops.size === (filteredDrops?.length ?? 0)) {
      setSelectedDrops(new Set());
    } else {
      setSelectedDrops(new Set(filteredDrops?.map((d) => d.id) ?? []));
    }
  };

  const handleDuplicate = (drop: Room) => {
    setDuplicateData({
      tier: drop.tier as "T5" | "T10" | "T20",
      category: drop.category ?? undefined,
      product_class_id: drop.product_class_id ?? undefined,
      mystery_product_id: drop.mystery_product_id ?? undefined,
      is_mystery: drop.is_mystery,
      min_participants: drop.min_participants,
      max_participants: drop.max_participants,
      escrow_target_cents: Number(drop.escrow_target_cents),
      tier_cap_cents: Number(drop.tier_cap_cents),
      funding_target_cents: drop.funding_target_cents ? Number(drop.funding_target_cents) : undefined,
      reward_budget_cents: drop.reward_budget_cents ? Number(drop.reward_budget_cents) : undefined,
      leaderboard_visibility: drop.leaderboard_visibility ?? undefined,
    });
    setWizardOpen(true);
  };

  const selectedDropsList = drops?.filter((d) => selectedDrops.has(d.id)) ?? [];
  const canBulkAction = selectedDropsList.length > 0 && 
    selectedDropsList.every((d) => d.status === "OPEN" || d.status === "LOCKED");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search drops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
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

        <div className="flex items-center gap-2">
          {selectedDrops.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkAction("extend")}
                disabled={!canBulkAction}
              >
                <Clock className="mr-2 h-4 w-4" />
                Extend ({selectedDrops.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setBulkAction("cancel")}
                disabled={!canBulkAction}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel ({selectedDrops.size})
              </Button>
            </>
          )}
          <Button onClick={() => { setDuplicateData(null); setWizardOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Create Drop
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDrops?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No drops found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedDrops.size === (filteredDrops?.length ?? 0) && filteredDrops?.length! > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Escrow Progress</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrops?.map((drop) => (
                  <>
                    <TableRow
                      key={drop.id}
                      className={cn(
                        selectedDrops.has(drop.id) && "bg-muted/50",
                        "cursor-pointer"
                      )}
                      onClick={() => setExpandedDrop(expandedDrop === drop.id ? null : drop.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedDrops.has(drop.id)}
                          onCheckedChange={() => toggleSelect(drop.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className={statusColors[drop.status] || ""}>
                            {drop.status}
                          </Badge>
                          {drop.is_mystery && (
                            <Badge variant="secondary" className="text-xs">
                              Mystery
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{drop.tier}</TableCell>
                      <TableCell>{drop.category || "-"}</TableCell>
                      <TableCell>
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{formatCurrency(Number(drop.escrow_balance_cents))}</span>
                            <span className="text-muted-foreground">
                              {Math.round((Number(drop.escrow_balance_cents) / Number(drop.escrow_target_cents)) * 100)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, (Number(drop.escrow_balance_cents) / Number(drop.escrow_target_cents)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(drop.start_at), "MMM d")} → {format(new Date(drop.end_at), "MMM d")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                            <DropdownMenuItem onClick={() => handleDuplicate(drop)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(drop.status === "OPEN" || drop.status === "LOCKED") && (
                              <>
                                <DropdownMenuItem>
                                  <Clock className="mr-2 h-4 w-4" />
                                  Extend Deadline
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-blue-500">
                                  <Gavel className="mr-2 h-4 w-4" />
                                  Force Settle
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {expandedDrop === drop.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-medium mb-3">Timeline</h4>
                              <DropTimeline
                                startAt={drop.start_at}
                                lockAt={drop.lock_at}
                                deadlineAt={drop.deadline_at}
                                endAt={drop.end_at}
                                status={drop.status}
                              />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Funding Details</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Escrow Target:</span>
                                    <span className="ml-2 font-medium">
                                      {formatCurrency(Number(drop.escrow_target_cents))}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Tier Cap:</span>
                                    <span className="ml-2 font-medium">
                                      {formatCurrency(Number(drop.tier_cap_cents))}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Min Participants:</span>
                                    <span className="ml-2 font-medium">{drop.min_participants}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Max Participants:</span>
                                    <span className="ml-2 font-medium">{drop.max_participants}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => onViewDrop?.(drop.id)}>
                                  View Full Details
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDuplicate(drop)}>
                                  Duplicate Drop
                                </Button>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Wizard Dialog */}
      <DropCreatorWizard
        open={wizardOpen}
        onClose={() => { setWizardOpen(false); setDuplicateData(null); }}
        onSuccess={() => refetch()}
        duplicateFrom={duplicateData as any}
      />

      {/* Bulk Actions Dialog */}
      <BulkActionsDialog
        selectedDrops={selectedDropsList}
        action={bulkAction}
        onClose={() => setBulkAction(null)}
        onSuccess={() => {
          setSelectedDrops(new Set());
          refetch();
        }}
      />
    </div>
  );
}
