import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Package, Search, ExternalLink, Edit2, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  compare_at_price: number | null;
  category: string | null;
  tags: string[] | null;
  product_url: string | null;
  in_stock: boolean | null;
  stock_quantity: number | null;
  image_urls: string[] | null;
  currency: string | null;
}

const ProductsPage = () => {
  const { store } = useStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state for editing
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCompare, setEditCompare] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editInStock, setEditInStock] = useState(true);
  const [editQty, setEditQty] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!store,
  });

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (inStockOnly && !p.in_stock) return false;
    return true;
  });

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setEditName(p.name);
    setEditDesc(p.description || "");
    setEditPrice(p.price?.toString() || "");
    setEditCompare(p.compare_at_price?.toString() || "");
    setEditCategory(p.category || "");
    setEditTags(p.tags?.join(", ") || "");
    setEditUrl(p.product_url || "");
    setEditInStock(p.in_stock ?? true);
    setEditQty(p.stock_quantity?.toString() || "");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editProduct) return;
      const { error } = await supabase.from("products").update({
        name: editName,
        description: editDesc || null,
        price: editPrice ? parseFloat(editPrice) : null,
        compare_at_price: editCompare ? parseFloat(editCompare) : null,
        category: editCategory || null,
        tags: editTags ? editTags.split(",").map((t) => t.trim()) : null,
        product_url: editUrl || null,
        in_stock: editInStock,
        stock_quantity: editQty ? parseInt(editQty) : null,
      }).eq("id", editProduct.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditProduct(null);
      toast.success("Product updated");
    },
    onError: () => toast.error("Failed to update product"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteId(null);
      toast.success("Product deleted");
    },
  });

  if (!store) return <div className="text-center py-20 text-muted-foreground">Please create a store first.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Product Catalog</h2>
        <p className="text-muted-foreground mt-1">Products automatically extracted from your uploaded documents</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c!} value={c!}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-2">
          <Switch checked={inStockOnly} onCheckedChange={setInStockOnly} />
          <Label className="text-sm">In Stock</Label>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
              <div className="aspect-square bg-muted rounded-lg mb-3" />
              <div className="h-4 bg-muted rounded w-2/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center">
          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">{products.length === 0 ? "No products extracted yet" : "No matching products"}</p>
          {products.length === 0 && (
            <>
              <p className="text-sm text-muted-foreground mb-4">Upload a catalog to automatically extract products</p>
              <Button variant="outline" asChild className="rounded-full">
                <Link to="/dashboard/upload"><Upload className="h-4 w-4 mr-2" /> Upload a Catalog</Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="glass-card rounded-xl overflow-hidden group">
              {/* Image */}
              <div className="aspect-square bg-secondary flex items-center justify-center">
                {product.image_urls?.[0] ? (
                  <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2">{product.name}</h3>
                  <button onClick={() => openEdit(product)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>

                {product.category && (
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{product.category}</span>
                )}

                <div className="flex items-baseline gap-2">
                  {product.price != null && (
                    <span className="text-lg font-bold text-primary">${Number(product.price).toFixed(2)}</span>
                  )}
                  {product.compare_at_price != null && (
                    <span className="text-xs text-muted-foreground line-through">${Number(product.compare_at_price).toFixed(2)}</span>
                  )}
                </div>

                <span className={`text-xs px-2 py-0.5 rounded-full ${product.in_stock ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                  {product.in_stock ? "In Stock" : "Out of Stock"}
                </span>

                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                )}

                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                )}

                {product.product_url && (
                  <a href={product.product_url} target="_blank" rel="noopener" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> View Product
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Product</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Price</Label>
                <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Compare At Price</Label>
                <Input type="number" value={editCompare} onChange={(e) => setEditCompare(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Tags (comma separated)</Label>
              <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="tag1, tag2, tag3" />
            </div>
            <div className="space-y-1">
              <Label>Product URL</Label>
              <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={editInStock} onCheckedChange={setEditInStock} />
                <Label>In Stock</Label>
              </div>
              <div className="space-y-1">
                <Label>Stock Quantity</Label>
                <Input type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" className="text-destructive border-destructive/30 rounded-full" onClick={() => { setDeleteId(editProduct?.id || null); setEditProduct(null); }}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
            <Button className="rounded-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This product will be removed from your catalog.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsPage;
