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
    <section
      className="relative w-full flex items-center justify-center overflow-hidden bg-neutral-900"
      style={{ height: '100svh' }}
    >
      {/* Background Image */}
      <Image
        src="/hero-bg.png"
        alt="AUTHOR Streetwear Campaign"
        fill
        priority
        className="absolute inset-0 w-full h-full object-cover z-0 object-center"
      />

      {/* Subtle Overlay */}
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
    </section>
  );
}