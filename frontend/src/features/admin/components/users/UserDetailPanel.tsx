import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Shield, ShieldOff, Ban, UserCheck, Plus, Minus, Bell, Trash2, CreditCard, Package } from "lucide-react";
import { format } from "date-fns";
import {
  useAdminUserDetail,
  useUpdateUserStatus,
  useAddUserRole,
  useRemoveUserRole,
  useRevokeCards,
  useAdjustCredits,
  useSendNotification,
} from "../../hooks/mutations/useAdminUsers";
import type { AppRole } from "../../types";

interface UserDetailPanelProps {
  userId: string;
  onClose: () => void;
}

export function UserDetailPanel({ userId, onClose }: UserDetailPanelProps) {
  const { data: user, isLoading } = useAdminUserDetail(userId);
  const updateStatus = useUpdateUserStatus();
  const addRole = useAddUserRole();
  const removeRole = useRemoveUserRole();
  const revokeCards = useRevokeCards();
  const adjustCredits = useAdjustCredits();
  const sendNotification = useSendNotification();

  const [statusReason, setStatusReason] = useState("");
  const [newRole, setNewRole] = useState<AppRole | "">("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [revokeReason, setRevokeReason] = useState("");

  if (isLoading) {
    return (
      <Card className="fixed right-0 top-0 h-full w-[600px] z-50 rounded-none shadow-2xl">
        <CardContent className="flex items-center justify-center h-full">
          Loading user details...
        </CardContent>
      </Card>
    );
  }

  if (!user) return null;

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({ userId, status: newStatus, reason: statusReason || undefined });
    setStatusReason("");
  };

  const handleAddRole = () => {
    if (newRole) {
      addRole.mutate({ userId, role: newRole as AppRole });
      setNewRole("");
    }
  };

  const handleRemoveRole = (role: AppRole) => {
    removeRole.mutate({ userId, role });
  };

  const handleAdjustCredits = (positive: boolean) => {
    const amount = positive ? Math.abs(Number(creditAmount)) : -Math.abs(Number(creditAmount));
    adjustCredits.mutate({ userId, amount, reason: creditReason });
    setCreditAmount("");
    setCreditReason("");
  };

  const handleSendNotification = () => {
    sendNotification.mutate({ userId, title: notifTitle, message: notifMessage });
    setNotifTitle("");
    setNotifMessage("");
  };

  const handleRevokeCards = () => {
    revokeCards.mutate({ userId, revealIds: selectedCards, reason: revokeReason });
    setSelectedCards([]);
    setRevokeReason("");
  };

  const currentRoles = user.roles?.map((r: { role: string }) => r.role) ?? [];
  const availableRoles: AppRole[] = (["admin", "moderator", "user"] as AppRole[]).filter(
    (r) => !currentRoles.includes(r)
  );

  return (
    <Card className="fixed right-0 top-0 h-full w-[700px] z-50 rounded-none shadow-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div>
          <CardTitle>{user.profile?.display_name || "User Details"}</CardTitle>
          <p className="text-sm text-muted-foreground">@{user.profile?.username}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <CardContent className="p-6 space-y-6">
          {/* Status & Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{user.cards?.length ?? 0}</div>
                <div className="text-xs text-muted-foreground">Cards</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">${user.totalSpent?.toFixed(0) ?? 0}</div>
                <div className="text-xs text-muted-foreground">Spent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{user.universalCredits ?? 0}</div>
                <div className="text-xs text-muted-foreground">Credits</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{user.awards?.length ?? 0}</div>
                <div className="text-xs text-muted-foreground">Awards</div>
              </CardContent>
            </Card>
          </div>

          {/* Status Management */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={user.profile?.status === "active" ? "default" : "destructive"}>
                  {user.profile?.status || "active"}
                </Badge>
                {currentRoles.map((role: string) => (
                  <Badge key={role} variant="outline" className="gap-1">
                    {role}
                    <button onClick={() => handleRemoveRole(role as AppRole)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Reason for status change..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="flex-1"
                />
                {user.profile?.status === "active" ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange("suspended")}>
                      <ShieldOff className="h-4 w-4 mr-1" /> Suspend
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange("banned")}>
                      <Ban className="h-4 w-4 mr-1" /> Ban
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="default" onClick={() => handleStatusChange("active")}>
                    <UserCheck className="h-4 w-4 mr-1" /> Reactivate
                  </Button>
                )}
              </div>
              {availableRoles.length > 0 && (
                <div className="flex gap-2">
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Add role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddRole} disabled={!newRole}>
                    <Plus className="h-4 w-4 mr-1" /> Add Role
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="cards">
            <TabsList className="w-full">
              <TabsTrigger value="cards" className="flex-1">Cards</TabsTrigger>
              <TabsTrigger value="purchases" className="flex-1">Purchases</TabsTrigger>
              <TabsTrigger value="credits" className="flex-1">Credits</TabsTrigger>
              <TabsTrigger value="logs" className="flex-1">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="cards" className="space-y-4">
              {selectedCards.length > 0 && (
                <div className="flex gap-2 items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">{selectedCards.length} selected</span>
                  <Input
                    placeholder="Revocation reason..."
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" variant="destructive" onClick={handleRevokeCards} disabled={!revokeReason}>
                    <Trash2 className="h-4 w-4 mr-1" /> Revoke
                  </Button>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Band</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.cards?.slice(0, 20).map((card: { id: string; product_classes?: { name: string }; band: string; card_state: string; created_at: string }) => (
                    <TableRow key={card.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedCards.includes(card.id)}
                          onChange={(e) => {
                            setSelectedCards(e.target.checked
                              ? [...selectedCards, card.id]
                              : selectedCards.filter((id) => id !== card.id)
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{card.product_classes?.name}</TableCell>
                      <TableCell><Badge variant="outline">{card.band}</Badge></TableCell>
                      <TableCell>{card.card_state}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(card.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="purchases">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.purchases?.map((purchase: { id: string; created_at: string; tier: string; quantity: number; total_price_usd: number }) => (
                    <TableRow key={purchase.id}>
                      <TableCell>{format(new Date(purchase.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell><Badge>{purchase.tier}</Badge></TableCell>
                      <TableCell>{purchase.quantity}</TableCell>
                      <TableCell className="text-right">${purchase.total_price_usd}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="credits" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Universal Credits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">{user.universalCredits ?? 0}</div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="w-24"
                    />
                    <Input
                      placeholder="Reason for adjustment..."
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAdjustCredits(true)}
                      disabled={!creditAmount || !creditReason}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdjustCredits(false)}
                      disabled={!creditAmount || !creditReason}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {user.productCredits?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" /> Product Credits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        {user.productCredits.map((pc: { product_class_id: string; product_classes?: { name: string }; credits: number }) => (
                          <TableRow key={pc.product_class_id}>
                            <TableCell>{pc.product_classes?.name}</TableCell>
                            <TableCell className="text-right font-medium">{pc.credits}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="logs">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.moderationLogs?.map((log: { id: string; created_at: string; action: string; reason?: string }) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(log.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                      <TableCell>{log.reason || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>

          {/* Send Notification */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" /> Send Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Title"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
              />
              <Textarea
                placeholder="Message..."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
              />
              <Button onClick={handleSendNotification} disabled={!notifTitle || !notifMessage}>
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
