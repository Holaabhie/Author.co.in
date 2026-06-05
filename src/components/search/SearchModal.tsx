"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { useUIStore } from "@/lib/store/ui";
import { products } from "@/data/products";

export default function SearchModal() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof products>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isSearchOpen) {
      setQuery("");
      setResults([]);
    }
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

  // Search logic (client-side for now, will be API-driven later)
  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    // Simulate API delay
    setTimeout(() => {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filtered);
      setIsSearching(false);
    }, 200);
  }, []);

  const popularSearches = ["Oversized Tee", "Hoodie", "Joggers", "Limited Edition"];

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80]"
            onClick={closeSearch}
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 z-[90] bg-author-charcoal border-b border-white/5"
          >
            <div className="max-w-4xl mx-auto p-6">
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
                {isSearching && <Loader2 className="w-4 h-4 animate-spin text-author-mid" />}
                <div className="flex items-center gap-2">
                  <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] text-author-mid border border-white/10 rounded font-heading">
                    ESC
                  </kbd>
                  <button
                    onClick={closeSearch}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
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
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
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
                <div className="mt-8 text-center py-8">
                  <p className="text-author-mid text-sm">
                    No products found for &ldquo;{query}&rdquo;
                  </p>
                  <Link
                    href="/shop"
                    onClick={closeSearch}
                    className="inline-flex items-center gap-2 text-sm text-author-cream hover:underline mt-2"
                  >
                    Browse all products <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
