import { useState } from "react";
import { useAdminProductsWithInventory, useAdminUpdateProduct, useAdminDeleteProduct } from "../../hooks/mutations/useAdminInventory";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Search, MoreHorizontal, Edit, Trash2, Eye, EyeOff, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductsListProps {
  onEditProduct: (productId: string) => void;
  onViewInventory: (productId: string) => void;
}

const CATEGORY_OPTIONS = [
  "POKEMON", "SNEAKERS", "WATCHES", "HANDBAGS", "WINE",
  "CLOTHING", "JEWELLERY", "ART_TOYS", "SPORT_MEMORABILIA"
];

const BAND_COLORS: Record<string, string> = {
  ICON: "bg-blue-500/10 text-blue-500",
  RARE: "bg-purple-500/10 text-purple-500",
  GRAIL: "bg-amber-500/10 text-amber-500",
  MYTHIC: "bg-red-500/10 text-red-500",
};

export function ProductsList({ onEditProduct, onViewInventory }: ProductsListProps) {
  const { data: products, isLoading } = useAdminProductsWithInventory();
  const updateProduct = useAdminUpdateProduct();
  const deleteProduct = useAdminDeleteProduct();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const filteredProducts = (products ?? []).filter((product: {
    name: string;
    brand: string;
    model: string;
    category: string;
    is_active: boolean;
  }) => {
    const matchesSearch = !search || 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.brand.toLowerCase().includes(search.toLowerCase()) ||
      product.model.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && product.is_active) ||
      (statusFilter === "inactive" && !product.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleToggleActive = (productId: string, currentActive: boolean) => {
    updateProduct.mutate({
      productId,
      product: { is_active: !currentActive },
    });
  };

  const handleDelete = () => {
    if (selectedProduct) {
      deleteProduct.mutate(selectedProduct, {
        onSuccess: () => setDeleteDialogOpen(false),
      });
    }
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
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Band</TableHead>
              <TableHead className="text-right">Retail Value</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-center">Inventory</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product: {
                id: string;
                name: string;
                brand: string;
                model: string;
                image_url: string | null;
                category: string;
                band: string;
                retail_value_usd: number;
                expected_fulfillment_cost_usd: number;
                inventory_count: number;
                available_count: number;
                is_active: boolean;
                is_jackpot: boolean;
              }) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.brand} • {product.model}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={BAND_COLORS[product.band] || ""}>
                      {product.band}
                    </Badge>
                    {product.is_jackpot && (
                      <Badge className="ml-1 bg-yellow-500/10 text-yellow-500">
                        Jackpot
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    ${product.retail_value_usd.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${product.expected_fulfillment_cost_usd.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{product.available_count}</span>
                      <span className="text-xs text-muted-foreground">
                        of {product.inventory_count}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditProduct(product.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewInventory(product.id)}>
                          <Package className="mr-2 h-4 w-4" />
                          View Inventory
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(product.id, product.is_active)}
                        >
                          {product.is_active ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedProduct(product.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product. Products with existing inventory or reveals cannot be deleted.
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
