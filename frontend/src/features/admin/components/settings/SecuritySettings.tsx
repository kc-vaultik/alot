import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  Shield, 
  Search, 
  RefreshCw, 
  Download, 
  User, 
  Package, 
  DollarSign, 
  Settings,
  Loader2,
  Eye
} from "lucide-react";
import { AdminLoadingCard } from "../shared/AdminLoadingCard";
import { cn } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  action: string;
  admin_user_id: string;
  entity_type: string;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  metadata: unknown;
  created_at: string;
}

const ACTION_ICONS: Record<string, typeof User> = {
  user: User,
  room: Package,
  product: Package,
  economy: DollarSign,
  settings: Settings,
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-500/20 text-green-500 border-green-500/30",
  update: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  delete: "bg-red-500/20 text-red-500 border-red-500/30",
  approve: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  reject: "bg-orange-500/20 text-orange-500 border-orange-500/30",
};

export function SecuritySettings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: auditLogs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-audit-logs", entityFilter],
    queryFn: async () => {
      let query = supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (entityFilter && entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });

  const filteredLogs = auditLogs?.filter((log) => {
    if (!searchQuery) return true;
    return (
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin_user_id.includes(searchQuery)
    );
  });

  const getActionColor = (action: string) => {
    const key = Object.keys(ACTION_COLORS).find((k) => action.toLowerCase().includes(k));
    return key ? ACTION_COLORS[key] : "bg-muted text-muted-foreground";
  };

  const getEntityIcon = (entityType: string) => {
    const Icon = ACTION_ICONS[entityType.toLowerCase()] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  const exportLogs = () => {
    if (!auditLogs?.length) return;
    
    const headers = ["Timestamp", "Action", "Entity Type", "Entity ID", "Admin ID"];
    const rows = auditLogs.map((log) => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.action,
      log.entity_type,
      log.entity_id || "",
      log.admin_user_id,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Audit Log
              </CardTitle>
              <CardDescription>
                Track all administrative actions for security and compliance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportLogs} disabled={!auditLogs?.length}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="room">Rooms/Drops</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="kyc">KYC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <AdminLoadingCard variant="table" rows={5} />
          ) : filteredLogs?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead className="w-[60px]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs?.map((log) => (
                    <>
                      <TableRow 
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                      >
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEntityIcon(log.entity_type)}
                            <span>{log.entity_type}</span>
                            {log.entity_id && (
                              <span className="text-xs text-muted-foreground font-mono">
                                #{log.entity_id.slice(0, 8)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.admin_user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRow === log.id && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-muted/30">
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                {log.old_value && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Previous Value</h4>
                                    <pre className="text-xs bg-background p-3 rounded-lg overflow-auto max-h-32">
                                      {JSON.stringify(log.old_value, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.new_value && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">New Value</h4>
                                    <pre className="text-xs bg-background p-3 rounded-lg overflow-auto max-h-32">
                                      {JSON.stringify(log.new_value, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                              {log.metadata && (
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Metadata</h4>
                                  <pre className="text-xs bg-background p-3 rounded-lg overflow-auto max-h-24">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
