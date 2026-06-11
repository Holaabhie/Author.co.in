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
  Loader2,
} from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import toast from "react-hot-toast";

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
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const addToCart = useCartStore((state) => state.addItem);
  const { toggleItem, isInWishlist } = useWishlistStore();

  // Related products
  const [relatedProducts, setRelatedProducts] = useState<ProductData[]>([]);

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

          // Fetch related products from same category
          if (p.category?.slug) {
            fetch(`/api/products?category=${encodeURIComponent(p.category.slug)}&pageSize=7`)
              .then((r) => r.json())
              .then((rJson) => {
                if (rJson.success && Array.isArray(rJson.data)) {
                  setRelatedProducts(
                    rJson.data.filter((rp: ProductData) => rp.id !== p.id).slice(0, 6)
                  );
                }
              })
              .catch(() => {});
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

  const sizesForColor = useMemo(() => {
    if (!product) return [];
    return product.variants
      .filter((v) => v.color === selectedColor)
      .map((v) => ({ size: v.size, stock: v.stock, id: v.id }));
  }, [product, selectedColor]);

  // ── Images filtered by selected color ───────────────────────────────
  const colorImages = useMemo(() => {
    if (!product) return [];
    // Filter images by the selected color
    const filtered = product.images.filter(
      (img) => img.color && img.color.toLowerCase() === selectedColor.toLowerCase()
    );
    // If no color-tagged images exist, show all images
    return filtered.length > 0 ? filtered : product.images;
  }, [product, selectedColor]);

  // Reset selected image when color changes
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedColor]);

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
    return (
      <div className="min-h-screen pt-20 md:pt-28 bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
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
              <span>3–5 Business Days</span>
            </div>
          </div>
          <p>Orders are processed and dispatched within 24 hours via premium air shipping (DHL Express / Blue Dart).</p>
          <p>Free express delivery on all orders above ₹4,000.</p>
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
              {/* Main image */}
              <div
                ref={imageContainerRef}
                className="relative aspect-[3/4] overflow-hidden bg-neutral-50 mb-4 cursor-zoom-in"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                {colorImages[selectedImage] && (
                  <Image
                    src={colorImages[selectedImage].url}
                    alt={colorImages[selectedImage].alt || product.name}
                    fill
                    className="object-cover"
                    style={{
                      transform: isZoomed ? `scale(1.8)` : "scale(1)",
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      transition: isZoomed ? "none" : "transform 0.4s ease-out",
                    }}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                )}

                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="text-[9px] bg-black text-white px-2.5 py-1 tracking-[0.2em] uppercase font-bold">
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

              {/* Thumbnails — only images for the selected color */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {colorImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-24 overflow-hidden bg-neutral-50 transition-all duration-300 flex-shrink-0 ${
                      selectedImage === i
                        ? "opacity-100 border border-black"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `${product.name} thumbnail ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
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
                  {uniqueColors.map((c) => (
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
                  className="flex-1 h-12 bg-black text-white text-[11px] uppercase tracking-[0.25em] font-bold flex items-center justify-center gap-2 hover:bg-neutral-900 transition-all duration-300"
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

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-24 md:mt-32 pt-16 border-t border-neutral-100">
              <div className="text-left mb-12">
                <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 block mb-2 font-bold">RECOMMENDED</span>
                <h2 className="text-lg md:text-xl uppercase tracking-[0.2em] font-bold text-black">
                  Complete the Look
                </h2>
              </div>

              <Swiper
                modules={[FreeMode]}
                spaceBetween={20}
                slidesPerView={1.5}
                freeMode={true}
                breakpoints={{
                  640: { slidesPerView: 2.5 },
                  1024: { slidesPerView: 4 },
                }}
              >
                {relatedProducts.map((rp) => {
                  const rpColors = rp.variants
                    .filter((v, i, arr) => arr.findIndex((a) => a.color === v.color) === i)
                    .map((v) => v.color);
                  const rpImage = rp.images.find((img) => img.isPrimary)?.url || rp.images[0]?.url || "";
                  return (
                    <SwiperSlide key={rp.id}>
                      <Link href={`/product/${rp.slug}`} className="group block">
                        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50 mb-4">
                          <Image
                            src={rpImage}
                            alt={rp.name}
                            fill
                            className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                            sizes="(max-width: 768px) 60vw, 25vw"
                          />
                        </div>
                        <div className="space-y-1 text-left px-1">
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-900 group-hover:text-neutral-500 transition-colors">
                            {rp.name}
                          </h3>
                          <span className="text-xs font-bold text-black block font-sans">
                            ₹{Math.round(rp.price / 100).toLocaleString("en-IN")}
                          </span>
                          <p className="text-[9px] text-neutral-400 uppercase tracking-widest font-semibold">
                            {rpColors.join(" / ")}
                          </p>
                        </div>
                      </Link>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
