"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  isActive: boolean;
  sku: string | null;
  category: Category | null;
  brand: { id: string; name: string } | null;
  images: ProductImage[];
  _count: {
    variants: number;
    reviews: number;
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Load categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }
    fetchCategories();
  }, []);

  // Load products
  async function fetchProducts() {
    setLoading(true);
    try {
      const activeParam = isActive === "all" ? "" : `&isActive=${isActive}`;
      const catParam = categoryId ? `&categoryId=${categoryId}` : "";
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";

      const res = await fetch(
        `/api/admin/products?page=${page}&pageSize=10${searchParam}${catParam}${activeParam}`
      );
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data);
        if (json.meta) {
          setTotalPages(json.meta.totalPages || 1);
          setTotalProducts(json.meta.total || 0);
        }
      } else {
        throw new Error(json.message || "Failed to load products");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error fetching products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, [page, categoryId, isActive]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchProducts();
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Toggle active status (Soft delete / Activate)
  async function handleToggleActive(product: Product) {
    const originalStatus = product.isActive;
    const action = originalStatus ? "deactivate" : "activate";
    
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isActive: !originalStatus } : p))
    );

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          slug: product.slug,
          price: product.price,
          isActive: !originalStatus,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || `Failed to ${action} product`);
      }
      /* success toast removed */
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update product status");
      // Rollback UI update
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: originalStatus } : p))
      );
    }
  }

  // Hard Delete with confirmation
  async function handleDeleteProduct(id: string) {
    if (!window.confirm("Are you sure you want to permanently delete this product? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        /* success toast removed */
        fetchProducts();
      } else {
        throw new Error(json.message || "Failed to delete product");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete product");
    }
  }

  const formatPrice = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white">
            Products
          </h1>
          <p className="text-author-mid text-sm mt-1">
            {totalProducts} total products listed in catalog
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-author-charcoal/30 p-4 border border-white/5 rounded-lg">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-author-mid" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, SKU, tags..."
            className="w-full bg-author-charcoal/50 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 rounded transition-colors"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={isActive}
          onChange={(e) => {
            setIsActive(e.target.value);
            setPage(1);
          }}
          className="bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 rounded transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {/* Table Section */}
      <div className="glass rounded-lg overflow-hidden border border-white/5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
            <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-author-mid mx-auto opacity-50" />
            <h3 className="font-heading text-lg font-bold text-author-white uppercase tracking-wider">No Products Found</h3>
            <p className="text-xs text-author-mid max-w-sm mx-auto">
              We couldn&apos;t find any products matching your search criteria. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-author-mid uppercase tracking-wider border-b border-white/5 bg-author-black/20">
                  <th className="text-left p-4">Product Info</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Brand</th>
                  <th className="text-left p-4">Price</th>
                  <th className="text-left p-4">Stock</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {products.map((product, i) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-12 flex-shrink-0 bg-author-black overflow-hidden rounded border border-white/10">
                            {product.images?.[0]?.url ? (
                              <Image
                                src={product.images[0].url}
                                alt={product.images[0].alt || product.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-author-mid uppercase font-heading">
                                No Img
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/admin/products/${product.id}`} className="font-heading text-xs uppercase tracking-wider text-author-white hover:text-author-cream hover:underline truncate block max-w-[200px]">
                              {product.name}
                            </Link>
                            <span className="text-[10px] text-author-mid block mt-0.5">
                              SKU: {product.sku || "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-author-white">
                        {product.category?.name || <span className="text-author-mid italic">None</span>}
                      </td>
                      <td className="p-4 text-xs text-author-white">
                        {product.brand?.name || <span className="text-author-mid italic">None</span>}
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-semibold text-author-white">
                          {formatPrice(product.price)}
                        </div>
                        {product.discountPrice && (
                          <div className="text-[10px] text-author-mid line-through">
                            {formatPrice(product.discountPrice)}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-heading font-semibold ${
                            product.stock === 0
                              ? "text-red-500"
                              : product.stock <= 5
                              ? "text-red-400"
                              : product.stock <= 15
                              ? "text-yellow-400"
                              : "text-green-400"
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`text-[9px] px-2 py-0.5 rounded-full font-heading uppercase tracking-wider font-semibold border ${
                            product.isActive
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/shop/${product.slug}`}
                            target="_blank"
                            className="p-1.5 hover:bg-white/5 rounded text-author-mid hover:text-author-white transition-colors"
                            title="Preview Storefront"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-1.5 hover:bg-white/5 rounded text-author-mid hover:text-author-white transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded text-red-400/70 hover:text-red-400 transition-colors"
                            title="Permanently Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5 text-xs text-author-mid bg-author-black/10">
            <div>
              Showing page {page} of {totalPages} ({totalProducts} items)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 bg-author-charcoal border border-white/10 rounded hover:bg-white/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4 text-author-white" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-author-charcoal border border-white/10 rounded hover:bg-white/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4 text-author-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
