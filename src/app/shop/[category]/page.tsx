"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { AuthorLoader } from "@/components/ui/AuthorLoader";
import { optimizeCloudinaryUrl } from "@/lib/shop/catalog";
import { getProductVideo } from "@/lib/shop/videos";
import { ProductVideoCard } from "@/components/common/ProductVideoCard";

// ── Slug → DB category slug mapping ──────────────────────────────────
const CATEGORY_SLUG_MAP: Record<string, string[]> = {
  tshirts: ["tshirts"],
  tops: ["tops"],
  top: ["tops"],
  sweatpants: ["sweatpants"],
};

const CATEGORY_DISPLAY: Record<string, string> = {
  tshirts: "T-Shirts",
  tops: "Tops",
  top: "Tops",
  sweatpants: "Sweatpants",
};

type SortOption = "newest" | "price-asc" | "price-desc";

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  color: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  badge: string | null;
  stock: number;
  isFeatured: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  category: { name: string; slug: string } | null;
  _count?: { reviews: number };
}

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const displayName = CATEGORY_DISPLAY[categorySlug] || categorySlug;

  // Fetch products from the existing API
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);

      const possibleSlugs = CATEGORY_SLUG_MAP[categorySlug] || [categorySlug];
      let fetchedProducts: Product[] = [];

      // Try each possible DB slug until one returns results
      for (const dbSlug of possibleSlugs) {
        try {
          const sortParam =
            sort === "price-asc" ? "price" : sort === "price-desc" ? "-price" : "-createdAt";
          const res = await fetch(
            `/api/products?category=${encodeURIComponent(dbSlug)}&sort=${sortParam}&pageSize=50`
          );
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            fetchedProducts = json.data;
            break;
          }
        } catch (err) {
          console.error(`Failed to fetch products for category ${dbSlug}:`, err);
        }
      }

      if (fetchedProducts.length === 0) {
        setError("No products found in this category.");
      }

      // Dev verification logs as requested in PART 6
      if (categorySlug === "tshirts") {
        console.log("TSHIRTS PRODUCTS:", fetchedProducts.map(p => p.name));
      } else if (categorySlug === "tops") {
        console.log("TOPS PRODUCTS:", fetchedProducts.map(p => p.name));
      } else if (categorySlug === "sweatpants") {
        console.log("SWEATPANTS PRODUCTS:", fetchedProducts.map(p => p.name));
      }

      setProducts(fetchedProducts);
      setLoading(false);
    }

    fetchProducts();
  }, [categorySlug, sort]);

  // Get primary image for a product card — always use images[0] which is the FRONT image.
  // Fix: previously used isPrimary flag which could mismatch; now we rely on sort order
  // where images[0] is always the front-side image after the data fix.
  const getPrimaryImage = (product: Product): string => {
    if (product.images.length === 0) return "/placeholder.png";
    // images are returned sorted by sortOrder asc from the API,
    // so images[0] is always the front image.
    return product.images[0].url;
  };

  // Get unique colors from variants
  const getUniqueColors = (variants: ProductVariant[]) => {
    const seen = new Set<string>();
    return variants.filter((v) => {
      if (seen.has(v.color)) return false;
      seen.add(v.color);
      return true;
    });
  };

  // Format price (paise → rupees)
  const formatPrice = (paise: number) => {
    return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
  };

  const sortLabel =
    sort === "price-asc"
      ? "Price: Low to High"
      : sort === "price-desc"
      ? "Price: High to Low"
      : "Newest";

  return (
    <div className="min-h-screen pt-20 md:pt-24 bg-white text-black font-sans">
      <div className="section-padding py-8 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 block mb-3 font-semibold">
              THE ESSENTIALS
            </span>
            <h1 className="text-2xl md:text-3xl uppercase tracking-[0.25em] font-bold text-black font-display">
              {displayName}
            </h1>
          </div>

          {/* Sort & Count Bar */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] text-neutral-400 uppercase tracking-[0.15em] font-medium">
              {loading ? "Loading…" : `${products.length} Products`}
            </span>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-600 hover:text-black transition-colors"
              >
                Sort: {sortLabel}
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isSortOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-neutral-100 shadow-sm z-20 min-w-[180px]">
                  {(
                    [
                      { key: "newest", label: "Newest" },
                      { key: "price-asc", label: "Price: Low to High" },
                      { key: "price-desc", label: "Price: High to Low" },
                    ] as { key: SortOption; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSort(opt.key);
                        setIsSortOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] transition-colors ${
                        sort === opt.key
                          ? "text-black font-bold bg-neutral-50"
                          : "text-neutral-500 hover:text-black hover:bg-neutral-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-32">
              <AuthorLoader size={100} />
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-32">
              <p className="text-sm text-neutral-400 mb-6">{error}</p>
              <Link
                href="/shop/tshirts"
                className="inline-block border border-black px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-black hover:text-white transition-colors"
              >
                Browse T-Shirts
              </Link>
            </div>
          )}

          {/* Product Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10 md:gap-x-8 md:gap-y-14">
              {products.map((product, index) => {
                const uniqueColors = getUniqueColors(product.variants);
                const imageUrl = getPrimaryImage(product);
                const hasDiscount =
                  product.discountPrice !== null && product.discountPrice < product.price;
                const videoUrl = getProductVideo(product.slug);

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Link
                      href={`/product/${product.slug}`}
                      className="group block"
                    >
                       {videoUrl ? (
                        <ProductVideoCard
                          imageUrl={imageUrl}
                          videoUrl={videoUrl}
                          productName={product.name}
                        />
                      ) : (
                        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50 mb-4">
                          <Image
                            src={optimizeCloudinaryUrl(imageUrl, 600)}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            quality={85}
                          />
                          {/* Badge — hide 'new' badge for tshirts category per user request */}
                          {product.badge && !(product.badge === "new" && categorySlug === "tshirts") && (
                            <div className="absolute top-3 left-3 z-10">
                              <span className="text-[8px] bg-black text-white px-2 py-1 tracking-[0.2em] uppercase font-bold">
                                {product.badge === "best-seller"
                                  ? "Best Seller"
                                  : product.badge === "limited"
                                  ? "Limited"
                                  : product.badge === "new"
                                  ? "New"
                                  : product.badge}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Info */}
                      <div className="space-y-1.5 px-0.5">
                        <h3 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-900 group-hover:text-neutral-500 transition-colors leading-snug line-clamp-2">
                          {product.name}
                        </h3>

                        {/* Price */}
                        <div className="flex items-center gap-2">
                          {hasDiscount ? (
                            <>
                              <span className="text-xs font-bold text-black font-sans">
                                {formatPrice(product.discountPrice!)}
                              </span>
                              <span className="text-[10px] text-neutral-400 line-through font-sans">
                                {formatPrice(product.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs font-bold text-black font-sans">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>

                        {/* Color Swatches */}
                        {uniqueColors.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1">
                            {uniqueColors.slice(0, 5).map((v) => (
                              <span
                                key={v.color}
                                className="w-3 h-3 rounded-full border border-neutral-200"
                                style={{ backgroundColor: v.colorHex }}
                                title={v.color}
                              />
                            ))}
                            {uniqueColors.length > 5 && (
                              <span className="text-[8px] text-neutral-400 ml-0.5">
                                +{uniqueColors.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
