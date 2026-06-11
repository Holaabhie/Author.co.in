"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Save,
  Plus,
  Loader2,
  AlertTriangle,
  Layout,
  Megaphone,
  ShoppingBag,
  Code,
} from "lucide-react";
import toast from "react-hot-toast";

interface CmsItem {
  id: string;
  key: string;
  value: any;
  updatedAt: string;
}

export default function AdminCmsPage() {
  const [cmsItems, setCmsItems] = useState<CmsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Selected Key Editor
  const [selectedKey, setSelectedKey] = useState<string>("hero");

  // Form Fields - Hero Banner
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroCtaText, setHeroCtaText] = useState("");
  const [heroCtaLink, setHeroCtaLink] = useState("");

  // Form Fields - Announcement Bar
  const [announceText, setAnnounceText] = useState("");
  const [announceLink, setAnnounceLink] = useState("");
  const [announceIsActive, setAnnounceIsActive] = useState(true);

  // Form Fields - Featured Products
  const [featuredProductIds, setFeaturedProductIds] = useState("");

  // Form Fields - Raw JSON
  const [rawKey, setRawKey] = useState("");
  const [rawJson, setRawJson] = useState("");

  // Load CMS content
  async function fetchCmsContent() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms/content");
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setCmsItems(json.data);
        populateFields(json.data);
      } else {
        throw new Error(json.message || "Failed to load CMS content");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load content settings");
    } finally {
      setLoading(false);
    }
  }

  const populateFields = (items: CmsItem[]) => {
    // Populate hero banner fields
    const hero = items.find((item) => item.key === "hero");
    if (hero?.value) {
      setHeroTitle(hero.value.title || "");
      setHeroSubtitle(hero.value.subtitle || "");
      setHeroImage(hero.value.backgroundImage || "");
      setHeroCtaText(hero.value.ctaText || "");
      setHeroCtaLink(hero.value.ctaLink || "");
    }

    // Populate announcement bar fields
    const announcement = items.find((item) => item.key === "announcement");
    if (announcement?.value) {
      setAnnounceText(announcement.value.text || "");
      setAnnounceLink(announcement.value.link || "");
      setAnnounceIsActive(announcement.value.isActive !== false);
    }

    // Populate featured products fields
    const featured = items.find((item) => item.key === "featured_products");
    if (featured?.value) {
      setFeaturedProductIds(
        Array.isArray(featured.value.productIds) ? featured.value.productIds.join(", ") : ""
      );
    }
  };

  useEffect(() => {
    fetchCmsContent();
  }, []);

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        key: "hero",
        value: {
          title: heroTitle.trim(),
          subtitle: heroSubtitle.trim(),
          backgroundImage: heroImage.trim(),
          ctaText: heroCtaText.trim(),
          ctaLink: heroCtaLink.trim(),
        },
      };

      const res = await fetch("/api/admin/cms/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        /* success toast removed */
        fetchCmsContent();
      } else {
        throw new Error(json.message || "Update failed");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save Hero configurations");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        key: "announcement",
        value: {
          text: announceText.trim(),
          link: announceLink.trim() || null,
          isActive: announceIsActive,
        },
      };

      const res = await fetch("/api/admin/cms/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        /* success toast removed */
        fetchCmsContent();
      } else {
        throw new Error(json.message || "Update failed");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeatured = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const productIds = featuredProductIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "");

      const payload = {
        key: "featured_products",
        value: {
          productIds,
        },
      };

      const res = await fetch("/api/admin/cms/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        /* success toast removed */
        fetchCmsContent();
      } else {
        throw new Error(json.message || "Update failed");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save product IDs");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRawJson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawKey.trim()) return toast.error("Key name is required");
    if (!rawJson.trim()) return toast.error("JSON content is required");

    let parsedValue;
    try {
      parsedValue = JSON.parse(rawJson);
    } catch (err) {
      return toast.error("Invalid JSON syntax. Ensure keys and values are double-quoted.");
    }

    setSaving(true);
    try {
      const payload = {
        key: rawKey.trim().toLowerCase(),
        value: parsedValue,
      };

      const res = await fetch("/api/admin/cms/content", {
        method: "POST", // Create new if doesn't exist, or we can use PUT
      });
      // Wait, let's just use PUT which handles upsert
      const resPut = await fetch("/api/admin/cms/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await resPut.json();

      if (json.success) {
        /* success toast removed */
        setRawKey("");
        setRawJson("");
        fetchCmsContent();
      } else {
        throw new Error(json.message || "Upsert failed");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save key");
    } finally {
      setSaving(false);
    }
  };

  const selectRawKeyForEditing = (item: CmsItem) => {
    setRawKey(item.key);
    setRawJson(JSON.stringify(item.value, null, 2));
    setSelectedKey("raw");
  };

  const editorTabs = [
    { id: "hero", label: "Homepage Hero", icon: Layout },
    { id: "announcement", label: "Announcement Bar", icon: Megaphone },
    { id: "featured", label: "Featured Products", icon: ShoppingBag },
    { id: "raw", label: "Custom JSON Editor", icon: Code },
  ];

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
        <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading CMS settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-author-cream" /> CMS Editor
        </h1>
        <p className="text-author-mid text-sm mt-1">
          Customize marketing copy, hero banners, site-wide announcements, and homepage curated layouts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: keys directory */}
        <div className="space-y-4">
          <div className="glass p-4 rounded-lg space-y-3">
            <h3 className="font-heading text-xs uppercase tracking-wider text-author-cream border-b border-white/5 pb-2">
              CMS Directories
            </h3>
            <div className="flex flex-col gap-1.5">
              {editorTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedKey(t.id);
                    if (t.id !== "raw") {
                      setRawKey("");
                      setRawJson("");
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors font-heading uppercase tracking-wider ${
                    selectedKey === t.id
                      ? "bg-author-cream/15 text-author-cream font-bold"
                      : "text-author-mid hover:text-author-white hover:bg-white/5"
                  }`}
                >
                  <t.icon className="w-4 h-4 flex-shrink-0" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass p-4 rounded-lg space-y-3">
            <h3 className="font-heading text-xs uppercase tracking-wider text-author-cream border-b border-white/5 pb-2">
              Existing DB Keys
            </h3>
            {cmsItems.length === 0 ? (
              <p className="text-[10px] text-author-mid italic">No keys in database</p>
            ) : (
              <div className="space-y-2">
                {cmsItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => selectRawKeyForEditing(item)}
                    className="w-full text-left p-2 hover:bg-white/5 rounded border border-white/5 flex flex-col transition-colors group"
                  >
                    <span className="font-mono text-xs text-author-white group-hover:text-author-cream transition-colors">
                      {item.key}
                    </span>
                    <span className="text-[9px] text-author-mid mt-0.5">
                      Updated: {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: editors */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedKey === "hero" && (
              <motion.form
                key="hero"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSaveHero}
                className="glass p-6 rounded-lg space-y-6"
              >
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-author-cream" /> Homepage Hero Banner
                </h2>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Banner Title *</label>
                    <input
                      type="text"
                      required
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder="e.g. AUTHOR STUDIO APPAREL"
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Banner Subtitle / Description</label>
                    <textarea
                      rows={2}
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      placeholder="e.g. Clean lines, organic textures, structured tailoring..."
                      className="w-full bg-author-charcoal border border-white/10 p-3 text-xs text-author-white focus:outline-none rounded resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Background Image URL *</label>
                    <input
                      type="text"
                      required
                      value={heroImage}
                      onChange={(e) => setHeroImage(e.target.value)}
                      placeholder="https://example.com/banner.webp"
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-author-mid uppercase block mb-1">CTA Button Text</label>
                      <input
                        type="text"
                        value={heroCtaText}
                        onChange={(e) => setHeroCtaText(e.target.value)}
                        placeholder="DISCOVER COLLECTION"
                        className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-author-mid uppercase block mb-1">CTA Button Link</label>
                      <input
                        type="text"
                        value={heroCtaLink}
                        onChange={(e) => setHeroCtaLink(e.target.value)}
                        placeholder="/shop"
                        className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Hero Settings
                  </button>
                </div>
              </motion.form>
            )}

            {selectedKey === "announcement" && (
              <motion.form
                key="announcement"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSaveAnnouncement}
                className="glass p-6 rounded-lg space-y-6"
              >
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-author-cream" /> Sitewide Announcement Bar
                </h2>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Announcement Text *</label>
                    <input
                      type="text"
                      required
                      value={announceText}
                      onChange={(e) => setAnnounceText(e.target.value)}
                      placeholder="e.g. Free shipping on all domestic orders above ₹999"
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Link URL (Optional)</label>
                    <input
                      type="text"
                      value={announceLink}
                      onChange={(e) => setAnnounceLink(e.target.value)}
                      placeholder="e.g. /shop/new-arrivals"
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-author-white font-semibold">
                      <input
                        type="checkbox"
                        checked={announceIsActive}
                        onChange={(e) => setAnnounceIsActive(e.target.checked)}
                        className="rounded bg-author-charcoal border-white/10 text-author-cream focus:ring-0 focus:ring-offset-0 w-4 h-4"
                      />
                      Announcement Bar Active
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Announcement
                  </button>
                </div>
              </motion.form>
            )}

            {selectedKey === "featured" && (
              <motion.form
                key="featured"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSaveFeatured}
                className="glass p-6 rounded-lg space-y-6"
              >
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-author-cream" /> Curated Homepage Products
                </h2>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">
                      Featured Product IDs (Comma-separated) *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={featuredProductIds}
                      onChange={(e) => setFeaturedProductIds(e.target.value)}
                      placeholder="e.g. clh39asdjf9273sd, clh39asdjf9273sa, clh39asdjf9273sb"
                      className="w-full bg-author-charcoal border border-white/10 p-3 text-xs text-author-white focus:outline-none rounded font-mono resize-none"
                    />
                    <p className="text-[10px] text-author-mid mt-1 uppercase tracking-wider">
                      Retrieve these IDs from the Products list page.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Curated List
                  </button>
                </div>
              </motion.form>
            )}

            {selectedKey === "raw" && (
              <motion.form
                key="raw"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSaveRawJson}
                className="glass p-6 rounded-lg space-y-6"
              >
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3 flex items-center gap-2">
                  <Code className="w-4 h-4 text-author-cream" /> Custom JSON Content Key
                </h2>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Content Key Name *</label>
                    <input
                      type="text"
                      required
                      value={rawKey}
                      onChange={(e) => setRawKey(e.target.value)}
                      placeholder="e.g. size_chart_details"
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">JSON Content Value *</label>
                    <textarea
                      rows={10}
                      required
                      value={rawJson}
                      onChange={(e) => setRawJson(e.target.value)}
                      placeholder='{\n  "chest_sizes": [36, 38, 40, 42],\n  "fit": "Oversized Fit"\n}'
                      className="w-full bg-author-charcoal border border-white/10 p-3 text-xs text-author-white focus:outline-none rounded font-mono resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Upsert Key Value
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
