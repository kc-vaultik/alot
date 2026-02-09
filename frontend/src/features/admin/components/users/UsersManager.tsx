import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAdminUsers } from "../../hooks/data/useUsersData";
import { USER_STATUS_OPTIONS } from "../../constants";
import { format } from "date-fns";
import { 
  MoreHorizontal, 
  Download, 
  Shield, 
  ShieldOff, 
  Ban, 
  Eye, 
  Loader2,
  StickyNote,
  Tag,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminUser } from "../../types";

interface UsersManagerProps {
  onSelectUser?: (userId: string) => void;
}

export function UsersManager({ onSelectUser }: UsersManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkActionDialog, setBulkActionDialog] = useState<"note" | "tag" | null>(null);
  const [noteText, setNoteText] = useState("");
  const [tagText, setTagText] = useState("");

  const { data: users, isLoading } = useAdminUsers({ 
    search: searchQuery, 
    role: roleFilter || undefined 
  });

  const filteredUsers = users;

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedUsers(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === (filteredUsers?.length ?? 0)) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers?.map((u) => u.id) ?? []));
    }
  };

  const exportToCSV = () => {
    if (!users?.length) return;

    const headers = ["ID", "Username", "Display Name", "Status", "Roles", "Card Count", "Total Spent", "Created"];
    const rows = users.map((user) => [
      user.id,
      user.profile?.username || "N/A",
      user.profile?.display_name || "",
      user.status,
      user.roles.join("; "),
      user.card_count.toString(),
      user.total_spent_usd.toFixed(2),
      format(new Date(user.created_at), "yyyy-MM-dd HH:mm"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkNote = () => {
    // In a real implementation, this would save notes via an API
    console.log("Adding note to users:", Array.from(selectedUsers), noteText);
    setBulkActionDialog(null);
    setNoteText("");
    setSelectedUsers(new Set());
  };

  const handleBulkTag = () => {
    // In a real implementation, this would add tags via an API
    console.log("Adding tag to users:", Array.from(selectedUsers), tagText);
    setBulkActionDialog(null);
    setTagText("");
    setSelectedUsers(new Set());
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      case "moderator":
        return "bg-purple-500/20 text-purple-500 border-purple-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "suspended":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "banned":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {selectedUsers.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkActionDialog("note")}
              >
                <StickyNote className="mr-2 h-4 w-4" />
                Add Note ({selectedUsers.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkActionDialog("tag")}
              >
                <Tag className="mr-2 h-4 w-4" />
                Add Tag ({selectedUsers.size})
              </Button>
            </>
          )}
          <Button variant="outline" onClick={exportToCSV} disabled={!users?.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No users found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.size === (filteredUsers?.length ?? 0) && filteredUsers?.length! > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Cards</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow
                    key={user.id}
                    className={cn(
                      selectedUsers.has(user.id) && "bg-muted/50",
                      "cursor-pointer"
                    )}
                    onClick={() => onSelectUser?.(user.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleSelect(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profile?.avatar_url ?? undefined} />
                          <AvatarFallback>
                            {(user.profile?.username || "??").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.profile?.display_name || user.profile?.username || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">@{user.profile?.username || "unknown"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeColor(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant="outline"
                            className={cn("text-xs", getRoleBadgeColor(role))}
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{user.card_count}</TableCell>
                    <TableCell>
                      ${user.total_spent_usd.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSelectUser?.(user.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserCog className="mr-2 h-4 w-4" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!user.roles.includes("moderator") && (
                            <DropdownMenuItem>
                              <Shield className="mr-2 h-4 w-4" />
                              Make Moderator
                            </DropdownMenuItem>
                          )}
                          {user.roles.includes("moderator") && (
                            <DropdownMenuItem className="text-yellow-500">
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Remove Moderator
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Ban className="mr-2 h-4 w-4" />
                            {user.status === "banned" ? "Unban User" : "Ban User"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bulk Note Dialog */}
      <Dialog open={bulkActionDialog === "note"} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note to {selectedUsers.size} Users</DialogTitle>
            <DialogDescription>
              This note will be visible to admins on each user's profile.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter a note about these users..."
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleBulkNote} disabled={!noteText.trim()}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Tag Dialog */}
      <Dialog open={bulkActionDialog === "tag"} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag to {selectedUsers.size} Users</DialogTitle>
            <DialogDescription>
              Tags help categorize users for filtering and reporting.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="tag">Tag Name</Label>
            <Input
              id="tag"
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              placeholder="e.g., VIP, Beta Tester, High Spender"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleBulkTag} disabled={!tagText.trim()}>
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
