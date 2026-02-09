import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/useToast";
import { Save, Bell, AlertTriangle, DollarSign, Users } from "lucide-react";

interface NotificationSettingsData {
  emailNotifications: boolean;
  slackIntegration: boolean;
  slackWebhookUrl: string;
  lowPoolThreshold: number;
  highSpenderThreshold: number;
  newUserAlert: boolean;
  kycSubmissionAlert: boolean;
  largeTransactionThreshold: number;
  dropEndingAlert: boolean;
  dropEndingMinutes: number;
}

export function NotificationSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettingsData>({
    emailNotifications: true,
    slackIntegration: false,
    slackWebhookUrl: "",
    lowPoolThreshold: 1000,
    highSpenderThreshold: 500,
    newUserAlert: true,
    kycSubmissionAlert: true,
    largeTransactionThreshold: 100,
    dropEndingAlert: true,
    dropEndingMinutes: 30,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("Settings saved", "Notification settings have been updated.");
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
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>Configure how you receive admin alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive alerts via email
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Slack Integration</Label>
              <p className="text-sm text-muted-foreground">
                Send alerts to a Slack channel
              </p>
            </div>
            <Switch
              checked={settings.slackIntegration}
              onCheckedChange={(checked) => setSettings({ ...settings, slackIntegration: checked })}
            />
          </div>
          {settings.slackIntegration && (
            <div className="space-y-2">
              <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
              <Input
                id="slackWebhook"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={settings.slackWebhookUrl}
                onChange={(e) => setSettings({ ...settings, slackWebhookUrl: e.target.value })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alert Thresholds
          </CardTitle>
          <CardDescription>Set thresholds for automatic alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Low Pool Balance Alert</Label>
              <span className="text-sm font-medium">${settings.lowPoolThreshold}</span>
            </div>
            <Slider
              value={[settings.lowPoolThreshold]}
              onValueChange={([value]) => setSettings({ ...settings, lowPoolThreshold: value })}
              min={100}
              max={10000}
              step={100}
            />
            <p className="text-xs text-muted-foreground">
              Alert when any pool drops below this amount
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Large Transaction Alert</Label>
              <span className="text-sm font-medium">${settings.largeTransactionThreshold}</span>
            </div>
            <Slider
              value={[settings.largeTransactionThreshold]}
              onValueChange={([value]) => setSettings({ ...settings, largeTransactionThreshold: value })}
              min={10}
              max={1000}
              step={10}
            />
            <p className="text-xs text-muted-foreground">
              Alert for transactions above this amount
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>High Spender Threshold</Label>
              <span className="text-sm font-medium">${settings.highSpenderThreshold}</span>
            </div>
            <Slider
              value={[settings.highSpenderThreshold]}
              onValueChange={([value]) => setSettings({ ...settings, highSpenderThreshold: value })}
              min={100}
              max={5000}
              step={50}
            />
            <p className="text-xs text-muted-foreground">
              Flag users who spend more than this total
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Event Alerts
          </CardTitle>
          <CardDescription>Choose which events trigger notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>New User Registration</Label>
              <p className="text-sm text-muted-foreground">Alert on new signups</p>
            </div>
            <Switch
              checked={settings.newUserAlert}
              onCheckedChange={(checked) => setSettings({ ...settings, newUserAlert: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>KYC Document Submission</Label>
              <p className="text-sm text-muted-foreground">Alert when users submit KYC</p>
            </div>
            <Switch
              checked={settings.kycSubmissionAlert}
              onCheckedChange={(checked) => setSettings({ ...settings, kycSubmissionAlert: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Drop Ending Soon</Label>
              <p className="text-sm text-muted-foreground">Alert before drops end</p>
            </div>
            <Switch
              checked={settings.dropEndingAlert}
              onCheckedChange={(checked) => setSettings({ ...settings, dropEndingAlert: checked })}
            />
          </div>
          {settings.dropEndingAlert && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label>Alert Before (minutes)</Label>
              <Input
                type="number"
                value={settings.dropEndingMinutes}
                onChange={(e) => setSettings({ ...settings, dropEndingMinutes: parseInt(e.target.value) || 30 })}
                min={5}
                max={120}
                className="w-24"
              />
            </div>
          )}
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
