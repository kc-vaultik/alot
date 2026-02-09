import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Clock, AlertTriangle, FileText } from "lucide-react";
import { format, isPast, addDays } from "date-fns";
import { useKYCDocuments, useReviewKYC } from "../../hooks/mutations/useAdminUsers";

export function KYCReviewPanel() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedDoc, setSelectedDoc] = useState<{
    id: string;
    user_id: string;
    document_type: string;
    file_url: string;
    file_name: string;
    submitted_at: string;
    expires_at?: string;
    collector_profiles?: { username: string; display_name?: string };
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: documents, isLoading } = useKYCDocuments(statusFilter !== "all" ? statusFilter : undefined);
  const reviewKYC = useReviewKYC();

  const handleApprove = (docId: string) => {
    reviewKYC.mutate({ documentId: docId, action: "approve" });
    setSelectedDoc(null);
  };

  const handleReject = () => {
    if (selectedDoc) {
      reviewKYC.mutate({ documentId: selectedDoc.id, action: "reject", rejectionReason });
      setShowRejectDialog(false);
      setSelectedDoc(null);
      setRejectionReason("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return isPast(new Date(expiresAt)) || new Date(expiresAt) < addDays(new Date(), 30);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> KYC Document Review
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : !documents?.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc: {
                    id: string;
                    user_id: string;
                    document_type: string;
                    status: string;
                    file_url: string;
                    file_name: string;
                    submitted_at: string;
                    expires_at?: string;
                    collector_profiles?: { username: string; display_name?: string };
                  }) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{doc.collector_profiles?.display_name || "—"}</div>
                          <div className="text-sm text-muted-foreground">@{doc.collector_profiles?.username}</div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{doc.document_type.replace("_", " ")}</TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(doc.submitted_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {doc.expires_at ? (
                          <span className={isExpiringSoon(doc.expires_at) ? "text-destructive flex items-center gap-1" : ""}>
                            {isExpiringSoon(doc.expires_at) && <AlertTriangle className="h-3 w-3" />}
                            {format(new Date(doc.expires_at), "MMM d, yyyy")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedDoc(doc)}
                            title="View Document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {doc.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApprove(doc.id)}
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  setShowRejectDialog(true);
                                }}
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog open={!!selectedDoc && !showRejectDialog} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">User:</span>{" "}
                  <span className="font-medium">@{selectedDoc.collector_profiles?.username}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  <span className="font-medium capitalize">{selectedDoc.document_type.replace("_", " ")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted:</span>{" "}
                  <span className="font-medium">{format(new Date(selectedDoc.submitted_at), "PPP")}</span>
                </div>
                {selectedDoc.expires_at && (
                  <div>
                    <span className="text-muted-foreground">Expires:</span>{" "}
                    <span className={`font-medium ${isExpiringSoon(selectedDoc.expires_at) ? "text-destructive" : ""}`}>
                      {format(new Date(selectedDoc.expires_at), "PPP")}
                    </span>
                  </div>
                )}
              </div>
              <div className="border rounded-lg p-4 bg-muted/50 min-h-[300px] flex items-center justify-center">
                {selectedDoc.file_url ? (
                  <img
                    src={selectedDoc.file_url}
                    alt="Document"
                    className="max-h-[400px] object-contain"
                  />
                ) : (
                  <span className="text-muted-foreground">Document preview not available</span>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDoc(null)}>Close</Button>
            <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
              <XCircle className="h-4 w-4 mr-1" /> Reject
            </Button>
            <Button onClick={() => selectedDoc && handleApprove(selectedDoc.id)}>
              <CheckCircle className="h-4 w-4 mr-1" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this document. This will be visible to the user.
            </p>
            <Textarea
              placeholder="Rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
