import { useState } from "react";
import {
  useAdminPoolLedger,
  useAdminEscrowLedger,
  useAdminCategoryPoolLedger,
} from "../../hooks/mutations/useAdminEconomy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface PoolLedgerEntry {
  id: string;
  bucket: string;
  event_type: string;
  amount_usd: number;
  ref_type: string;
  ref_id: string;
  created_at: string;
}

interface EscrowLedgerEntry {
  id: string;
  tier: string | null;
  scope: string;
  delta_cents: number;
  reason: string;
  ref_id: string | null;
  room_id: string | null;
  created_at: string;
}

interface CategoryLedgerEntry {
  id: string;
  category: string;
  event_type: string;
  amount_usd: number;
  ref_type: string;
  ref_id: string;
  created_at: string;
}

const EVENT_COLORS: Record<string, string> = {
  ADD: "bg-green-500/10 text-green-500",
  RESERVE: "bg-yellow-500/10 text-yellow-500",
  RELEASE: "bg-blue-500/10 text-blue-500",
  CAPTURE: "bg-purple-500/10 text-purple-500",
};

const BUCKET_OPTIONS = [
  "microWins", "midWins", "services", "jackpot", "superJackpot", "reserve", "promo"
];

const TIER_OPTIONS = ["T5", "T10", "T20"];

const CATEGORY_OPTIONS = [
  "POKEMON", "SNEAKERS", "WATCHES", "HANDBAGS", "WINE",
  "CLOTHING", "JEWELLERY", "ART_TOYS", "SPORT_MEMORABILIA"
];

export function LedgerViewers() {
  const [poolBucketFilter, setPoolBucketFilter] = useState<string>("all");
  const [escrowTierFilter, setEscrowTierFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: poolLedger, isLoading: loadingPool } = useAdminPoolLedger({
    bucket: poolBucketFilter !== "all" ? poolBucketFilter : undefined,
    limit: 100,
  });

  const { data: escrowLedger, isLoading: loadingEscrow } = useAdminEscrowLedger({
    tier: escrowTierFilter !== "all" ? escrowTierFilter : undefined,
    limit: 100,
  });

  const { data: categoryLedger, isLoading: loadingCategory } = useAdminCategoryPoolLedger({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    limit: 100,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Ledgers</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pool">
          <TabsList>
            <TabsTrigger value="pool">Pool Ledger</TabsTrigger>
            <TabsTrigger value="escrow">Escrow Ledger</TabsTrigger>
            <TabsTrigger value="category">Category Ledger</TabsTrigger>
          </TabsList>

          {/* Pool Ledger */}
          <TabsContent value="pool" className="mt-4 space-y-4">
            <Select value={poolBucketFilter} onValueChange={setPoolBucketFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by bucket" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buckets</SelectItem>
                {BUCKET_OPTIONS.map((bucket) => (
                  <SelectItem key={bucket} value={bucket}>
                    {bucket}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {loadingPool ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Bucket</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(poolLedger ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (poolLedger ?? []).map((entry: PoolLedgerEntry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(entry.created_at), "MMM d, HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.bucket}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={EVENT_COLORS[entry.event_type] || ""}>
                              {entry.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${entry.amount_usd.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{entry.ref_type}:{entry.ref_id.substring(0, 8)}</code>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Escrow Ledger */}
          <TabsContent value="escrow" className="mt-4 space-y-4">
            <Select value={escrowTierFilter} onValueChange={setEscrowTierFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                {TIER_OPTIONS.map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {loadingEscrow ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead className="text-right">Delta</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(escrowLedger ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (escrowLedger ?? []).map((entry: EscrowLedgerEntry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(entry.created_at), "MMM d, HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            {entry.tier ? (
                              <Badge variant="outline">{entry.tier}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{entry.scope}</Badge>
                          </TableCell>
                          <TableCell className={`text-right font-mono ${
                            entry.delta_cents > 0 ? "text-green-500" : "text-red-500"
                          }`}>
                            {entry.delta_cents > 0 ? "+" : ""}${(entry.delta_cents / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {entry.reason}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Category Ledger */}
          <TabsContent value="category" className="mt-4 space-y-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {loadingCategory ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(categoryLedger ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (categoryLedger ?? []).map((entry: CategoryLedgerEntry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(entry.created_at), "MMM d, HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.category.replace(/_/g, " ")}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={EVENT_COLORS[entry.event_type] || ""}>
                              {entry.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${entry.amount_usd.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{entry.ref_type}:{entry.ref_id.substring(0, 8)}</code>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
