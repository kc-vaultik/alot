import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAdminCreateRoom } from "../../hooks/mutations/useAdminRoomActions";
import { useAdminProductClasses } from "../../hooks/data/useProductClasses";
import { TIER_OPTIONS } from "../../constants";
import { Loader2, ChevronRight, ChevronLeft, Check, Sparkles, Package, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

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

const DROP_TEMPLATES = [
  {
    id: "standard",
    name: "Standard Drop",
    description: "Regular lottery-style drop",
    defaults: { is_mystery: false, min_participants: 10, max_participants: 100 },
  },
  {
    id: "mystery",
    name: "Mystery Drop",
    description: "Hidden prize until unlock",
    defaults: { is_mystery: true, min_participants: 20, max_participants: 200 },
  },
  {
    id: "high-value",
    name: "High-Value Drop",
    description: "Premium items with higher escrow",
    defaults: { is_mystery: false, min_participants: 50, max_participants: 500, tier: "T20" },
  },
  {
    id: "flash",
    name: "Flash Drop",
    description: "Quick 24-hour drop",
    defaults: { is_mystery: false, min_participants: 5, max_participants: 50 },
  },
];

const STEPS = [
  { id: 1, label: "Template", icon: Sparkles },
  { id: 2, label: "Product", icon: Package },
  { id: 3, label: "Schedule", icon: Calendar },
  { id: 4, label: "Funding", icon: DollarSign },
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

interface DropCreatorWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  duplicateFrom?: Partial<DropFormValues>;
}

export function DropCreatorWizard({ open, onClose, onSuccess, duplicateFrom }: DropCreatorWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const createDrop = useAdminCreateRoom();
  const { data: productClasses, isLoading: loadingProducts } = useAdminProductClasses();

  const tierDefaults: Record<string, { escrow: number; cap: number }> = {
    T5: { escrow: 50000, cap: 100000 },
    T10: { escrow: 100000, cap: 200000 },
    T20: { escrow: 200000, cap: 400000 },
  };

  const form = useForm<DropFormValues>({
    resolver: zodResolver(dropSchema),
    defaultValues: duplicateFrom || {
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

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = DROP_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      Object.entries(template.defaults).forEach(([key, value]) => {
        form.setValue(key as keyof DropFormValues, value as any);
      });
      // Update tier defaults if tier changed
      if (template.defaults.tier) {
        const defaults = tierDefaults[template.defaults.tier as string];
        if (defaults) {
          form.setValue("escrow_target_cents", defaults.escrow);
          form.setValue("tier_cap_cents", defaults.cap);
        }
      }
    }
    setCurrentStep(2);
  };

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
      setCurrentStep(1);
      setSelectedTemplate(null);
      onClose();
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedTemplate !== null;
      case 2:
        return true; // Product is optional
      case 3:
        return form.watch("start_at") && form.watch("end_at");
      case 4:
        return true;
      default:
        return false;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {duplicateFrom ? "Duplicate Drop" : "Create New Drop"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs transition-colors",
                    isActive && "text-primary font-medium",
                    isComplete && "text-primary/70 cursor-pointer hover:text-primary",
                    !isActive && !isComplete && "text-muted-foreground"
                  )}
                  disabled={step.id > currentStep}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      isActive && "bg-primary text-primary-foreground",
                      isComplete && "bg-primary/20 text-primary",
                      !isActive && !isComplete && "bg-muted"
                    )}
                  >
                    {isComplete ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  </div>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Step 1: Template Selection */}
            {currentStep === 1 && (
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Choose a template to get started quickly
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {DROP_TEMPLATES.map((template) => (
                    <Card
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary/50",
                        selectedTemplate === template.id && "border-primary bg-primary/5"
                      )}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Product Selection */}
            {currentStep === 2 && (
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                </div>

                <FormField
                  control={form.control}
                  name="is_mystery"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 rounded-lg border p-4">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel className="!mt-0">Mystery Drop</FormLabel>
                        <FormDescription>
                          Prize is hidden until the drop is unlocked
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="product_class_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{watchIsMystery ? "Revealed Product" : "Prize Product"}</FormLabel>
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
                        <FormLabel>Mystery Placeholder</FormLabel>
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
            )}

            {/* Step 3: Schedule */}
            {currentStep === 3 && (
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
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

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="lock_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lock Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormDescription>When entries are locked</FormDescription>
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
                        <FormDescription>Final deadline for entries</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
              </div>
            )}

            {/* Step 4: Funding */}
            {currentStep === 4 && (
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="escrow_target_cents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Escrow Target *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          ${((field.value || 0) / 100).toFixed(2)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tier_cap_cents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tier Cap *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          ${((field.value || 0) / 100).toFixed(2)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="funding_target_cents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funding Target</FormLabel>
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
                        <FormLabel>Reward Budget</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {currentStep === 1 ? "Cancel" : "Back"}
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed()}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={createDrop.isPending}>
                  {createDrop.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Drop
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
