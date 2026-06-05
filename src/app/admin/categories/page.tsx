"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertTriangle,
  FolderOpen,
  Folder,
} from "lucide-react";
import toast from "react-hot-toast";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: CategoryNode[];
  _count: {
    products: number;
    children?: number;
  };
}

export default function AdminCategoriesPage() {
  const [categoriesTree, setCategoriesTree] = useState<CategoryNode[]>([]);
  const [flatCategories, setFlatCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

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

  // Recursively flatten tree for the parent selection dropdown
  const buildFlatList = (nodes: CategoryNode[], list: { id: string; name: string }[] = [], depth = 0) => {
    nodes.forEach((node) => {
      list.push({ id: node.id, name: `${"— ".repeat(depth)}${node.name}` });
      if (node.children && node.children.length > 0) {
        buildFlatList(node.children, list, depth + 1);
      }
    });
    return list;
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategoriesTree(json.data);
        const flat = buildFlatList(json.data);
        setFlatCategories(flat);
      } else {
        throw new Error(json.message || "Failed to load categories");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setParentId("");
    setSortOrder("0");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: CategoryNode) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setParentId(category.parentId || "");
    setSortOrder(category.sortOrder.toString());
    setIsActive(category.isActive);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Category name is required");
    if (!slug.trim()) return toast.error("Slug is required");

    setSaving(true);
    const payload = {
      id: editingCategory?.id,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim() || null,
      parentId: parentId || null,
      sortOrder: parseInt(sortOrder) || 0,
      isActive,
    };

    try {
      const method = editingCategory ? "PUT" : "POST";
      const res = await fetch("/api/admin/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(`Category ${editingCategory ? "updated" : "created"} successfully`);
        setIsModalOpen(false);
        loadCategories();
      } else {
        throw new Error(json.message || "Failed to save category");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error saving category");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category: CategoryNode) => {
    // Check if category has products or subcategories
    if (category._count.products > 0) {
      return toast.error(
        `Cannot delete. Category has ${category._count.products} products. Reassign products first.`
      );
    }
    if (category.children && category.children.length > 0) {
      return toast.error("Cannot delete. This category has subcategories. Reassign or delete them first.");
    }

    if (!window.confirm(`Are you sure you want to permanently delete category "${category.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${category.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        toast.success("Category deleted successfully");
        loadCategories();
      } else {
        throw new Error(json.message || "Failed to delete category");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    }
  };

  // Up/down sortOrder update
  const handleMoveOrder = async (category: CategoryNode, direction: "up" | "down") => {
    const change = direction === "up" ? -1 : 1;
    const newSortOrder = Math.max(0, category.sortOrder + change);
    if (newSortOrder === category.sortOrder) return;

    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id,
          name: category.name,
          slug: category.slug,
          sortOrder: newSortOrder,
        }),
      });
      const json = await res.json();
      if (json.success) {
        loadCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render tree node component
  const renderCategoryNode = (node: CategoryNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id] || false;

    return (
      <div key={node.id} className="space-y-1">
        <div
          className="flex items-center justify-between p-3 bg-author-charcoal/30 hover:bg-white/5 border border-white/5 rounded-lg transition-colors"
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(node.id)}
                className="p-1 hover:bg-white/10 rounded transition-colors text-author-mid hover:text-author-white"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6" /> // spacer
            )}
            <div className="flex items-center gap-2 text-author-mid">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-author-cream" />
                ) : (
                  <Folder className="w-4 h-4 text-author-cream" />
                )
              ) : (
                <Folder className="w-4 h-4 text-author-mid" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-heading text-xs font-semibold uppercase tracking-wider text-author-white">
                {node.name}
              </span>
              <span className="text-[10px] text-author-mid font-mono ml-2 block sm:inline">
                /{node.slug}
              </span>
              {node.description && (
                <p className="text-[10px] text-author-mid truncate max-w-sm">{node.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] px-2 py-0.5 rounded-full font-heading font-semibold bg-author-cream/5 text-author-cream border border-author-cream/10">
              {node._count.products} products
            </span>

            {/* Sort order actions */}
            <div className="flex items-center border border-white/5 rounded">
              <button
                onClick={() => handleMoveOrder(node, "up")}
                className="p-1 hover:bg-white/5 text-author-mid hover:text-author-white transition-colors"
                title="Move Up"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleMoveOrder(node, "down")}
                className="p-1 border-l border-white/5 hover:bg-white/5 text-author-mid hover:text-author-white transition-colors"
                title="Move Down"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>

            {/* General Actions */}
            <button
              onClick={() => handleOpenEditModal(node)}
              className="p-1.5 hover:bg-white/5 text-author-mid hover:text-author-white rounded transition-colors"
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteCategory(node)}
              className="p-1.5 hover:bg-red-500/10 text-red-400/70 hover:text-red-400 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children!.map((child) => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-author-cream" /> Categories
          </h1>
          <p className="text-author-mid text-sm mt-1">
            Manage product category hierarchy tree
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Categories Tree Grid */}
      <div className="glass rounded-lg p-6 space-y-4 border border-white/5 min-h-[400px]">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
            <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading category tree...</p>
          </div>
        ) : categoriesTree.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <FolderOpen className="w-12 h-12 text-author-mid mx-auto opacity-50" />
            <h3 className="font-heading text-lg font-bold text-author-white uppercase tracking-wider">No Categories</h3>
            <p className="text-xs text-author-mid max-w-sm mx-auto">
              Create parent and sub-categories to start organizing your clothing items.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {categoriesTree.map((cat) => renderCategoryNode(cat))}
          </div>
        )}
      </div>

      {/* Modal */}
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
              className="relative w-full max-w-md glass bg-author-charcoal/95 border border-white/10 rounded-lg p-6 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-author-white">
                  {editingCategory ? "Edit Category" : "Create Category"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded text-author-mid hover:text-author-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4 py-4 text-xs">
                <div>
                  <label className="text-[10px] text-author-mid uppercase block mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Knitwear"
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
                    placeholder="knitwear"
                    className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-author-mid uppercase block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Soft-structured layering pieces..."
                    className="w-full bg-author-charcoal border border-white/10 p-3 text-xs text-author-white focus:outline-none rounded resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Parent Category</label>
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                    >
                      <option value="">None (Top Level)</option>
                      {flatCategories
                        .filter((c) => !editingCategory || c.id !== editingCategory.id) // exclude self
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      placeholder="0"
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-author-white font-semibold">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded bg-author-charcoal border-white/10 text-author-cream focus:ring-0 focus:ring-offset-0 w-4 h-4"
                    />
                    Category Active (Publicly listable)
                  </label>
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
                    Save Category
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
