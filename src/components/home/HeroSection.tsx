"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function HeroSection() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-neutral-900">
      {/* Background Image (User's custom asset) */}
      <Image
        src="/hero-bg.png"
        alt="AUTHOR Streetwear Campaign"
        fill
        priority
        className="absolute inset-0 w-full h-full object-cover z-0 object-center"
      />

      {/* Subtle Overlay to make text legible */}
      <div className="absolute inset-0 bg-black/25 z-10" />

      {/* Centered Text Content */}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto text-white">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={animate ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 1.0 }}
          className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.35em] font-light text-white/95"
        >
          Everyday Luxury Essentials
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={animate ? { opacity: 0.7 } : {}}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
      >
        <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-white/60">Scroll</span>
        <div className="w-[1px] h-6 bg-white/20">
          <div className="w-full h-1/2 bg-white/60 animate-pulse-vertical origin-top" />
        </div>
      </motion.div>
    </section>
  );
}