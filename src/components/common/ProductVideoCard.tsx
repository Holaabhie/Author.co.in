"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { optimizeCloudinaryUrl } from "@/lib/shop/catalog";

interface ProductVideoCardProps {
  imageUrl: string;
  videoUrl: string;
  productName: string;
  aspectRatioClassName?: string;
  marginClassName?: string;
  children?: React.ReactNode;
}

/**
 * ProductVideoCard — displays the front product image as the default thumbnail.
 * On desktop: video fades in on hover over the card image.
 * On mobile: video auto-plays below/over the image on tap or auto interaction.
 *
 * Fix: image is always the primary visible element (object-fit: cover, full size).
 * Video uses object-fit: cover to fit the card without stretching/overflow/blank space.
 */
export function ProductVideoCard({
  imageUrl,
  videoUrl,
  productName,
  aspectRatioClassName = "aspect-[3/4]",
  marginClassName = "mb-4",
  children,
}: ProductVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  return (
    <div
      className={`relative ${aspectRatioClassName} overflow-hidden bg-[#F5F5F5] ${marginClassName} group`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Primary front image — always visible by default, fades out on hover (desktop) */}
      {/* Fix: image always shows as the card thumbnail (no opacity-0 on mobile) */}
      <Image
        src={optimizeCloudinaryUrl(imageUrl, 600)}
        alt={productName}
        fill
        className="object-cover transition-all duration-500 group-hover:opacity-0 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 33vw"
        quality={85}
      />
      {/* Video — hidden by default, visible on hover (desktop) or auto-plays (mobile).
          Fix: object-fit: cover ensures video fills card without stretch/overflow/blank space */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 pointer-events-none opacity-0 group-hover:opacity-100"
        style={{
          /* Fallback: ensure object-fit cover works in all browsers */
          objectFit: "cover",
          width: "100%",
          height: "100%",
        }}
      />
      {/* Play indicator badge — only visible on hover */}
      <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[8px] uppercase tracking-widest px-2 py-1 font-bold z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        ▶ Reel
      </div>
      {children}
    </div>
  );
}
