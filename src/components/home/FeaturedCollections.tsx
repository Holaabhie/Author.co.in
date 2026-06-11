"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const collections = [
  {
    name: "Oversized Tees",
    slug: "t-shirts",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=85",
    description: "Statement pieces in heavyweight cotton",
  },
  {
    name: "Tops",
    slug: "tops",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=85",
    description: "Crafted for comfort, designed for the streets",
  },
  {
    name: "Sweatpants",
    slug: "sweatpants",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=85",
    description: "Structured silhouettes for everyday luxury",
  },
];

export default function FeaturedCollections() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="section-spacing section-padding">
      <div className="max-w-7xl mx-auto">
        {/* Section Header — Fratelli-style centered with serif */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-24"
        >
          <p className="label-uppercase text-author-mid mb-4">Collections</p>
          <h2 className="font-[family:var(--font-barlow-condensed)] text-display-lg text-author-white">
            Curated Categories
          </h2>
        </motion.div>

        {/* 3-column grid — clean, no gaps = editorial magazine feel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/5">
          {collections.map((collection, i) => (
            <motion.div
              key={collection.slug}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.15 }}
            >
              <Link
                href={`/shop?category=${collection.slug}`}
                className="group block relative bg-author-black"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    fill
                    className="object-cover transition-transform duration-[1.5s] ease-out-expo group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* Subtle dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-700" />

                  {/* Bottom text overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h3 className="font-[family:var(--font-barlow-condensed)] text-2xl md:text-3xl text-white mb-2">
                      {collection.name}
                    </h3>
                    <p className="text-white/60 text-xs tracking-wide mb-4">
                      {collection.description}
                    </p>
                    <span className="label-uppercase text-white/80 inline-flex items-center gap-2 group-hover:gap-3 transition-all duration-500">
                      Explore
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
