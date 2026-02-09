import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/useToast";
import { Save, Palette, Layout, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisplaySettingsData {
  theme: "light" | "dark" | "system";
  accentColor: string;
  sidebarPosition: "left" | "right";
  compactMode: boolean;
  tableRowsPerPage: number;
  animationsEnabled: boolean;
  showTooltips: boolean;
  dateFormat: string;
  currency: string;
}

const ACCENT_COLORS = [
  { name: "Blue", value: "blue", class: "bg-blue-500" },
  { name: "Purple", value: "purple", class: "bg-purple-500" },
  { name: "Green", value: "green", class: "bg-green-500" },
  { name: "Orange", value: "orange", class: "bg-orange-500" },
  { name: "Pink", value: "pink", class: "bg-pink-500" },
  { name: "Teal", value: "teal", class: "bg-teal-500" },
];

export function DisplaySettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<DisplaySettingsData>({
    theme: "system",
    accentColor: "blue",
    sidebarPosition: "left",
    compactMode: false,
    tableRowsPerPage: 10,
    animationsEnabled: true,
    showTooltips: true,
    dateFormat: "MMM d, yyyy",
    currency: "USD",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("Settings saved", "Display preferences have been updated.");
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
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the admin panel appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Theme</Label>
            <RadioGroup
              value={settings.theme}
              onValueChange={(value) => setSettings({ ...settings, theme: value as "light" | "dark" | "system" })}
              className="grid grid-cols-3 gap-4"
            >
              <Label
                htmlFor="theme-light"
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  settings.theme === "light" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                <Sun className="h-6 w-6" />
                <span className="text-sm">Light</span>
              </Label>
              <Label
                htmlFor="theme-dark"
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  settings.theme === "dark" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                <Moon className="h-6 w-6" />
                <span className="text-sm">Dark</span>
              </Label>
              <Label
                htmlFor="theme-system"
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  settings.theme === "system" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                <Monitor className="h-6 w-6" />
                <span className="text-sm">System</span>
              </Label>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Accent Color</Label>
            <div className="flex gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSettings({ ...settings, accentColor: color.value })}
                  className={cn(
                    "w-10 h-10 rounded-full transition-all",
                    color.class,
                    settings.accentColor === color.value 
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" 
                      : "opacity-70 hover:opacity-100"
                  )}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Layout
          </CardTitle>
          <CardDescription>Configure layout preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing for more content visibility
              </p>
            </div>
            <Switch
              checked={settings.compactMode}
              onCheckedChange={(checked) => setSettings({ ...settings, compactMode: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Animations</Label>
              <p className="text-sm text-muted-foreground">
                Smooth transitions and animations
              </p>
            </div>
            <Switch
              checked={settings.animationsEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, animationsEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Tooltips</Label>
              <p className="text-sm text-muted-foreground">
                Display helpful hints on hover
              </p>
            </div>
            <Switch
              checked={settings.showTooltips}
              onCheckedChange={(checked) => setSettings({ ...settings, showTooltips: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Table Rows Per Page</Label>
            <Select
              value={settings.tableRowsPerPage.toString()}
              onValueChange={(value) => setSettings({ ...settings, tableRowsPerPage: parseInt(value) })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 rows</SelectItem>
                <SelectItem value="25">25 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
                <SelectItem value="100">100 rows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formatting</CardTitle>
          <CardDescription>Date and currency display preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(value) => setSettings({ ...settings, dateFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MMM d, yyyy">Dec 20, 2025</SelectItem>
                  <SelectItem value="dd/MM/yyyy">20/12/2025</SelectItem>
                  <SelectItem value="MM/dd/yyyy">12/20/2025</SelectItem>
                  <SelectItem value="yyyy-MM-dd">2025-12-20</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={settings.currency}
                onValueChange={(value) => setSettings({ ...settings, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                </SelectContent>
              </Select>
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
