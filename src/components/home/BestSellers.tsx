"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlistStore } from "@/lib/store/wishlist";

interface DBProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  images: { url: string }[];
  variants: { color: string; colorHex: string }[];
  badge: string | null;
}

export default function BestSellers() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toggleItem, isInWishlist } = useWishlistStore();
  const [bestSellers, setBestSellers] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?pageSize=20")
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success && resJson.data) {
          const filtered = resJson.data.filter((p: any) => p.badge === "best-seller");
          setBestSellers(filtered.slice(0, 4));
        }
      })
      .catch((err) => console.error("Error loading best sellers:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section ref={ref} className="section-spacing section-padding bg-white">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-6 bg-neutral-200 w-48 mb-16 rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="space-y-4">
                <div className="aspect-[3/4] bg-neutral-100 rounded" />
                <div className="h-4 bg-neutral-200 w-3/4 rounded" />
                <div className="h-4 bg-neutral-200 w-1/4 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="section-spacing section-padding bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-20"
        >
          <div>
            <p className="label-uppercase text-black/40 mb-4">Most Loved</p>
            <h2 className="heading-serif text-display-lg text-black">
              Best Sellers
            </h2>
          </div>
          <Link
            href="/shop?sort=popular"
            className="mt-6 md:mt-0 label-uppercase text-black/60 hover:text-black transition-colors inline-flex items-center gap-2"
          >
            View All
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>

        {/* 4 column grid — gallery feel */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
          {bestSellers.map((product, i) => {
            const images = product.images.map((img) => img.url);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group"
              >
                <Link href={`/product/${product.slug}`}>
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#F5F5F5] mb-4">
                    {images[0] ? (
                      <Image
                        src={images[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                        No Image
                      </div>
                    )}

                    {images[1] && (
                      <Image
                        src={images[1]}
                        alt={product.name}
                        fill
                        className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    )}

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleItem({
                          productId: product.id,
                          name: product.name,
                          slug: product.slug,
                          price: product.price / 100, // paise to rupees
                          salePrice: product.discountPrice ? product.discountPrice / 100 : null,
                          image: images[0] || "",
                          addedAt: new Date().toISOString(),
                        });
                      }}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isInWishlist(product.id)
                            ? "text-red-500 fill-red-500"
                            : "text-black/60 hover:text-black"
                        }`}
                      />
                    </button>

                    <span className="absolute top-3 left-3 label-uppercase text-[9px] bg-black text-white px-2 py-1 tracking-[0.15em]">
                      Best Seller
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xs text-black/80 tracking-wide leading-snug line-clamp-1 group-hover:text-black transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {product.discountPrice ? (
                        <>
                          <span className="text-sm text-black font-medium">
                            ₹{(product.discountPrice / 100).toLocaleString()}
                          </span>
                          <span className="text-xs text-black/30 line-through">
                            ₹{(product.price / 100).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-black font-medium">
                          ₹{(product.price / 100).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
