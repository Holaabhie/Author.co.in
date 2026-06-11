"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const categories = [
  {
    name: "T-Shirts",
    title: "Core Essentials",
    bg: "#1a1510",
    letter: "T",
    slug: "t-shirts",
  },
  {
    name: "Tops",
    title: "Street Ready",
    bg: "#0e1318",
    letter: "O",
    slug: "tops",
  },
  {
    name: "Sweatpants",
    title: "Street Ready",
    bg: "#0f0e14",
    letter: "S",
    slug: "sweatpants",
  },
];

export default function CategoryGrid() {
  return (
    <section className="section-spacing bg-ink">
      <div className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[2px] bg-black">
            {categories.map((category, i) => (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative overflow-hidden ${
                  i === 0 ? 'row-span-2 min-h-[560px]' : 'min-h-[278px]'
                }`}
                style={{ backgroundColor: category.bg }}
              >
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="absolute inset-0 group flex flex-col justify-end p-6 md:p-8"
                >
                  <span className="section-label text-warm mb-2">{category.name}</span>
                  <h3 className="font-[family:var(--font-barlow-condensed)] text-2xl md:text-3xl text-white mb-4">
                    {category.title}
                  </h3>
                  <span className="section-label text-white/60 group-hover:text-white transition-colors">
                    Explore <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span 
                      className="font-[family:var(--font-barlow-condensed)] text-[200px] md:text-[300px] text-white"
                      style={{ opacity: 0.08, transform: 'scale(1.5)' }}
                    >
                      {category.letter}
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}