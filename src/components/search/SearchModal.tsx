"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Search, X, ArrowRight } from "lucide-react";
import { AuthorLoader } from "@/components/ui/AuthorLoader";
import { useUIStore } from "@/lib/store/ui";
import { usePathname } from "next/navigation";
interface SearchedProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  salePrice: number | null;
  images: string[];
}

export default function SearchModal() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchedProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close search on route change
  useEffect(() => {
    closeSearch();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps


  // Focus input when opened
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isSearchOpen) {
      setQuery("");
      setResults([]);
    }
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [isSearchOpen]);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        useUIStore.getState().toggleSearch();
      }
      if (e.key === "Escape") {
        closeSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeSearch]);

  // Search logic (API-driven)
  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    setIsSearching(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.success && resJson.data) {
            const mapped: SearchedProduct[] = resJson.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              category: p.category?.name || "",
              price: p.price / 100,
              salePrice: p.discountPrice ? p.discountPrice / 100 : null,
              images: p.images && p.images.length > 0 ? p.images.map((img: any) => img.url) : []
            }));
            setResults(mapped);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Search API error:", err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const popularSearches = ["Essential Tee", "Sweatpants", "Tops", "Premium"];

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-0 left-0 right-0 z-[9100] bg-author-charcoal border-b border-white/5 pointer-events-auto pt-[72px] md:pt-[80px]"
        >
          <div className="max-w-4xl mx-auto p-6 pt-0">
            {/* Search Input */}
            <div className="flex items-center gap-4">
              <Search className="w-5 h-5 text-author-mid flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-lg font-body text-author-white placeholder:text-author-mid/40 focus:outline-none"
              />
              {isSearching && (
                <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                  <AuthorLoader size={36} />
                </div>
              )}
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] text-author-mid border border-white/10 rounded font-heading">
                  ESC
                </kbd>
                <button
                  onClick={closeSearch}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors pointer-events-auto z-[9999]"
                  style={{ pointerEvents: 'auto', zIndex: 9999 }}
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

              {/* Popular Searches */}
              {query.length === 0 && (
                <div className="mt-6">
                  <p className="text-xs font-heading uppercase tracking-wider text-author-mid mb-3">
                    Popular Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term)}
                        className="px-4 py-2 text-sm border border-white/10 text-author-mid hover:border-author-cream/30 hover:text-author-white transition-colors font-heading"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {results.length > 0 && (
                <div className="mt-6 max-h-[60vh] overflow-y-auto">
                  <p className="text-xs font-heading uppercase tracking-wider text-author-mid mb-3">
                    {results.length} Results
                  </p>
                  <div className="space-y-1">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        onClick={closeSearch}
                        className="flex items-center gap-4 p-3 hover:bg-white/5 transition-colors group"
                      >
                        <div className="relative w-14 h-16 flex-shrink-0 bg-author-black overflow-hidden">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center text-[8px] text-neutral-500 font-bold uppercase tracking-widest">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-heading text-sm uppercase tracking-wider truncate group-hover:text-author-cream transition-colors">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-author-mid capitalize">
                              {product.category}
                            </span>
                            <span className="text-xs text-author-mid">•</span>
                            <span className="text-sm font-semibold text-author-cream">
                              ₹{(product.salePrice || product.price).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-author-mid opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {query.length >= 2 && results.length === 0 && !isSearching && (
                <div className="mt-8 text-center py-8 border-t border-white/5">
                  <p className="font-heading text-base uppercase tracking-widest text-author-white mb-2">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-author-mid text-xs mb-6 tracking-wide">
                    Try a different word.
                  </p>
                  <Link
                    href="/shop"
                    onClick={closeSearch}
                    className="inline-block border border-author-cream text-author-cream hover:bg-author-cream hover:text-author-black transition-all duration-300 py-3 px-8 text-xs font-semibold uppercase tracking-widest"
                  >
                    Browse all products →
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
}
