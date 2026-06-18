"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  Share2,
  Truck,
  ChevronDown,
  Minus,
  Plus,
  Check,
  Info,
} from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import toast from "react-hot-toast";
import { AuthorLoader } from "@/components/ui/AuthorLoader";
import { optimizeCloudinaryUrl } from "@/lib/shop/catalog";
import { getProductVideo } from "@/lib/shop/videos";
import SizeChart from "@/components/product/SizeChart";

// ── Types matching the API response shape ─────────────────────────────
interface ProductImage {
  id: string;
  url: string;
  alt: string;
  publicId: string | null;
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
  priceOverride: number | null;
  sku: string | null;
}

interface ProductReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  discountPrice: number | null;
  stock: number;
  badge: string | null;
  details: string[];
  careInstructions: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string } | null;
  reviews: ProductReview[];
  averageRating: number;
  _count: { reviews: number };
}

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>("details");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [showVideo, setShowVideo] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const videoDetailRef = useRef<HTMLVideoElement>(null);

  const addToCart = useCartStore((state) => state.addItem);
  const { toggleItem, isInWishlist } = useWishlistStore();

  // Fetch product from API
  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
        const json = await res.json();
        if (json.success && json.data) {
          const p = json.data as ProductData;
          setProduct(p);

          // Set initial selected color from first variant
          if (p.variants.length > 0) {
            const firstColor = p.variants[0].color;
            setSelectedColor(firstColor);
          }
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [slug]);

  // ── Derived data from variants ──────────────────────────────────────
  const uniqueColors = useMemo(() => {
    if (!product) return [];
    const seen = new Map<string, { color: string; colorHex: string }>();
    for (const v of product.variants) {
      if (!seen.has(v.color)) {
        seen.set(v.color, { color: v.color, colorHex: v.colorHex });
      }
    }
    return Array.from(seen.values());
  }, [product]);

  const SIZE_ORDER: Record<string, number> = { XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5 };
  const sizesForColor = useMemo(() => {
    if (!product) return [];
    return product.variants
      .filter((v) => v.color === selectedColor)
      .map((v) => ({ size: v.size, stock: v.stock, id: v.id }))
      .sort((a, b) => (SIZE_ORDER[a.size] ?? 99) - (SIZE_ORDER[b.size] ?? 99));
  }, [product, selectedColor]);

  // ── Images filtered by selected color ───────────────────────────────
  // Image order is now correct at the data/DB level (front first), so no frontend swap needed.
  // (Old swap logic removed — previously swapped indices 0↔1 as a workaround.)
  const colorImages = useMemo(() => {
    if (!product) return [];
    // Filter images by the selected color
    const filtered = product.images.filter(
      (img) => img.color && img.color.toLowerCase() === selectedColor.toLowerCase()
    );
    return filtered.length > 0 ? filtered : product.images;
  }, [product, selectedColor]);

  // Reset selected image and video when color changes
  useEffect(() => {
    setSelectedImage(0);
    setShowVideo(false);
  }, [selectedColor]);

  // Compute video URL for this product
  const videoUrl = product ? getProductVideo(product.slug) : null;

  // Reset selected size when color changes (size availability may differ)
  useEffect(() => {
    setSelectedSize("");
  }, [selectedColor]);

  const isWishlisted = product ? isInWishlist(product.id) : false;

  // ── Price formatting (paise → rupees) ───────────────────────────────
  const formatPrice = (paise: number) => {
    return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    // Find the real variant from the API data
    const matchedVariant = product.variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    );

    if (!matchedVariant) {
      toast.error("Selected variant is not available");
      return;
    }

    if (matchedVariant.stock <= 0) {
      toast.error("This variant is out of stock");
      return;
    }

    // Get the image for the selected color
    const colorImg = product.images.find(
      (img) => img.color && img.color.toLowerCase() === selectedColor.toLowerCase()
    );
    const cartImage = colorImg?.url || product.images[0]?.url || "";

    const effectivePrice = matchedVariant.priceOverride ?? product.discountPrice ?? product.price;

    addToCart({
      productId: product.id,
      variantId: matchedVariant.id, // Real DB variant UUID
      name: product.name,
      slug: product.slug,
      price: Math.round(product.price / 100),
      salePrice: product.discountPrice ? Math.round(product.discountPrice / 100) : null,
      image: cartImage,
      size: selectedSize,
      color: selectedColor,
      colorHex: matchedVariant.colorHex,
      quantity,
      stock: matchedVariant.stock,
    });

    toast.success("Added to cart");
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    const primaryImg = product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url || "";
    toggleItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: Math.round(product.price / 100),
      salePrice: product.discountPrice ? Math.round(product.discountPrice / 100) : null,
      image: primaryImg,
      addedAt: new Date().toISOString(),
    });
    if (isWishlisted) {
      toast.success("Removed from wishlist");
    } else {
      toast.success("Added to wishlist");
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  // ── Loading & Error States ──────────────────────────────────────────
  if (loading) {
    return <AuthorLoader fullscreen />;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-20 md:pt-28 bg-white flex items-center justify-center text-center">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-[0.2em] text-black mb-4">
            Product Not Found
          </h1>
          <p className="text-sm text-neutral-500 mb-8">{error || "This product doesn't exist."}</p>
          <Link
            href="/shop/tshirts"
            className="inline-block border border-black px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-black hover:text-white transition-colors"
          >
            Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  // ── Accordion sections ──────────────────────────────────────────────
  const accordionSections = [
    {
      id: "details",
      title: "Product Details & Fabric",
      content: (
        <div className="space-y-4 font-sans text-xs text-neutral-600 leading-relaxed">
          <ul className="space-y-2">
            {product.details.map((detail, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-black flex-shrink-0" />
                {detail}
              </li>
            ))}
          </ul>
          {product.careInstructions.length > 0 && (
            <div className="border-t border-neutral-100 pt-3">
              <span className="font-bold text-black uppercase block mb-1">Care Instructions</span>
              <ul className="space-y-1">
                {product.careInstructions.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "shipping",
      title: "Shipping & Delivery Timelines",
      content: (
        <div className="text-xs text-neutral-600 space-y-3 font-sans leading-relaxed">
          <div className="flex items-start gap-2.5 text-black font-semibold bg-neutral-50 p-3 rounded-sm">
            <Truck className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
            <div>
              <span className="uppercase block text-[9px] tracking-wider text-neutral-400">Estimated Delivery</span>
              <span>2–4 Business Days (After Fulfillment)</span>
            </div>
          </div>
          <p><strong>Processing & Dispatch:</strong> Please allow 1–5 business days for our team to process and dispatch your order.</p>
          <p><strong>Shipping Provider:</strong> DDT Powered Delivery</p>
          <p>Shipping may be delayed due to destination, courier conditions, and national holidays.</p>
          <p>Please allow up to <strong>15 business days</strong> before contacting us in regards to your order.</p>
          <p>Standard return & exchange policy: 14 days from date of delivery.</p>
        </div>
      ),
    },
  ];

  const hasDiscount = product.discountPrice !== null && product.discountPrice < product.price;

  return (
    <div className="min-h-screen pt-20 md:pt-28 bg-white text-black font-sans">
      <div className="section-padding py-8 md:py-16">
        <div className="max-w-7xl mx-auto">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[10px] text-neutral-400 mb-8 uppercase tracking-widest font-bold">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-black transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-black">{product.category?.name || "Products"}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">

            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:sticky lg:top-32 h-fit"
            >
              {/* Main image / video viewer */}
              <div
                ref={imageContainerRef}
                className="relative w-full aspect-[3/4] md:aspect-[4/5] lg:aspect-[4/5] xl:aspect-[4/5] overflow-hidden bg-white mb-4 flex items-center justify-center"
                onMouseEnter={() => !showVideo && setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={!showVideo ? handleMouseMove : undefined}
                style={{ cursor: showVideo ? "default" : "zoom-in" }}
              >
                {showVideo && videoUrl ? (
                  /* ── Video player ── */
                  <video
                    ref={videoDetailRef}
                    key={videoUrl}
                    src={videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* ── Static image with zoom ── */
                  colorImages[selectedImage] && (
                    <Image
                      src={optimizeCloudinaryUrl(colorImages[selectedImage].url, 1200)}
                      alt={colorImages[selectedImage].alt || product.name}
                      fill
                      className="w-full h-full object-cover md:object-contain object-center"
                      style={{
                        transform: isZoomed ? `scale(1.8)` : "scale(1)",
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        transition: isZoomed ? "none" : "transform 0.4s ease-out",
                      }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      quality={85}
                      priority
                    />
                  )
                )}
              </div>

              {/* Thumbnails — images + optional video */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {colorImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => { setSelectedImage(i); setShowVideo(false); }}
                    className={`relative w-20 h-24 overflow-hidden bg-neutral-50 transition-all duration-300 flex-shrink-0 ${
                      !showVideo && selectedImage === i
                        ? "opacity-100 border border-black"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={optimizeCloudinaryUrl(img.url, 200)}
                      alt={img.alt || `${product.name} thumbnail ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}

                {/* Video thumbnail — only shown if a video is available */}
                {videoUrl && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className={`relative w-20 h-24 overflow-hidden bg-neutral-900 transition-all duration-300 flex-shrink-0 flex flex-col items-center justify-center gap-1.5 ${
                      showVideo
                        ? "opacity-100 border border-black"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <span className="text-white text-xl leading-none">▶</span>
                    <span className="text-white text-[8px] uppercase tracking-widest font-bold">Reel</span>
                  </button>
                )}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:py-2 text-left"
            >
              {/* Name */}
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-[0.2em] text-neutral-900 leading-snug">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-center gap-3 mt-4">
                {hasDiscount ? (
                  <>
                    <span className="text-lg text-black font-bold font-sans">
                      {formatPrice(product.discountPrice!)}
                    </span>
                    <span className="text-sm text-neutral-400 line-through font-sans">
                      {formatPrice(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg text-black font-bold font-sans">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1.5 font-medium">
                Inclusive of all taxes
              </p>

              <div className="border-t border-neutral-100 my-6" />

              {/* Description */}
              <p className="text-neutral-600 text-sm leading-relaxed tracking-wide font-sans mb-8">
                {product.description}
              </p>

              {/* Color selector */}
              <div className="mb-8">
                <div className="flex items-center mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                    Color: <span className="text-black ml-1 uppercase">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {uniqueColors
                    .filter((c) => c.color === selectedColor)
                    .map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setSelectedColor(c.color)}
                      className={`w-7 h-7 rounded-full border border-neutral-300 transition-all duration-200 ${
                        selectedColor === c.color
                          ? "ring-1 ring-black ring-offset-4 scale-100"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c.colorHex }}
                      title={c.color}
                    />
                  ))}
                </div>
              </div>

              {/* Size selector */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                    Size: <span className="text-black ml-1 uppercase">{selectedSize || "Select"}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizesForColor.map((s) => (
                    <button
                      key={s.size}
                      onClick={() => s.stock > 0 && setSelectedSize(s.size)}
                      disabled={s.stock <= 0}
                      className={`w-12 h-12 text-xs font-bold transition-all duration-200 flex items-center justify-center ${
                        s.stock <= 0
                          ? "bg-neutral-50 border border-neutral-100 text-neutral-300 cursor-not-allowed line-through"
                          : selectedSize === s.size
                          ? "bg-black text-white"
                          : "bg-neutral-50 border border-neutral-100 text-black hover:bg-neutral-100"
                      }`}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Chart — category-specific */}
              {product.category?.slug && (
                <SizeChart categorySlug={product.category.slug} />
              )}

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex items-center justify-between bg-neutral-50 border border-neutral-100 text-black w-full sm:w-32 h-12">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-full flex items-center justify-center hover:bg-neutral-100 transition-colors"
                  >
                    <Minus className="w-3 h-3 text-neutral-500" />
                  </button>
                  <span className="text-xs font-bold font-sans">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="w-10 h-full flex items-center justify-center hover:bg-neutral-100 transition-colors"
                  >
                    <Plus className="w-3 h-3 text-neutral-500" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="add-to-cart-btn flex-1 bg-[#111111] text-white text-[11px] sm:text-xs uppercase tracking-[0.25em] font-bold flex items-center justify-center gap-2 hover:bg-[#333333] transition-all duration-300 min-h-[54px] px-6 py-3.5 rounded-[6px] cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              </div>

              {/* Wishlist & Share */}
              <div className="flex items-center gap-6 py-4 mb-8">
                <button
                  onClick={handleWishlistToggle}
                  className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors ${
                    isWishlisted ? "text-black" : "text-neutral-400 hover:text-black"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-black text-black" : ""}`} />
                  {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 hover:text-black transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share Item
                </button>
              </div>

              {/* Accordion */}
              <div className="divide-y divide-neutral-100 border-y border-neutral-100">
                {accordionSections.map((section) => (
                  <div key={section.id} className="py-4">
                    <button
                      onClick={() =>
                        setOpenAccordion(
                          openAccordion === section.id ? null : section.id
                        )
                      }
                      className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-bold text-black hover:text-neutral-500 transition-colors"
                    >
                      {section.title}
                      <motion.div
                        animate={{
                          rotate: openAccordion === section.id ? 180 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openAccordion === section.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 pb-1">{section.content}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
