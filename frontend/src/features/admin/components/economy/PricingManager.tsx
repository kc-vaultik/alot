import { useState } from "react";
import {
  useAdminCategoryPricing,
  useAdminUpdateCategoryPricing,
  useAdminCreateCategoryPricing,
  useAdminPromoSpend,
} from "../../hooks/mutations/useAdminEconomy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Loader2, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface CategoryPricing {
  id: string;
  category: string;
  tier: string;
  price_cents: number;
  display_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PromoSpend {
  spend_date: string;
  spent_usd: number;
  updated_at: string;
}

const CATEGORY_OPTIONS = [
  "POKEMON", "SNEAKERS", "WATCHES", "HANDBAGS", "WINE",
  "CLOTHING", "JEWELLERY", "ART_TOYS", "SPORT_MEMORABILIA"
];

const TIER_OPTIONS = ["T5", "T10", "T20"];

export function PricingManager() {
  const { data: pricing, isLoading: loadingPricing } = useAdminCategoryPricing();
  const { data: promoSpend, isLoading: loadingPromo } = useAdminPromoSpend(30);
  const updatePricing = useAdminUpdateCategoryPricing();
  const createPricing = useAdminCreateCategoryPricing();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<CategoryPricing | null>(null);
  const [form, setForm] = useState({
    category: "",
    tier: "",
    priceCents: "",
    displayName: "",
    description: "",
    isActive: true,
  });

  const totalPromoSpend = (promoSpend ?? []).reduce(
    (sum: number, p: PromoSpend) => sum + p.spent_usd,
    0
  );

  const openCreateDialog = () => {
    setEditingPricing(null);
    setForm({
      category: "",
      tier: "",
      priceCents: "",
      displayName: "",
      description: "",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: CategoryPricing) => {
    setEditingPricing(item);
    setForm({
      category: item.category,
      tier: item.tier,
      priceCents: String(item.price_cents),
      displayName: item.display_name,
      description: item.description || "",
      isActive: item.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const priceCents = parseInt(form.priceCents);
    if (isNaN(priceCents)) return;

    if (editingPricing) {
      updatePricing.mutate(
        {
          pricingId: editingPricing.id,
          priceCents,
          displayName: form.displayName,
          description: form.description || undefined,
          isActive: form.isActive,
        },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createPricing.mutate(
        {
          category: form.category,
          tier: form.tier,
          priceCents,
          displayName: form.displayName,
          description: form.description || undefined,
          isActive: form.isActive,
        },
        { onSuccess: () => setDialogOpen(false) }
      );
    }
  };

  const isPending = updatePricing.isPending || createPricing.isPending;

  if (loadingPricing) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Promo Spend Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Promo Spend (Last 30 Days)
            </CardTitle>
            <Badge variant="outline" className="text-lg">
              ${totalPromoSpend.toLocaleString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPromo ? (
            <Skeleton className="h-24 w-full" />
          ) : (promoSpend ?? []).length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No promo spend recorded</p>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {(promoSpend ?? []).slice(0, 14).reverse().map((day: PromoSpend) => {
                const maxSpend = Math.max(...(promoSpend ?? []).map((p: PromoSpend) => p.spent_usd), 1);
                const height = (day.spent_usd / maxSpend) * 100;
                return (
                  <div key={day.spend_date} className="flex flex-col items-center gap-1">
                    <div className="h-16 w-full bg-muted rounded-sm relative overflow-hidden">
                      <div
                        className="absolute bottom-0 w-full bg-primary/50 transition-all"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(day.spend_date), "M/d")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Pricing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Category Pricing</CardTitle>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Pricing
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(pricing ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No pricing configured
                  </TableCell>
                </TableRow>
              ) : (
                (pricing ?? []).map((item: CategoryPricing) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline">{item.category.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.tier}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.display_name}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${(item.price_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(item.updated_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPricing ? "Edit Pricing" : "Add Pricing"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingPricing && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select
                    value={form.tier}
                    onValueChange={(v) => setForm({ ...form, tier: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIER_OPTIONS.map((tier) => (
                        <SelectItem key={tier} value={tier}>
                          {tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                placeholder="e.g. Premium Pokemon Pack"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Price (cents)</Label>
              <Input
                type="number"
                placeholder="500 = $5.00"
                value={form.priceCents}
                onChange={(e) => setForm({ ...form, priceCents: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {form.priceCents && !isNaN(parseInt(form.priceCents))
                  ? `= $${(parseInt(form.priceCents) / 100).toFixed(2)}`
                  : "Enter price in cents"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="Brief description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.displayName || !form.priceCents || isPending || (!editingPricing && (!form.category || !form.tier))}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingPricing ? (
                "Update Pricing"
              ) : (
                "Create Pricing"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
