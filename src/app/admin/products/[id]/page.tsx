"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface ImageInput {
  id?: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface VariantInput {
  id?: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  sku: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [priceRs, setPriceRs] = useState("");
  const [discountPriceRs, setDiscountPriceRs] = useState("");
  const [costPriceRs, setCostPriceRs] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [badge, setBadge] = useState("");
  const [weight, setWeight] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Lists states
  const [images, setImages] = useState<ImageInput[]>([]);
  const [variants, setVariants] = useState<VariantInput[]>([]);
  const [details, setDetails] = useState<string[]>([]);
  const [careInstructions, setCareInstructions] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch categories, brands, and product info
        const [catRes, brandRes, prodRes] = await Promise.all([
          fetch("/api/admin/categories"),
          fetch("/api/admin/brands"),
          fetch(`/api/admin/products/${productId}`),
        ]);

        const catJson = await catRes.json();
        const brandJson = await brandRes.json();
        const prodJson = await prodRes.json();

        if (catJson.success) setCategories(catJson.data);
        if (brandJson.success) setBrands(brandJson.data);

        if (prodJson.success && prodJson.data) {
          const p = prodJson.data;
          setName(p.name);
          setSlug(p.slug);
          setDescription(p.description || "");
          setShortDescription(p.shortDescription || "");
          setPriceRs((p.price / 100).toString());
          setDiscountPriceRs(p.discountPrice ? (p.discountPrice / 100).toString() : "");
          setCostPriceRs(p.costPrice ? (p.costPrice / 100).toString() : "");
          setSku(p.sku || "");
          setStock(p.stock.toString());
          setCategoryId(p.categoryId || "");
          setBrandId(p.brandId || "");
          setBadge(p.badge || "");
          setWeight(p.weight ? p.weight.toString() : "");
          setHsnCode(p.hsnCode || "");
          setMetaTitle(p.metaTitle || "");
          setMetaDescription(p.metaDescription || "");
          setIsActive(p.isActive);
          setIsFeatured(p.isFeatured || false);
          setTagsInput(p.tags ? p.tags.join(", ") : "");
          setDetails(p.details && p.details.length > 0 ? p.details : [""]);
          setCareInstructions(p.careInstructions && p.careInstructions.length > 0 ? p.careInstructions : [""]);

          // Format images
          if (p.images && p.images.length > 0) {
            setImages(p.images.map((img: any) => ({
              id: img.id,
              url: img.url,
              alt: img.alt || "",
              isPrimary: img.isPrimary,
            })));
          } else {
            setImages([{ url: "", alt: "", isPrimary: true }]);
          }

          // Format variants
          if (p.variants && p.variants.length > 0) {
            setVariants(p.variants.map((v: any) => ({
              id: v.id,
              size: v.size,
              color: v.color,
              colorHex: v.colorHex || "#000000",
              stock: v.stock,
              sku: v.sku || "",
            })));
          } else {
            setVariants([]);
          }
        } else {
          toast.error("Product not found");
          router.push("/admin/products");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId]);

  const handleAddImage = () => {
    setImages([...images, { url: "", alt: "", isPrimary: false }]);
  };

  const handleRemoveImage = (index: number) => {
    const newImgs = [...images];
    newImgs.splice(index, 1);
    if (newImgs.length > 0 && !newImgs.some((img) => img.isPrimary)) {
      newImgs[0].isPrimary = true;
    }
    setImages(newImgs);
  };

  const handleImageChange = (index: number, key: keyof ImageInput, value: any) => {
    const newImgs = images.map((img, i) => {
      if (i === index) {
        return { ...img, [key]: value };
      }
      if (key === "isPrimary" && value === true && i !== index) {
        return { ...img, isPrimary: false };
      }
      return img;
    });
    setImages(newImgs);
  };

  const handleAddVariant = () => {
    setVariants([...variants, { size: "M", color: "Black", colorHex: "#000000", stock: 10, sku: "" }]);
  };

  const handleRemoveVariant = (index: number) => {
    const copy = [...variants];
    copy.splice(index, 1);
    setVariants(copy);
  };

  const handleVariantChange = (index: number, key: keyof VariantInput, value: any) => {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, [key]: value } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Product name is required");
    if (!slug.trim()) return toast.error("Slug is required");
    if (!priceRs || parseFloat(priceRs) <= 0) return toast.error("Valid price is required");

    setSaving(true);

    const price = Math.round(parseFloat(priceRs) * 100);
    const discountPrice = discountPriceRs ? Math.round(parseFloat(discountPriceRs) * 100) : null;
    const costPrice = costPriceRs ? Math.round(parseFloat(costPriceRs) * 100) : null;

    const activeImages = images.filter((img) => img.url.trim() !== "");
    const activeDetails = details.filter((det) => det.trim() !== "");
    const activeCare = careInstructions.filter((c) => c.trim() !== "");
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t !== "");

    const payload = {
      name,
      slug,
      description,
      shortDescription: shortDescription || null,
      price,
      discountPrice,
      costPrice,
      sku: sku || null,
      stock: parseInt(stock) || 0,
      categoryId: categoryId || null,
      brandId: brandId || null,
      badge: badge || null,
      weight: parseFloat(weight) || null,
      hsnCode: hsnCode || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      tags,
      isActive,
      isFeatured,
      images: activeImages,
      variants,
      details: activeDetails,
      careInstructions: activeCare,
    };

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        toast.success("Product updated successfully");
        router.push("/admin/products");
      } else {
        throw new Error(json.message || "Failed to update product");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to deactivate/delete this product?")) return;

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        toast.success("Product deleted successfully");
        router.push("/admin/products");
      } else {
        throw new Error(json.message || "Failed to delete product");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
        <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading product details...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-1.5 hover:bg-white/5 rounded text-author-mid hover:text-author-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold uppercase tracking-wider text-author-white">
              Edit Product
            </h1>
            <p className="text-xs text-author-mid mt-0.5">Product ID: {productId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-red-500/20 transition-colors"
          >
            Delete
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Update Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Form Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="glass p-6 rounded-lg space-y-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Minimalist Cotton Oversized Tee"
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="minimalist-cotton-oversized-tee"
                    className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. AUT-TEE-MIN-01"
                    className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief 1-sentence callout for list cards"
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
                />
              </div>

              <div>
                <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                  Full Description *
                </label>
                <textarea
                  rows={5}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed product narrative..."
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded resize-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="glass p-6 rounded-lg space-y-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3">
              Pricing & Inventory
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                  Price (INR ₹) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={priceRs}
                  onChange={(e) => setPriceRs(e.target.value)}
                  placeholder="e.g. 1999"
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
                />
              </div>
              <div>
                <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                  Discount Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={discountPriceRs}
                  onChange={(e) => setDiscountPriceRs(e.target.value)}
                  placeholder="Sale Price if active"
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
                />
              </div>
              <div>
                <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                  Cost Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={costPriceRs}
                  onChange={(e) => setCostPriceRs(e.target.value)}
                  placeholder="Profit analytics cost"
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                  Base Catalog Stock
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
                />
              </div>
              <div>
                <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 0.25"
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
                />
              </div>
              <div>
                <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                  HSN / GST Code
                </label>
                <input
                  type="text"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  placeholder="61091000"
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
                />
              </div>
            </div>
          </div>

          {/* Media Images */}
          <div className="glass p-6 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white">
                Media Library URLs
              </h2>
              <button
                type="button"
                onClick={handleAddImage}
                className="text-xs text-author-cream hover:underline flex items-center gap-1 font-heading uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" /> Add URL
              </button>
            </div>
            <div className="space-y-3">
              {images.map((img, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] text-author-mid uppercase tracking-wider block mb-0.5">
                      Image URL #{index + 1}
                    </label>
                    <input
                      type="text"
                      value={img.url}
                      onChange={(e) => handleImageChange(index, "url", e.target.value)}
                      placeholder="https://example.com/assets/image.jpg"
                      className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-xs text-author-white focus:outline-none focus:border-author-cream/40 rounded transition-colors"
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="text-[10px] text-author-mid uppercase tracking-wider block mb-0.5">
                      Alt text
                    </label>
                    <input
                      type="text"
                      value={img.alt}
                      onChange={(e) => handleImageChange(index, "alt", e.target.value)}
                      placeholder="Product angle"
                      className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-xs text-author-white focus:outline-none focus:border-author-cream/40 rounded transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-author-mid">
                      <input
                        type="checkbox"
                        checked={img.isPrimary}
                        onChange={(e) => handleImageChange(index, "isPrimary", e.target.checked)}
                        className="rounded bg-author-charcoal border-white/10 text-author-cream focus:ring-0 focus:ring-offset-0"
                      />
                      Primary
                    </label>
                    {images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="p-2 hover:bg-red-500/10 rounded text-red-400/70 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variants Configuration */}
          <div className="glass p-6 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white">
                Attributes & Variants
              </h2>
              <button
                type="button"
                onClick={handleAddVariant}
                className="text-xs text-author-cream hover:underline flex items-center gap-1 font-heading uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" /> Add Variant Row
              </button>
            </div>
            {variants.length === 0 ? (
              <div className="p-4 bg-white/5 rounded border border-white/5 text-center text-xs text-author-mid uppercase tracking-wider">
                No variants configured (Single product base stock applies)
              </div>
            ) : (
              <div className="space-y-3">
                {variants.map((v, index) => (
                  <div key={index} className="grid grid-cols-5 gap-3 items-end">
                    <div>
                      <label className="text-[10px] text-author-mid uppercase block mb-0.5">Size</label>
                      <input
                        type="text"
                        value={v.size}
                        onChange={(e) => handleVariantChange(index, "size", e.target.value)}
                        placeholder="M"
                        className="w-full bg-author-charcoal/50 border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-author-mid uppercase block mb-0.5">Color</label>
                      <input
                        type="text"
                        value={v.color}
                        onChange={(e) => handleVariantChange(index, "color", e.target.value)}
                        placeholder="Cream"
                        className="w-full bg-author-charcoal/50 border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-author-mid uppercase block mb-0.5">Hex Code</label>
                      <input
                        type="text"
                        value={v.colorHex}
                        onChange={(e) => handleVariantChange(index, "colorHex", e.target.value)}
                        placeholder="#F5F0EB"
                        className="w-full bg-author-charcoal/50 border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-author-mid uppercase block mb-0.5">Stock</label>
                      <input
                        type="number"
                        value={v.stock}
                        onChange={(e) => handleVariantChange(index, "stock", parseInt(e.target.value) || 0)}
                        placeholder="10"
                        className="w-full bg-author-charcoal/50 border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <label className="text-[10px] text-author-mid uppercase block mb-0.5">Variant SKU</label>
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                          placeholder="SKU"
                          className="w-full bg-author-charcoal/50 border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors mt-6"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Status, Associations, Details */}
        <div className="space-y-6">
          {/* Status & Settings */}
          <div className="glass p-6 rounded-lg space-y-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3">
              Status & Visibility
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none text-sm text-author-white">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded bg-author-charcoal border-white/10 text-author-cream focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                Active (Visible in Catalog)
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none text-sm text-author-white">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded bg-author-charcoal border-white/10 text-author-cream focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                Featured Product
              </label>

              <div>
                <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                  Ribbon Badge / Label
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. NEW ARRIVAL, BESTSELLER"
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2 text-xs text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
                />
              </div>
            </div>
          </div>

          {/* Catalog Associations */}
          <div className="glass p-6 rounded-lg space-y-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3">
              Associations
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                  Category *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-xs text-author-white focus:outline-none focus:border-author-cream/40 rounded transition-colors"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-author-mid uppercase tracking-wider font-heading block mb-1">
                  Brand
                </label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-xs text-author-white focus:outline-none focus:border-author-cream/40 rounded transition-colors"
                >
                  <option value="">Select Brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Details & Care */}
          <div className="glass p-6 rounded-lg space-y-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3">
              Specifications & Care
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-author-mid uppercase tracking-wider font-heading">
                    Specifications
                  </label>
                  <button
                    type="button"
                    onClick={() => setDetails([...details, ""])}
                    className="text-[10px] text-author-cream uppercase font-heading hover:underline"
                  >
                    + Add Detail
                  </button>
                </div>
                <div className="space-y-1.5">
                  {details.map((detail, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={detail}
                      onChange={(e) => {
                        const copy = [...details];
                        copy[idx] = e.target.value;
                        setDetails(copy);
                      }}
                      className="w-full bg-author-charcoal/50 border border-white/10 px-3 py-1.5 text-xs text-author-white focus:outline-none rounded"
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-author-mid uppercase tracking-wider font-heading">
                    Care Instructions
                  </label>
                  <button
                    type="button"
                    onClick={() => setCareInstructions([...careInstructions, ""])}
                    className="text-[10px] text-author-cream uppercase font-heading hover:underline"
                  >
                    + Add Care
                  </button>
                </div>
                <div className="space-y-1.5">
                  {careInstructions.map((care, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={care}
                      onChange={(e) => {
                        const copy = [...careInstructions];
                        copy[idx] = e.target.value;
                        setCareInstructions(copy);
                      }}
                      className="w-full bg-author-charcoal/50 border border-white/10 px-3 py-1.5 text-xs text-author-white focus:outline-none rounded"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SEO Meta */}
          <div className="glass p-6 rounded-lg space-y-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3">
              SEO Fields
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-0.5">Meta Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Google search snippet title"
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2 text-xs text-author-white focus:outline-none rounded"
                />
              </div>
              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-0.5">Meta Description</label>
                <textarea
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Google description snippet..."
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2 text-xs text-author-white focus:outline-none rounded resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-0.5">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2 text-xs text-author-white focus:outline-none rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
