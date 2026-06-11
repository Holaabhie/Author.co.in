"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paintbrush,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoAssetId: string | null;
  createdAt: string;
  _count: {
    products: number;
  };
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBrands, setTotalBrands] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoAssetId, setLogoAssetId] = useState("");

  async function fetchBrands() {
    setLoading(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/admin/brands?page=${page}&pageSize=10${searchParam}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setBrands(json.data);
        if (json.meta) {
          setTotalPages(json.meta.totalPages || 1);
          setTotalBrands(json.meta.total || 0);
        }
      } else {
        throw new Error(json.message || "Failed to load brands");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error fetching brands");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBrands();
  }, [page]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchBrands();
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Auto slug generation
  useEffect(() => {
    if (name) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  }, [name]);

  const handleOpenCreateModal = () => {
    setEditingBrand(null);
    setName("");
    setSlug("");
    setLogoAssetId("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setSlug(brand.slug);
    setLogoAssetId(brand.logoAssetId || "");
    setIsModalOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Brand name is required");
    if (!slug.trim()) return toast.error("Slug is required");

    setSaving(true);
    const payload = {
      id: editingBrand?.id,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      logoAssetId: logoAssetId.trim() || null,
    };

    try {
      const method = editingBrand ? "PUT" : "POST";
      const res = await fetch("/api/admin/brands", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        /* success toast removed */
        setIsModalOpen(false);
        fetchBrands();
      } else {
        throw new Error(json.message || "Failed to save brand");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error saving brand");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (brand._count.products > 0) {
      return toast.error(
        `Cannot delete brand. ${brand._count.products} products are associated with it. Reassign products first.`
      );
    }

    if (!window.confirm(`Are you sure you want to permanently delete brand "${brand.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/brands?id=${brand.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        /* success toast removed */
        fetchBrands();
      } else {
        throw new Error(json.message || "Failed to delete brand");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white flex items-center gap-2">
            <Paintbrush className="w-6 h-6 text-author-cream" /> Brands
          </h1>
          <p className="text-author-mid text-sm mt-1">
            {totalBrands} brand labels associated with your items
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Brand
        </button>
      </div>

      {/* Filters Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-author-mid" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brands by name or slug..."
          className="w-full bg-author-charcoal/50 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
        />
      </div>

      {/* Brands Table */}
      <div className="glass rounded-lg overflow-hidden border border-white/5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
            <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading brands...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-author-mid mx-auto opacity-50" />
            <h3 className="font-heading text-lg font-bold text-author-white uppercase tracking-wider">No Brands Found</h3>
            <p className="text-xs text-author-mid max-w-sm mx-auto">
              We couldn&apos;t find any brands. Add one to link to products.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-author-mid uppercase tracking-wider border-b border-white/5 bg-author-black/20">
                  <th className="text-left p-4">Brand Label</th>
                  <th className="text-left p-4">Slug Identifier</th>
                  <th className="text-left p-4">Associated Products</th>
                  <th className="text-left p-4">Registered Date</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {brands.map((brand, i) => (
                    <motion.tr
                      key={brand.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-author-cream/5 border border-white/10 flex items-center justify-center text-author-cream font-heading uppercase text-xs">
                            {brand.name.slice(0, 2)}
                          </div>
                          <span className="font-heading text-xs font-bold uppercase tracking-wider text-author-white">
                            {brand.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-author-cream">
                        /{brand.slug}
                      </td>
                      <td className="p-4 text-xs text-author-white font-semibold">
                        {brand._count.products} products
                      </td>
                      <td className="p-4 text-xs text-author-mid">
                        {new Date(brand.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(brand)}
                            className="p-1.5 hover:bg-white/5 rounded text-author-mid hover:text-author-white transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBrand(brand)}
                            className="p-1.5 hover:bg-red-500/10 rounded text-red-400/70 hover:text-red-400 transition-colors"
                            title="Delete"
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
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-author-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm glass bg-author-charcoal/95 border border-white/10 rounded-lg p-6 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-author-white">
                  {editingBrand ? "Edit Brand" : "Create Brand"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded text-author-mid hover:text-author-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveBrand} className="space-y-4 py-4 text-xs">
                <div>
                  <label className="text-[10px] text-author-mid uppercase block mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Author Studio"
                    className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-author-mid uppercase block mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="author-studio"
                    className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-author-mid uppercase block mb-1">Logo Asset ID (Optional)</label>
                  <input
                    type="text"
                    value={logoAssetId}
                    onChange={(e) => setLogoAssetId(e.target.value)}
                    placeholder="e.g. Media Library image ID"
                    className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                  />
                </div>

                <div className="border-t border-white/5 pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-white/5 border border-white/10 py-2.5 font-heading text-xs uppercase tracking-wider font-semibold hover:bg-white/10 transition-colors rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-author-cream text-author-black py-2.5 font-heading text-xs uppercase tracking-wider font-semibold hover:bg-author-white transition-colors flex items-center justify-center gap-1 rounded disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-3 animate-spin" />}
                    Save Brand
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
