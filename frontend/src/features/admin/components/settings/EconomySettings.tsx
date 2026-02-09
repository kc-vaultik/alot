import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { Save, DollarSign, Percent, TrendingUp } from "lucide-react";

interface EconomySettingsData {
  defaultTier: string;
  minEntryAmount: number;
  maxEntryAmount: number;
  poolContributionRate: number;
  escrowBufferPercent: number;
  autoSettleEnabled: boolean;
  autoSettleDelayMinutes: number;
  refundGracePeriodHours: number;
  maxEntriesPerUser: number;
  dailyFreePullEnabled: boolean;
  rewardMultiplierCap: number;
}

export function EconomySettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<EconomySettingsData>({
    defaultTier: "T10",
    minEntryAmount: 5,
    maxEntryAmount: 100,
    poolContributionRate: 30,
    escrowBufferPercent: 10,
    autoSettleEnabled: true,
    autoSettleDelayMinutes: 60,
    refundGracePeriodHours: 24,
    maxEntriesPerUser: 10,
    dailyFreePullEnabled: true,
    rewardMultiplierCap: 3,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("Settings saved", "Economy settings have been updated.");
    } catch {
      toast.error("Failed to save", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Entry Limits
          </CardTitle>
          <CardDescription>Configure entry amounts and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="defaultTier">Default Tier</Label>
              <Select
                value={settings.defaultTier}
                onValueChange={(value) => setSettings({ ...settings, defaultTier: value })}
              >
                <SelectTrigger id="defaultTier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T5">T5 ($5)</SelectItem>
                  <SelectItem value="T10">T10 ($10)</SelectItem>
                  <SelectItem value="T20">T20 ($20)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minEntry">Min Entry ($)</Label>
              <Input
                id="minEntry"
                type="number"
                value={settings.minEntryAmount}
                onChange={(e) => setSettings({ ...settings, minEntryAmount: parseInt(e.target.value) || 0 })}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxEntry">Max Entry ($)</Label>
              <Input
                id="maxEntry"
                type="number"
                value={settings.maxEntryAmount}
                onChange={(e) => setSettings({ ...settings, maxEntryAmount: parseInt(e.target.value) || 0 })}
                min={1}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxEntriesPerUser">Max Entries Per User</Label>
            <Input
              id="maxEntriesPerUser"
              type="number"
              value={settings.maxEntriesPerUser}
              onChange={(e) => setSettings({ ...settings, maxEntriesPerUser: parseInt(e.target.value) || 1 })}
              min={1}
              max={100}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of entries a single user can have in one drop
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Pool & Escrow
          </CardTitle>
          <CardDescription>Configure pool contributions and escrow settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="poolRate">Pool Contribution Rate (%)</Label>
              <Input
                id="poolRate"
                type="number"
                value={settings.poolContributionRate}
                onChange={(e) => setSettings({ ...settings, poolContributionRate: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                Percentage of revenue contributed to prize pools
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="escrowBuffer">Escrow Buffer (%)</Label>
              <Input
                id="escrowBuffer"
                type="number"
                value={settings.escrowBufferPercent}
                onChange={(e) => setSettings({ ...settings, escrowBufferPercent: parseInt(e.target.value) || 0 })}
                min={0}
                max={50}
              />
              <p className="text-xs text-muted-foreground">
                Additional buffer held in escrow above target
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Automation & Limits
          </CardTitle>
          <CardDescription>Configure automated processes and caps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Settle Drops</Label>
              <p className="text-sm text-muted-foreground">
                Automatically settle drops after deadline
              </p>
            </div>
            <Switch
              checked={settings.autoSettleEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, autoSettleEnabled: checked })}
            />
          </div>
          {settings.autoSettleEnabled && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label>Auto-Settle Delay (minutes)</Label>
              <Input
                type="number"
                value={settings.autoSettleDelayMinutes}
                onChange={(e) => setSettings({ ...settings, autoSettleDelayMinutes: parseInt(e.target.value) || 60 })}
                min={5}
                max={1440}
                className="w-32"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Daily Free Pull</Label>
              <p className="text-sm text-muted-foreground">
                Enable daily free card pull for users
              </p>
            </div>
            <Switch
              checked={settings.dailyFreePullEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, dailyFreePullEnabled: checked })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="refundGrace">Refund Grace Period (hours)</Label>
              <Input
                id="refundGrace"
                type="number"
                value={settings.refundGracePeriodHours}
                onChange={(e) => setSettings({ ...settings, refundGracePeriodHours: parseInt(e.target.value) || 24 })}
                min={0}
                max={168}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rewardCap">Reward Multiplier Cap</Label>
              <Input
                id="rewardCap"
                type="number"
                value={settings.rewardMultiplierCap}
                onChange={(e) => setSettings({ ...settings, rewardMultiplierCap: parseFloat(e.target.value) || 1 })}
                min={1}
                max={10}
                step={0.5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
