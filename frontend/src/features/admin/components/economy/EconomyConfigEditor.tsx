import { useState } from "react";
import {
  useAdminEconomyConfigs,
  useAdminCreateEconomyConfig,
  useAdminActivateEconomyConfig,
  useAdminDeleteEconomyConfig,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Check, Trash2, Eye, Loader2, Copy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface EconomyConfig {
  id: string;
  version: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  activated_at: string | null;
}

export function EconomyConfigEditor() {
  const { data: configs, isLoading } = useAdminEconomyConfigs();
  const createConfig = useAdminCreateEconomyConfig();
  const activateConfig = useAdminActivateEconomyConfig();
  const deleteConfig = useAdminDeleteEconomyConfig();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<EconomyConfig | null>(null);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    version: "",
    configJson: "{\n  \n}",
  });

  const activeConfig = (configs ?? []).find((c: EconomyConfig) => c.is_active);

  const handleCreate = () => {
    try {
      const config = JSON.parse(createForm.configJson);
      createConfig.mutate(
        { version: createForm.version, config },
        {
          onSuccess: () => {
            setCreateDialogOpen(false);
            setCreateForm({ version: "", configJson: "{\n  \n}" });
          },
        }
      );
    } catch {
      toast.error("Invalid JSON format");
    }
  };

  const handleActivate = (configId: string) => {
    activateConfig.mutate(configId);
  };

  const handleDelete = () => {
    if (selectedDeleteId) {
      deleteConfig.mutate(selectedDeleteId, {
        onSuccess: () => setDeleteDialogOpen(false),
      });
    }
  };

  const handleDuplicate = (config: EconomyConfig) => {
    const newVersion = `${config.version}-copy`;
    setCreateForm({
      version: newVersion,
      configJson: JSON.stringify(config.config, null, 2),
    });
    setCreateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Config Card */}
      {activeConfig && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                Active Configuration
              </CardTitle>
              <Badge variant="default">v{activeConfig.version}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Activated:</span>{" "}
                {activeConfig.activated_at
                  ? format(new Date(activeConfig.activated_at), "MMM d, yyyy HH:mm")
                  : "N/A"}
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>{" "}
                {format(new Date(activeConfig.created_at), "MMM d, yyyy HH:mm")}
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedConfig(activeConfig);
                  setViewDialogOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Config
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Configs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Configuration Versions</CardTitle>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Version
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(configs ?? []).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No configurations found
              </p>
            ) : (
              (configs ?? []).map((config: EconomyConfig) => (
                <div
                  key={config.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    config.is_active ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={config.is_active ? "default" : "outline"}>
                      v{config.version}
                    </Badge>
                    {config.is_active && (
                      <Badge className="bg-green-500/10 text-green-500">Active</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      Created {format(new Date(config.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedConfig(config);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(config)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!config.is_active && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivate(config.id)}
                          disabled={activateConfig.isPending}
                        >
                          Activate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            setSelectedDeleteId(config.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Economy Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Version</Label>
              <Input
                placeholder="e.g. 1.2.0 or 2024-01-release"
                value={createForm.version}
                onChange={(e) => setCreateForm({ ...createForm, version: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Configuration JSON</Label>
              <Textarea
                className="font-mono text-sm h-[300px]"
                placeholder='{"key": "value"}'
                value={createForm.configJson}
                onChange={(e) => setCreateForm({ ...createForm, configJson: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createForm.version || createConfig.isPending}
            >
              {createConfig.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Configuration"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Configuration v{selectedConfig?.version}
              {selectedConfig?.is_active && (
                <Badge className="ml-2 bg-green-500/10 text-green-500">Active</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-sm">
              {selectedConfig && JSON.stringify(selectedConfig.config, null, 2)}
            </pre>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify(selectedConfig?.config, null, 2)
                );
                toast.success("Copied to clipboard");
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy JSON
            </Button>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this configuration version. Active configurations cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
