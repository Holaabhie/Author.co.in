"use client";

import { useState, useRef } from "react";
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
  Info
} from "lucide-react";
import { products } from "@/data/products";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import toast from "react-hot-toast";

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const product = products.find((p) => p.slug === slug) || products[0];

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || "");
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>("details");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const addToCart = useCartStore((state) => state.addItem);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 6);

  const selectedColorData = product.colors.find((c) => c.name === selectedColor);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      salePrice: product.salePrice ?? null,
      image: product.images[0],
      size: selectedSize,
      color: selectedColor,
      colorHex: selectedColorData?.hex || "#000000",
      quantity,
      stock: product.stock,
    });
    
    toast.success("Added to cart");
  };

  const handleWishlistToggle = () => {
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

  const handleShare = async () => {
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
          {product.fabricDetails && (
            <div className="border-t border-neutral-100 pt-3">
              <span className="font-bold text-black uppercase block mb-1">Fabric Specifications</span>
              <p>{product.fabricDetails}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "size",
      title: "Measurements & Size Guide",
      content: (
        <div className="space-y-4 font-sans text-xs text-neutral-600">
          {product.modelInfo && <p className="font-semibold text-black">{product.modelInfo}</p>}
          <p>Fit: True to size / Boxy silhouette. Check your measurements below:</p>
          {product.sizeChart && (
            <div className="overflow-x-auto border border-neutral-100 rounded-sm mt-3">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-150 text-[10px] uppercase font-bold text-black">
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5">Chest</th>
                    <th className="p-2.5">Length</th>
                    <th className="p-2.5">Shoulder</th>
                  </tr>
                </thead>
                <tbody>
                  {product.sizeChart.map((row) => (
                    <tr key={row.size} className="border-b border-neutral-50 text-[11px]">
                      <td className="p-2.5 font-bold text-black">{row.size}</td>
                      <td className="p-2.5">{row.chest}</td>
                      <td className="p-2.5">{row.length}</td>
                      <td className="p-2.5">{row.shoulder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          {product.deliveryEstimate && (
            <div className="flex items-start gap-2.5 text-black font-semibold bg-neutral-50 p-3 rounded-sm">
              <Truck className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
              <div>
                <span className="uppercase block text-[9px] tracking-wider text-neutral-400">Estimated Delivery</span>
                <span>{product.deliveryEstimate}</span>
              </div>
            </div>
          )}
          <p>Orders are processed and dispatched within 24 hours via premium air shipping (DHL Express / Blue Dart).</p>
          <p>Free express delivery on all orders above ₹4,000.</p>
          <p>Standard return & exchange policy: 14 days from date of delivery.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen pt-20 md:pt-28 bg-white text-black font-sans">
      <div className="section-padding py-8 md:py-16">
        <div className="max-w-7xl mx-auto">
          
          {/* Breadcrumb - Clean & Light */}
          <nav className="flex items-center gap-2 text-[10px] text-neutral-400 mb-8 uppercase tracking-widest font-bold">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-black transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-black">{product.category}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
            
            {/* Image Gallery - Stack/Sticky */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:sticky lg:top-32 h-fit"
            >
              {/* Main image box (Borderless & Clean whitespace look) */}
              <div
                ref={imageContainerRef}
                className="relative aspect-[3/4] overflow-hidden bg-neutral-50 mb-4 cursor-zoom-in"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
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

                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="text-[9px] bg-black text-white px-2.5 py-1 tracking-[0.2em] uppercase font-bold">
                      {product.badge === "best-seller"
                        ? "Best Seller"
                        : product.badge === "limited"
                        ? "Limited"
                        : "New"}
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail list */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-24 overflow-hidden bg-neutral-50 transition-all duration-300 flex-shrink-0 ${
                      selectedImage === i
                        ? "opacity-100 border border-black"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Product description block */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:py-2 text-left"
            >
              {/* Product Header */}
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-[0.2em] text-neutral-900 leading-snug">
                {product.name}
              </h1>

              {/* Price display (₹1,999 formatted as requested) */}
              <div className="flex items-center gap-3 mt-4">
                {product.salePrice ? (
                  <>
                    <span className="text-lg text-black font-bold font-sans">
                      ₹{product.salePrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-neutral-400 line-through font-sans">
                      ₹{product.price.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-lg text-black font-bold font-sans">
                    ₹{product.price.toLocaleString()}
                  </span>
                )}
              </div>

              <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1.5 font-medium">
                Inclusive of all taxes
              </p>

              {/* Visual Divider */}
              <div className="border-t border-neutral-100 my-6" />

              {/* Brand highlights (Fabric, Model, Timelines - key fashion detail requested) */}
              <div className="space-y-3 mb-8 bg-neutral-50 p-4 rounded-sm border border-neutral-100">
                {product.fabricDetails && (
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700">
                    <Info className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-black uppercase block text-[9px] tracking-wider text-neutral-400">Fabric details</span>
                      <span>{product.fabricDetails}</span>
                    </div>
                  </div>
                )}
                {product.modelInfo && (
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700">
                    <User className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-black uppercase block text-[9px] tracking-wider text-neutral-400">Fit & sizing</span>
                      <span>{product.modelInfo}</span>
                    </div>
                  </div>
                )}
                {product.deliveryEstimate && (
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700">
                    <Truck className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-black uppercase block text-[9px] tracking-wider text-neutral-400">Delivery Estimate</span>
                      <span>{product.deliveryEstimate}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-neutral-600 text-sm leading-relaxed tracking-wide font-sans mb-8">
                {product.description}
              </p>

              {/* Color list selector */}
              <div className="mb-8">
                <div className="flex items-center mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                    Color: <span className="text-black ml-1 uppercase">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-7 h-7 rounded-full border border-neutral-300 transition-all duration-200 ${
                        selectedColor === color.name
                          ? "ring-1 ring-black ring-offset-4 scale-100"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Size grid selector */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                    Size: <span className="text-black ml-1 uppercase">{selectedSize || "Select"}</span>
                  </span>
                  
                  {/* Size guide selector trigger */}
                  <button 
                    onClick={() => setOpenAccordion(openAccordion === "size" ? null : "size")}
                    className="text-[10px] text-black font-bold uppercase tracking-widest underline hover:text-neutral-500 transition-colors"
                  >
                    Size Measurements
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 text-xs font-bold transition-all duration-200 flex items-center justify-center ${
                        selectedSize === size
                          ? "bg-black text-white"
                          : "bg-neutral-50 border border-neutral-100 text-black hover:bg-neutral-100"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity selector and Add-to-cart */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                
                {/* Quantity adjustments */}
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

              {/* Interactive Wishlist & Share buttons */}
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

              {/* Accordion list */}
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

          {/* Related items Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-24 md:mt-32 pt-16 border-t border-neutral-100">
              <div className="text-left mb-12">
                <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 block mb-2 font-bold">RECOMENDED</span>
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
                  const colorString = rp.colors.map((c) => c.name).join(" / ");
                  return (
                    <SwiperSlide key={rp.id}>
                      <Link href={`/product/${rp.slug}`} className="group block">
                        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50 mb-4">
                          <Image
                            src={rp.images[0]}
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
                            ₹{rp.price.toLocaleString()}
                          </span>
                          <p className="text-[9px] text-neutral-400 uppercase tracking-widest font-semibold">{colorString}</p>
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

// Simple fallback User icon in case it's not imported or defined
function User({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
