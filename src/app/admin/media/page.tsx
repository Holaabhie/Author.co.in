"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Upload,
  Search,
  Trash2,
  Copy,
  Check,
  Plus,
  Loader2,
  AlertTriangle,
  ExternalLink,
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
}

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedId, setCopiedId] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load assets
  async function fetchAssets() {
    setLoading(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/admin/media?page=${page}&pageSize=12${searchParam}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setAssets(json.data);
        if (json.meta) {
          setTotalPages(json.meta.totalPages || 1);
        }
      } else {
        throw new Error(json.message || "Failed to load media assets");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error fetching media files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAssets();
  }, [page]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchAssets();
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // File Upload Handler
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return toast.error("File exceeds 10MB limit");
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("altText", file.name.split(".")[0]);

    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        toast.success("File uploaded successfully");
        setPage(1);
        fetchAssets();
      } else {
        throw new Error(json.message || "Upload failed");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Delete media asset
  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this file? This will break any products currently using it.")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success("File deleted");
        fetchAssets();
      } else {
        throw new Error(json.message || "Failed to delete file");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete file");
    }
  };

  // Copy to Clipboard helper
  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopiedId(""), 2000);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-author-cream" /> Media Library
          </h1>
          <p className="text-author-mid text-sm mt-1">
            Upload and copy URLs of images for products, banners, and catalog categories
          </p>
        </div>
        <div className="self-start sm:self-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadFile}
            className="hidden"
            accept="image/*,video/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload File
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-author-mid" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename or tags..."
          className="w-full bg-author-charcoal/50 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
          <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="glass rounded-lg py-20 text-center space-y-4 border border-white/5">
          <AlertTriangle className="w-10 h-10 text-author-mid mx-auto opacity-50" />
          <h3 className="font-heading text-lg font-bold text-author-white uppercase tracking-wider">No Media Assets</h3>
          <p className="text-xs text-author-mid max-w-sm mx-auto">
            Upload images here to retrieve URLs for your product configurations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {assets.map((asset) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-lg border border-white/5 overflow-hidden flex flex-col group relative"
              >
                {/* Image Box */}
                <div className="relative w-full aspect-square bg-author-black flex items-center justify-center overflow-hidden border-b border-white/5">
                  <img
                    src={asset.thumbnailUrl || asset.url}
                    alt={asset.altText || asset.filename}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-author-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleCopyUrl(asset.url, asset.id)}
                      className="p-2 bg-author-cream/90 hover:bg-author-white rounded text-author-black transition-colors"
                      title="Copy public URL"
                    >
                      {copiedId === asset.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={asset.url}
                      target="_blank"
                      className="p-2 bg-author-cream/90 hover:bg-author-white rounded text-author-black transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="p-2 bg-red-600/90 hover:bg-red-500 rounded text-white transition-colors"
                      title="Delete asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-3 text-[10px] space-y-1.5 flex-1 flex flex-col justify-between">
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-author-white uppercase tracking-wider truncate" title={asset.originalFilename}>
                      {asset.originalFilename}
                    </p>
                    <p className="text-author-mid font-mono">{formatBytes(asset.sizeBytes)}</p>
                  </div>

                  <button
                    onClick={() => handleCopyUrl(asset.url, asset.id)}
                    className="w-full text-[9px] font-heading font-semibold uppercase tracking-wider bg-white/5 hover:bg-white/10 p-1.5 rounded transition-colors text-author-cream flex items-center justify-center gap-1"
                  >
                    {copiedId === asset.id ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy URL
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
