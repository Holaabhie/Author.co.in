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
      className={`relative ${aspectRatioClassName} overflow-hidden bg-[#F5F5F5] ${marginClassName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Primary image — fades out on hover on desktop, hidden on mobile in favor of video */}
      <Image
        src={optimizeCloudinaryUrl(imageUrl, 600)}
        alt={productName}
        fill
        className={`object-cover transition-all duration-500 md:opacity-100 md:group-hover:opacity-0 md:scale-100 md:group-hover:scale-105 opacity-0`}
        sizes="(max-width: 768px) 100vw, 33vw"
        quality={85}
      />
      {/* Video — autoPlay enabled, visible on mobile, fades in on hover on desktop */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 pointer-events-none opacity-100 md:opacity-0 md:group-hover:opacity-100`}
      />
      {/* Play indicator badge */}
      <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[8px] uppercase tracking-widest px-2 py-1 font-bold z-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
        ▶ Reel
      </div>
      {children}
    </div>
  );
}
