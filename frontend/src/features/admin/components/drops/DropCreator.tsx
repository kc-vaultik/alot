import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAdminCreateRoom } from "../../hooks/mutations/useAdminRoomActions";
import { useAdminProductClasses } from "../../hooks/data/useProductClasses";
import { TIER_OPTIONS } from "../../constants";
import { Loader2, Plus } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "POKEMON", label: "Pokemon" },
  { value: "SNEAKERS", label: "Sneakers" },
  { value: "WATCHES", label: "Watches" },
  { value: "HANDBAGS", label: "Handbags" },
  { value: "WINE", label: "Wine" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "JEWELLERY", label: "Jewellery" },
  { value: "ART_TOYS", label: "Art Toys" },
  { value: "SPORT_MEMORABILIA", label: "Sports Memorabilia" },
];

const dropSchema = z.object({
  tier: z.enum(["T5", "T10", "T20"]),
  category: z.string().optional(),
  product_class_id: z.string().optional(),
  mystery_product_id: z.string().optional(),
  is_mystery: z.boolean().default(false),
  start_at: z.string().min(1, "Start date required"),
  end_at: z.string().min(1, "End date required"),
  lock_at: z.string().optional(),
  deadline_at: z.string().optional(),
  min_participants: z.coerce.number().min(1).default(10),
  max_participants: z.coerce.number().min(1).default(100),
  escrow_target_cents: z.coerce.number().min(0),
  tier_cap_cents: z.coerce.number().min(0),
  funding_target_cents: z.coerce.number().optional(),
  reward_budget_cents: z.coerce.number().optional(),
  leaderboard_visibility: z.string().optional(),
});

type DropFormValues = z.infer<typeof dropSchema>;

interface DropCreatorProps {
  onSuccess?: () => void;
}

export function DropCreator({ onSuccess }: DropCreatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const createDrop = useAdminCreateRoom();
  const { data: productClasses, isLoading: loadingProducts } = useAdminProductClasses();

  const tierDefaults: Record<string, { escrow: number; cap: number }> = {
    T5: { escrow: 50000, cap: 100000 },
    T10: { escrow: 100000, cap: 200000 },
    T20: { escrow: 200000, cap: 400000 },
  };

  const form = useForm<DropFormValues>({
    resolver: zodResolver(dropSchema),
    defaultValues: {
      tier: "T10",
      is_mystery: false,
      min_participants: 10,
      max_participants: 100,
      escrow_target_cents: 100000,
      tier_cap_cents: 200000,
      leaderboard_visibility: "after_close",
    },
  });

  const watchTier = form.watch("tier");
  const watchIsMystery = form.watch("is_mystery");

  const handleTierChange = (tier: string) => {
    const defaults = tierDefaults[tier];
    if (defaults) {
      form.setValue("escrow_target_cents", defaults.escrow);
      form.setValue("tier_cap_cents", defaults.cap);
    }
  };

  const onSubmit = async (values: DropFormValues) => {
    try {
      await createDrop.mutateAsync({
        ...values,
        tier: values.tier,
        is_mystery: values.is_mystery,
        start_at: values.start_at,
        end_at: values.end_at,
        min_participants: values.min_participants,
        max_participants: values.max_participants,
        escrow_target_cents: values.escrow_target_cents,
        tier_cap_cents: values.tier_cap_cents,
      });
      form.reset();
      setIsExpanded(false);
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  if (!isExpanded) {
    return (
      <Button onClick={() => setIsExpanded(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create New Drop
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Create New Drop</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
          Cancel
        </Button>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tier & Category */}
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="tier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        handleTierChange(v);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_mystery"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 pt-8">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Mystery Drop</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Product Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="product_class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{watchIsMystery ? "Revealed Product (after unlock)" : "Prize Product *"}</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange} disabled={loadingProducts}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingProducts ? "Loading..." : "Select product"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productClasses?.map((pc) => (
                          <SelectItem key={pc.id} value={pc.id}>
                            {pc.name} ({pc.brand}) - ${(pc.retail_value_usd ?? 0).toFixed(0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchIsMystery && (
                <FormField
                  control={form.control}
                  name="mystery_product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mystery Placeholder Product</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange} disabled={loadingProducts}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mystery placeholder" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productClasses?.map((pc) => (
                            <SelectItem key={pc.id} value={pc.id}>
                              {pc.name} ({pc.brand})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="start_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lock_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lock Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Funding & Participants */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="escrow_target_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escrow Target (cents) *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      ${((field.value || 0) / 100).toFixed(2)}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tier_cap_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier Cap (cents) *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      ${((field.value || 0) / 100).toFixed(2)}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Participants</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Participants</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Optional: Funding Target & Reward Budget */}
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="funding_target_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Target (cents)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reward_budget_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Budget (cents)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leaderboard_visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leaderboard Visibility</FormLabel>
                    <Select value={field.value || "after_close"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="always">Always Visible</SelectItem>
                        <SelectItem value="after_lock">After Lock</SelectItem>
                        <SelectItem value="after_close">After Close</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsExpanded(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDrop.isPending}>
                {createDrop.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Drop
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Legacy alias
export { DropCreator as RoomCreator };
