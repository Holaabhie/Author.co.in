"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { products } from "@/data/products";
import type { Product } from "@/data/products";
import { useWishlistStore } from "@/lib/store/wishlist";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);

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

  // Convert color list into a readable string: "Black / White"
  const colorString = product.colors.map((c) => c.name).join(" / ");

  return (
    <div className="group font-sans">
      <Link href={`/product/${product.slug}`} className="block">
        {/* Image wrapper - no borders, no shadow, clean aspect-ratio */}
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50 mb-5 transition-all duration-500">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
            priority
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

          {/* Quick Actions (Wishlist heart icon) */}
          <button
            onClick={handleWishlist}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black hover:text-white"
            aria-label="Add to wishlist"
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-black text-black group-hover:fill-white group-hover:text-white" : ""}`} />
          </button>
        </div>

        {/* Product Details - luxury brand spacing and typography */}
        <div className="space-y-1 text-left px-1">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900 transition-colors duration-300">
            {product.name}
          </h3>
          <p className="text-[12px] font-semibold text-black">
            ₹{product.price.toLocaleString()}
          </p>
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">
            {colorString}
          </p>
        </div>
      </Link>
    </div>
  );
}

interface ProductGridProps {
  showViewAll?: boolean;
}

export default function ProductGrid({ showViewAll = true }: ProductGridProps) {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="section-padding">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-20">
            <div>
              <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 block mb-3 font-semibold">
                OUR COLLECTION
              </span>
              <h2 className="text-xl md:text-2xl uppercase tracking-[0.2em] font-bold text-black">
                Featured Essentials
              </h2>
            </div>
            {showViewAll && (
              <Link
                href="/shop"
                className="mt-4 md:mt-0 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 hover:text-black transition-colors inline-flex items-center gap-2 border-b border-transparent hover:border-black pb-1"
              >
                View All Products
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
          </div>

          {/* Grid Layout - no borders, generous spacing */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}