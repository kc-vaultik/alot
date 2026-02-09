import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAdminCreateProduct,
  useAdminUpdateProduct,
  useAdminProductsWithInventory,
  useProductImageUpload,
} from "../../hooks/mutations/useAdminInventory";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Loader2 } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "POKEMON", label: "Pokemon" },
  { value: "SNEAKERS", label: "Sneakers" },
  { value: "WATCHES", label: "Watches" },
  { value: "HANDBAGS", label: "Handbags" },
  { value: "WINE", label: "Wine" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "JEWELLERY", label: "Jewellery" },
  { value: "ART_TOYS", label: "Art Toys" },
  { value: "SPORT_MEMORABILIA", label: "Sport Memorabilia" },
];

const BAND_OPTIONS = [
  { value: "ICON", label: "Icon" },
  { value: "RARE", label: "Rare" },
  { value: "GRAIL", label: "Grail" },
  { value: "MYTHIC", label: "Mythic" },
];

const BUCKET_OPTIONS = [
  { value: "microWins", label: "Micro Wins" },
  { value: "midWins", label: "Mid Wins" },
  { value: "services", label: "Services" },
  { value: "jackpot", label: "Jackpot" },
  { value: "superJackpot", label: "Super Jackpot" },
  { value: "reserve", label: "Reserve" },
  { value: "promo", label: "Promo" },
];

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  description: z.string().optional(),
  image_url: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  band: z.string().min(1, "Band is required"),
  bucket: z.string().min(1, "Bucket is required"),
  retail_value_usd: z.coerce.number().min(0, "Must be positive"),
  expected_fulfillment_cost_usd: z.coerce.number().min(0, "Must be positive"),
  is_active: z.boolean().default(true),
  is_jackpot: z.boolean().default(false),
  traits: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductEditorProps {
  productId?: string | null;
  open: boolean;
  onClose: () => void;
}

export function ProductEditor({ productId, open, onClose }: ProductEditorProps) {
  const { data: products } = useAdminProductsWithInventory();
  const createProduct = useAdminCreateProduct();
  const updateProduct = useAdminUpdateProduct();
  const uploadImage = useProductImageUpload();
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingProduct = products?.find((p: { id: string }) => p.id === productId);
  const isEditing = !!productId;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brand: "",
      model: "",
      description: "",
      image_url: "",
      category: "",
      band: "",
      bucket: "",
      retail_value_usd: 0,
      expected_fulfillment_cost_usd: 0,
      is_active: true,
      is_jackpot: false,
      traits: "",
    },
  });

  useEffect(() => {
    if (existingProduct) {
      form.reset({
        name: existingProduct.name,
        brand: existingProduct.brand,
        model: existingProduct.model,
        description: existingProduct.description || "",
        image_url: existingProduct.image_url || "",
        category: existingProduct.category,
        band: existingProduct.band,
        bucket: existingProduct.bucket,
        retail_value_usd: existingProduct.retail_value_usd,
        expected_fulfillment_cost_usd: existingProduct.expected_fulfillment_cost_usd,
        is_active: existingProduct.is_active,
        is_jackpot: existingProduct.is_jackpot,
        traits: existingProduct.traits?.join(", ") || "",
      });
      setPreviewUrl(existingProduct.image_url);
    } else {
      form.reset({
        name: "",
        brand: "",
        model: "",
        description: "",
        image_url: "",
        category: "",
        band: "",
        bucket: "",
        retail_value_usd: 0,
        expected_fulfillment_cost_usd: 0,
        is_active: true,
        is_jackpot: false,
        traits: "",
      });
      setPreviewUrl(null);
    }
  }, [existingProduct, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    const url = await uploadImage.mutateAsync(file);
    form.setValue("image_url", url);
  };

  const onSubmit = (values: ProductFormValues) => {
    const productData = {
      ...values,
      traits: values.traits ? values.traits.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };

    if (isEditing && productId) {
      updateProduct.mutate(
        { productId, product: productData },
        { onSuccess: onClose }
      );
    } else {
      createProduct.mutate(productData, { onSuccess: onClose });
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Create Product"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <FormLabel>Product Image</FormLabel>
              <div className="flex items-start gap-4">
                <div
                  className="relative h-32 w-32 rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewUrl(null);
                          form.setValue("image_url", "");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : uploadImage.isPending ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <div className="text-sm text-muted-foreground">
                  <p>Click to upload an image</p>
                  <p>PNG, JPG up to 5MB</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Pikachu VMAX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Pokemon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Shining Fates" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Product description..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Classification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="band"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rarity Band</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select band" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BAND_OPTIONS.map((band) => (
                          <SelectItem key={band.value} value={band.value}>
                            {band.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bucket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Award Bucket</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bucket" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUCKET_OPTIONS.map((bucket) => (
                          <SelectItem key={bucket.value} value={bucket.value}>
                            {bucket.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="retail_value_usd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retail Value (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>The displayed value to users</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expected_fulfillment_cost_usd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Fulfillment Cost (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>Internal cost for budgeting</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Traits */}
            <FormField
              control={form.control}
              name="traits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Traits</FormLabel>
                  <FormControl>
                    <Input placeholder="PSA 10, First Edition, Graded" {...field} />
                  </FormControl>
                  <FormDescription>Comma-separated list of traits</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Toggles */}
            <div className="flex flex-wrap gap-6">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_jackpot"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Jackpot Prize</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update Product"
                ) : (
                  "Create Product"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
