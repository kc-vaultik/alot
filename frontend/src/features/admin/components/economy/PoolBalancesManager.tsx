import { useState } from "react";
import {
  useAdminBucketBalances,
  useAdminUpdateBucketBalance,
  useAdminTierEscrowPools,
  useAdminCategoryPoolBalances,
} from "../../hooks/mutations/useAdminEconomy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Minus, Loader2, TrendingUp, DollarSign, Wallet } from "lucide-react";
import { format } from "date-fns";

interface BucketBalance {
  bucket: string;
  balance_usd: number;
  updated_at: string;
}

interface TierEscrowPool {
  tier: string;
  balance_cents: number;
  tier_cap_cents: number;
  updated_at: string;
}

interface CategoryPoolBalance {
  category: string;
  balance_usd: number;
  updated_at: string;
}

const BUCKET_LABELS: Record<string, string> = {
  microWins: "Micro Wins",
  midWins: "Mid Wins",
  services: "Services",
  jackpot: "Jackpot",
  superJackpot: "Super Jackpot",
  reserve: "Reserve",
  promo: "Promo",
};

const BUCKET_COLORS: Record<string, string> = {
  microWins: "bg-green-500/10 text-green-500",
  midWins: "bg-blue-500/10 text-blue-500",
  services: "bg-purple-500/10 text-purple-500",
  jackpot: "bg-yellow-500/10 text-yellow-500",
  superJackpot: "bg-orange-500/10 text-orange-500",
  reserve: "bg-slate-500/10 text-slate-500",
  promo: "bg-pink-500/10 text-pink-500",
};

export function PoolBalancesManager() {
  const { data: bucketBalances, isLoading: loadingBuckets } = useAdminBucketBalances();
  const { data: tierPools, isLoading: loadingTiers } = useAdminTierEscrowPools();
  const { data: categoryPools, isLoading: loadingCategories } = useAdminCategoryPoolBalances();
  const updateBalance = useAdminUpdateBucketBalance();

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    amount: "",
    isAdd: true,
    reason: "",
  });

  const totalBucketBalance = (bucketBalances ?? []).reduce(
    (sum: number, b: BucketBalance) => sum + b.balance_usd,
    0
  );

  const totalEscrowBalance = (tierPools ?? []).reduce(
    (sum: number, t: TierEscrowPool) => sum + t.balance_cents / 100,
    0
  );

  const openAdjustDialog = (bucket: string) => {
    setSelectedBucket(bucket);
    setAdjustForm({ amount: "", isAdd: true, reason: "" });
    setAdjustDialogOpen(true);
  };

  const handleAdjust = () => {
    if (!selectedBucket || !adjustForm.amount) return;

    const amount = parseFloat(adjustForm.amount) * (adjustForm.isAdd ? 1 : -1);
    updateBalance.mutate(
      { bucket: selectedBucket, amount, reason: adjustForm.reason },
      { onSuccess: () => setAdjustDialogOpen(false) }
    );
  };

  if (loadingBuckets || loadingTiers) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pool Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBucketBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all buckets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Escrow</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEscrowBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all tiers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bucket Count</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(bucketBalances ?? []).length}</div>
            <p className="text-xs text-muted-foreground">Active pools</p>
          </CardContent>
        </Card>
      </div>

      {/* Bucket Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Bucket Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bucket</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bucketBalances ?? []).map((bucket: BucketBalance) => (
                <TableRow key={bucket.bucket}>
                  <TableCell>
                    <Badge className={BUCKET_COLORS[bucket.bucket] || ""}>
                      {BUCKET_LABELS[bucket.bucket] || bucket.bucket}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${bucket.balance_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(bucket.updated_at), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAdjustDialog(bucket.bucket)}
                    >
                      Adjust
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tier Escrow Pools */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Escrow Pools</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Cap</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tierPools ?? []).map((tier: TierEscrowPool) => {
                const balance = tier.balance_cents / 100;
                const cap = tier.tier_cap_cents / 100;
                const health = cap > 0 ? (balance / cap) * 100 : 0;
                
                return (
                  <TableRow key={tier.tier}>
                    <TableCell className="font-medium">{tier.tier}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      ${cap.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              health > 75
                                ? "bg-green-500"
                                : health > 50
                                ? "bg-yellow-500"
                                : health > 25
                                ? "bg-orange-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(health, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {health.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(tier.updated_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category Pool Balances */}
      {!loadingCategories && (categoryPools ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Pool Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(categoryPools ?? []).map((cat: CategoryPoolBalance) => (
                  <TableRow key={cat.category}>
                    <TableCell>
                      <Badge variant="outline">{cat.category.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${cat.balance_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(cat.updated_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Adjust Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Adjust {selectedBucket ? BUCKET_LABELS[selectedBucket] || selectedBucket : ""} Balance
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={adjustForm.isAdd ? "default" : "outline"}
                onClick={() => setAdjustForm({ ...adjustForm, isAdd: true })}
                className="flex-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
              <Button
                type="button"
                variant={!adjustForm.isAdd ? "default" : "outline"}
                onClick={() => setAdjustForm({ ...adjustForm, isAdd: false })}
                className="flex-1"
              >
                <Minus className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={adjustForm.amount}
                onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (for audit log)</Label>
              <Textarea
                placeholder="Describe the reason for this adjustment..."
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={!adjustForm.amount || updateBalance.isPending}
            >
              {updateBalance.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Apply Adjustment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
