import { useState } from "react";
import {
  useAdminInventoryItems,
  useAdminUpdateInventoryItem,
  useAdminDeleteInventoryItem,
  useAdminCreateInventoryBatch,
  useAdminSuppliers,
  useAdminProductsWithInventory,
} from "../../hooks/mutations/useAdminInventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Package, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface InventoryTableProps {
  productId?: string | null;
  onBack?: () => void;
}

const STATUS_OPTIONS = [
  { value: "IN_CUSTODY", label: "In Custody", color: "bg-green-500/10 text-green-500" },
  { value: "GUARANTEED_SELLER", label: "Guaranteed Seller", color: "bg-blue-500/10 text-blue-500" },
  { value: "SOFT_LISTING_OK", label: "Soft Listing OK", color: "bg-yellow-500/10 text-yellow-500" },
  { value: "UNAVAILABLE", label: "Unavailable", color: "bg-red-500/10 text-red-500" },
];

export function InventoryTable({ productId, onBack }: InventoryTableProps) {
  const { data: items, isLoading } = useAdminInventoryItems({ productClassId: productId ?? undefined });
  const { data: products } = useAdminProductsWithInventory();
  const { data: suppliers } = useAdminSuppliers();
  const updateItem = useAdminUpdateInventoryItem();
  const deleteItem = useAdminDeleteInventoryItem();
  const createBatch = useAdminCreateInventoryBatch();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Add form state
  const [addForm, setAddForm] = useState({
    productClassId: productId || "",
    quantity: 1,
    status: "IN_CUSTODY",
    supplierId: "",
    costUsd: "",
    notes: "",
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    status: "",
    sku: "",
    notes: "",
  });

  const filteredItems = (items ?? []).filter((item: { status: string }) => {
    return statusFilter === "all" || item.status === statusFilter;
  });

  const currentProduct = products?.find((p: { id: string }) => p.id === productId);

  const handleAddBatch = () => {
    createBatch.mutate(
      {
        productClassId: addForm.productClassId,
        quantity: addForm.quantity,
        status: addForm.status,
        supplierId: addForm.supplierId || undefined,
        costUsd: addForm.costUsd ? parseFloat(addForm.costUsd) : undefined,
        notes: addForm.notes || undefined,
      },
      {
        onSuccess: () => {
          setAddDialogOpen(false);
          setAddForm({
            productClassId: productId || "",
            quantity: 1,
            status: "IN_CUSTODY",
            supplierId: "",
            costUsd: "",
            notes: "",
          });
        },
      }
    );
  };

  const handleEdit = (item: { id: string; status: string; sku: string | null; notes: string | null }) => {
    setSelectedItem(item.id);
    setEditForm({
      status: item.status,
      sku: item.sku || "",
      notes: item.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedItem) return;
    updateItem.mutate(
      {
        itemId: selectedItem,
        item: {
          status: editForm.status,
          sku: editForm.sku || null,
          notes: editForm.notes || null,
        },
      },
      { onSuccess: () => setEditDialogOpen(false) }
    );
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    deleteItem.mutate(selectedItem, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              ← Back
            </Button>
          )}
          {currentProduct && (
            <div className="flex items-center gap-3">
              {currentProduct.image_url ? (
                <img
                  src={currentProduct.image_url}
                  alt={currentProduct.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <h3 className="font-semibold">{currentProduct.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentProduct.brand} • {currentProduct.model}
                </p>
              </div>
            </div>
          )}
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Inventory
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item: {
                id: string;
                sku: string | null;
                status: string;
                cost_usd: number | null;
                reserved_for_award_id: string | null;
                created_at: string;
                notes: string | null;
                product_class: { name: string; brand: string; image_url: string | null } | null;
                supplier: { name: string } | null;
              }) => {
                const statusConfig = STATUS_OPTIONS.find((s) => s.value === item.status);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.product_class?.image_url ? (
                          <img
                            src={item.product_class.image_url}
                            alt=""
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">
                          {item.product_class?.name || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{item.sku || "-"}</code>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig?.color || ""}>
                        {statusConfig?.label || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.supplier?.name || "-"}</TableCell>
                    <TableCell className="text-right">
                      {item.cost_usd ? `$${item.cost_usd.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      {item.reserved_for_award_id ? (
                        <Badge variant="secondary">Reserved</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(item.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            setSelectedItem(item.id);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={!!item.reserved_for_award_id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Inventory Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!productId && (
              <div className="space-y-2">
                <Label>Product</Label>
                <Select
                  value={addForm.productClassId}
                  onValueChange={(v) => setAddForm({ ...addForm, productClassId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {(products ?? []).map((p: { id: string; name: string; brand: string }) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.brand})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={addForm.quantity}
                  onChange={(e) => setAddForm({ ...addForm, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={addForm.status}
                  onValueChange={(v) => setAddForm({ ...addForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  value={addForm.supplierId}
                  onValueChange={(v) => setAddForm({ ...addForm, supplierId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {(suppliers ?? []).map((s: { id: string; name: string }) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cost (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={addForm.costUsd}
                  onChange={(e) => setAddForm({ ...addForm, costUsd: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes..."
                value={addForm.notes}
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddBatch}
              disabled={!addForm.productClassId || createBatch.isPending}
            >
              {createBatch.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${addForm.quantity} Item${addForm.quantity > 1 ? "s" : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Inventory Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                placeholder="Enter SKU"
                value={editForm.sku}
                onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes..."
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateItem.isPending}>
              {updateItem.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this inventory item. Reserved items cannot be deleted.
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
