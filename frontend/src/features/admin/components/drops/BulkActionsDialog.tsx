import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAdminCancelRoom, useAdminExtendDeadline } from "../../hooks/mutations/useAdminRoomActions";
import { Loader2, XCircle, Clock, AlertTriangle } from "lucide-react";
import type { Room } from "../../types";

interface BulkActionsDialogProps {
  selectedDrops: Room[];
  action: "cancel" | "extend" | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkActionsDialog({ selectedDrops, action, onClose, onSuccess }: BulkActionsDialogProps) {
  const [newDeadline, setNewDeadline] = useState("");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ id: string; success: boolean; error?: string }[]>([]);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const cancelDrop = useAdminCancelRoom();
  const extendDeadline = useAdminExtendDeadline();

  const handleBulkAction = async () => {
    setProcessing(true);
    const newResults: typeof results = [];

    for (const drop of selectedDrops) {
      try {
        if (action === "cancel") {
          await cancelDrop.mutateAsync(drop.id);
        } else if (action === "extend" && newDeadline) {
          await extendDeadline.mutateAsync({
            roomId: drop.id,
            newDeadline: new Date(newDeadline).toISOString(),
          });
        }
        newResults.push({ id: drop.id, success: true });
      } catch (error) {
        newResults.push({
          id: drop.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    setResults(newResults);
    setProcessing(false);

    const allSuccess = newResults.every((r) => r.success);
    if (allSuccess) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <Dialog open={action !== null} onOpenChange={() => !processing && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === "cancel" ? (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                Cancel {selectedDrops.length} Drops
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-primary" />
                Extend {selectedDrops.length} Drops
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {action === "cancel"
              ? "This will cancel all selected drops. This action cannot be undone."
              : "Set a new deadline for all selected drops."}
          </DialogDescription>
        </DialogHeader>

        {results.length === 0 ? (
          <div className="space-y-4 py-4">
            {/* Selected drops preview */}
            <div>
              <Label>Selected Drops</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedDrops.slice(0, 5).map((drop) => (
                  <Badge key={drop.id} variant="secondary">
                    {drop.tier} - {drop.id.slice(0, 8)}
                  </Badge>
                ))}
                {selectedDrops.length > 5 && (
                  <Badge variant="outline">+{selectedDrops.length - 5} more</Badge>
                )}
              </div>
            </div>

            {action === "extend" && (
              <div>
                <Label htmlFor="bulk-deadline">New Deadline</Label>
                <Input
                  id="bulk-deadline"
                  type="datetime-local"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}

            {action === "cancel" && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Warning</p>
                  <p className="text-muted-foreground">
                    Cancelling drops will require refunding all entrants. Make sure this is intended.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="confirm-bulk"
                checked={confirmChecked}
                onCheckedChange={(c) => setConfirmChecked(c === true)}
              />
              <Label htmlFor="confirm-bulk" className="text-sm">
                I understand this action affects {selectedDrops.length} drops
              </Label>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{successCount}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
              {failCount > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{failCount}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              )}
            </div>

            {failCount > 0 && (
              <div className="space-y-2">
                <Label>Failed Operations</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {results
                    .filter((r) => !r.success)
                    .map((r) => (
                      <div key={r.id} className="text-sm text-destructive">
                        {r.id.slice(0, 8)}: {r.error}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {results.length === 0 ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={processing}>
                Cancel
              </Button>
              <Button
                variant={action === "cancel" ? "destructive" : "default"}
                onClick={handleBulkAction}
                disabled={processing || !confirmChecked || (action === "extend" && !newDeadline)}
              >
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {action === "cancel" ? "Cancel All" : "Extend All"}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
