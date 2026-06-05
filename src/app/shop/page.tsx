"use client";

import { useState, useMemo, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Eye, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { products, categories } from "@/data/products";
import type { Product } from "@/data/products";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useCartStore } from "@/lib/store/cart";
import toast from "react-hot-toast";

type SortOption = "popular" | "new" | "price-low" | "price-high";

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const allSizes = ["S", "M", "L", "XL", "XXL", "One Size"];
  const allColors = [
    { name: "Black", hex: "#0A0A0A" },
    { name: "White", hex: "#FAFAFA" },
    { name: "Charcoal", hex: "#2A2A2A" },
    { name: "Cream", hex: "#F5F0EB" },
    { name: "Grey", hex: "#888888" },
    { name: "Olive", hex: "#3D3D2B" },
  ];

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
    if (selectedSizes.length > 0) {
      filtered = filtered.filter((p) =>
        p.sizes.some((s) => selectedSizes.includes(s))
      );
    }
    if (selectedColors.length > 0) {
      filtered = filtered.filter((p) =>
        p.colors.some((c) => selectedColors.includes(c.name))
      );
    }
    const effectivePrice = (p: Product) => p.salePrice || p.price;
    filtered = filtered.filter(
      (p) => effectivePrice(p) >= priceRange[0] && effectivePrice(p) <= priceRange[1]
    );

    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "new":
        filtered.sort((a, b) => (a.badge === "new" ? -1 : 1));
        break;
      case "price-low":
        filtered.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
        break;
    }

    return filtered;
  }, [selectedCategory, selectedSizes, selectedColors, sortBy, priceRange]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange([0, 5000]);
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 5000;

  return (
    <div className="min-h-screen pt-20 md:pt-24 bg-white text-black light-page">
      {/* Header */}
      <div className="section-padding py-12 md:py-20 border-b border-black/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="label-uppercase text-black/40">
              Explore
            </span>
            <h1 className="heading-serif text-5xl md:text-7xl font-bold mt-3">
              Shop Collection
            </h1>
          </motion.div>
        </div>
      </div>

      <div className="section-padding py-8">
        <div className="max-w-7xl mx-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 label-uppercase text-black/60 hover:text-black transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-black rounded-full" />
                )}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] uppercase tracking-wider text-black/50 hover:text-black transition-colors flex items-center gap-1 font-semibold"
                >
                  <X className="w-3 h-3" /> Clear All
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-black/50 hidden sm:block">
                {filteredProducts.length} Products
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none bg-transparent border-b border-black/10 px-2 py-2 pr-6 label-uppercase text-black/70 cursor-pointer hover:border-black/30 transition-colors focus:outline-none"
                >
                  <option value="popular">Popular</option>
                  <option value="new">Newest</option>
                  <option value="price-low">Price: Low → High</option>
                  <option value="price-high">Price: High → Low</option>
                </select>
                <ChevronDown className="w-3 h-3 text-black/50 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-8 md:gap-12 lg:gap-16">
            {/* Filter Sidebar */}
            <AnimatePresence>
              {showFilters && (
                <motion.aside
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 240 }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                  className="hidden lg:block flex-shrink-0 overflow-hidden"
                >
                  <div className="w-[240px] space-y-10 pr-6">
                    {/* Categories */}
                    <div>
                      <h3 className="label-uppercase tracking-[0.2em] mb-4 text-black/80 font-bold">
                        Category
                      </h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => setSelectedCategory("all")}
                          className={`block text-xs uppercase tracking-wider transition-colors ${
                            selectedCategory === "all"
                              ? "text-black font-semibold"
                              : "text-black/50 hover:text-black"
                          }`}
                        >
                          All Products
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat.slug}
                            onClick={() => setSelectedCategory(cat.slug)}
                            className={`block text-xs uppercase tracking-wider transition-colors text-left ${
                              selectedCategory === cat.slug
                                ? "text-black font-semibold"
                                : "text-black/50 hover:text-black"
                            }`}
                          >
                            {cat.name} <span className="text-[10px] text-black/30">({cat.productCount})</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sizes */}
                    <div>
                      <h3 className="label-uppercase tracking-[0.2em] mb-4 text-black/80 font-bold">
                        Size
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {allSizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => toggleSize(size)}
                            className={`min-w-[2.5rem] px-3 py-1.5 text-[10px] uppercase transition-all duration-200 ${
                              selectedSizes.includes(size)
                                ? "bg-black text-white"
                                : "bg-[#F5F5F5] text-black hover:bg-black/5"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Colors */}
                    <div>
                      <h3 className="label-uppercase tracking-[0.2em] mb-4 text-black/80 font-bold">
                        Color
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {allColors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => toggleColor(color.name)}
                            className={`w-6 h-6 rounded-full border border-black/10 transition-all duration-200 ${
                              selectedColors.includes(color.name)
                                ? "ring-1 ring-black ring-offset-2 scale-100"
                                : "hover:scale-110"
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <h3 className="label-uppercase tracking-[0.2em] mb-4 text-black/80 font-bold">
                        Price Range
                      </h3>
                      <div className="space-y-4">
                        <input
                          type="range"
                          min={0}
                          max={5000}
                          step={100}
                          value={priceRange[1]}
                          onChange={(e) =>
                            setPriceRange([priceRange[0], parseInt(e.target.value)])
                          }
                          className="w-full accent-black"
                        />
                        <div className="flex items-center justify-between text-xs font-medium text-black">
                          <span>₹{priceRange[0]}</span>
                          <span>₹{priceRange[1].toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Product Grid */}
            <div className="flex-1" ref={ref}>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-24">
                  <p className="text-black/50 text-base mb-6">No products found matching your active filters.</p>
                  <button
                    onClick={clearFilters}
                    className="btn-outline-dark inline-block"
                  >
                    <span>Clear Filters</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-12">
                  {filteredProducts.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                      <ShopProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopProductCard({ product }: { product: Product }) {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const addToCart = useCartStore((state) => state.addItem);

  const isWishlisted = isInWishlist(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.sizes.length) return;
    
    addToCart({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      salePrice: product.salePrice ?? null,
      image: product.images[0],
      size: product.sizes[0],
      color: product.colors[0].name,
      colorHex: product.colors[0].hex,
      quantity: 1,
      stock: product.stock,
    });
    toast.success(`Added ${product.name} to cart`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      salePrice: product.salePrice ?? null,
      image: product.images[0],
      addedAt: new Date().toISOString(),
    });
    if (isWishlisted) {
      toast.success("Removed from wishlist");
    } else {
      toast.success("Added to wishlist");
    }
  };

  const colorString = product.colors.map((c) => c.name).join(" / ");

  return (
    <div className="group font-sans cursor-pointer text-left">
      <Link href={`/product/${product.slug}`}>
        {/* Image Frame - Borderless & Shadowless */}
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50 mb-5">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {product.images[1] && (
            <Image
              src={product.images[1]}
              alt={`${product.name} alternate`}
              fill
              className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          )}

          {/* Badge */}
          {product.badge && product.badge !== "sold-out" && (
            <div className="absolute top-4 left-4 z-10">
              <span className="text-[9px] bg-black text-white px-2 py-1 tracking-[0.15em] uppercase font-bold">
                {product.badge === "best-seller"
                  ? "Best Seller"
                  : product.badge === "limited"
                  ? "Limited"
                  : "New"}
              </span>
            </div>
          )}

          {/* Heart Wishlist Trigger */}
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleWishlist}
              className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300 shadow-sm"
              aria-label="Add to wishlist"
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-black text-black hover:fill-white hover:text-white" : ""}`} />
            </button>
          </div>

          {/* Quick Add Tray */}
          <div className="absolute bottom-0 left-0 right-0 z-10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <button 
              onClick={handleQuickAdd}
              className="w-full bg-black text-white py-3 text-[10px] uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2 hover:bg-neutral-900 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Quick Add
            </button>
          </div>
        </div>

        {/* Text Block - Whitespace emphasis */}
        <div className="space-y-1 px-1">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900 line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            {product.salePrice ? (
              <>
                <span className="text-[12px] font-semibold text-black">
                  ₹{product.salePrice.toLocaleString()}
                </span>
                <span className="text-[10px] text-neutral-400 line-through">
                  ₹{product.price.toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-[12px] font-semibold text-black">
                ₹{product.price.toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">
            {colorString}
          </p>
        </div>
      </Link>
    </div>
  );
}
