"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Search,
  Loader2,
  Trash2,
  ImageIcon,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface MediaAsset {
  id: string;
  filename: string;
  originalFilename: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  tags: string[];
  createdAt: string;
  folder: { id: string; name: string } | null;
}

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function fetchMedia() {
    setLoading(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/admin/media?page=${page}&pageSize=24${searchParam}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAssets(json.data);
        if (json.meta) {
          setTotalPages(json.meta.totalPages || 1);
          setTotalAssets(json.meta.total || 0);
        }
      }
    } catch (err) {
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMedia();
  }, [page]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchMedia();
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (json.success) {
          successCount++;
        } else {
          toast.error(`Failed to upload ${file.name}: ${json.message || "Unknown error"}`);
        }
      } catch (err) {
        toast.error(`Error uploading ${file.name}`);
      }
    }

    if (successCount > 0) {
      /* success toast removed */
      fetchMedia();
    }

    setUploading(false);
    e.target.value = "";
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this media asset? This cannot be undone.")) return;

    setDeleting(id);

    // Optimistic remove
    setAssets((prev) => prev.filter((a) => a.id !== id));

    try {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Failed to delete");
      }
      /* success toast removed */
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
      fetchMedia(); // Rollback
    } finally {
      setDeleting(null);
    }
  }

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    /* success toast removed */
    setTimeout(() => setCopied(null), 2000);
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white">
            Media Library
          </h1>
          <p className="text-author-mid text-sm mt-1">{totalAssets} assets</p>
        </div>

        <label className="flex items-center gap-2 px-4 py-2 bg-author-cream text-author-black text-xs font-heading uppercase tracking-wider rounded cursor-pointer hover:bg-author-cream/90 transition-colors">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Uploading..." : "Upload Files"}
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*,video/mp4,video/webm"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-author-mid" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename, alt text, or tag..."
          className="w-full bg-author-charcoal/50 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
          <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading media...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <ImageIcon className="w-12 h-12 text-author-mid mx-auto opacity-50" />
          <h3 className="font-heading text-lg font-bold text-author-white uppercase tracking-wider">No Media Found</h3>
          <p className="text-xs text-author-mid max-w-sm mx-auto">
            Upload images and videos to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          <AnimatePresence mode="popLayout">
            {assets.map((asset, i) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.02 }}
                className="glass rounded-lg overflow-hidden group relative border border-white/5"
              >
                {/* Image Preview */}
                <div className="relative aspect-square bg-author-black">
                  {asset.mimeType.startsWith("image/") ? (
                    <Image
                      src={asset.thumbnailUrl || asset.url}
                      alt={asset.altText || asset.originalFilename}
                      fill
                      className="object-cover"
                      sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 16vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-author-mid mx-auto" />
                        <p className="text-[9px] text-author-mid mt-1 uppercase">{asset.mimeType.split("/")[1]}</p>
                      </div>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => copyUrl(asset.url, asset.id)}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      title="Copy URL"
                    >
                      {copied === asset.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      disabled={deleting === asset.id}
                      className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                      title="Delete"
                    >
                      {deleting === asset.id ? (
                        <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="text-[10px] text-author-white truncate font-semibold uppercase tracking-wider">
                    {asset.originalFilename}
                  </p>
                  <p className="text-[9px] text-author-mid mt-0.5">
                    {formatSize(asset.sizeBytes)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-author-mid">
          <div>
            Page {page} of {totalPages} ({totalAssets} assets)
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 bg-author-charcoal border border-white/10 rounded hover:bg-white/5 transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 text-author-white" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 bg-author-charcoal border border-white/10 rounded hover:bg-white/5 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-author-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
