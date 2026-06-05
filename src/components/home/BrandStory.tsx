"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const stats = [
  { value: "200+", label: "Styles" },
  { value: "12K+", label: "Customers" },
  { value: "Pan-India", label: "Delivery" },
  { value: "100%", label: "Quality" },
];

export default function BrandStory() {
  return (
    <section className="section-spacing bg-cream">
      <div className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div className="relative aspect-[4/5] overflow-hidden bg-ink">
              <span className="font-playfair absolute inset-0 flex items-center justify-center text-[180px] text-white italic" style={{ opacity: 0.1 }}>
                A
              </span>
              
              <div className="absolute bottom-8 right-8 w-32 h-32 rounded-full border-2 border-warm flex flex-col items-center justify-center">
                <span className="font-playfair text-warm text-xs">Est.</span>
                <span className="font-playfair text-warm text-lg">2024</span>
                <span className="font-playfair text-warm text-xs">India</span>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <span className="section-label mb-4 text-muted">Our Story</span>
              <h2 className="section-title text-ink text-2xl md:text-3xl mb-6">
                Crafted for the <em>Fearless</em>
              </h2>
              
              <p className="text-muted text-sm leading-relaxed mb-8 max-w-md">
                AUTHOR was born from a belief that clothing should be more than fabric — it should be a medium of self-expression.Every stitch, every cut, every detail is a deliberate choice. We craft each piece with premium materials and meticulous attention to detail.
              </p>

              <div className="grid grid-cols-2 gap-6 mb-10">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <span className="font-playfair text-2xl text-ink block">{stat.value}</span>
                    <span className="text-muted text-xs">{stat.label}</span>
                  </motion.div>
                ))}
              </div>

              <Link href="/about" className="btn-primary inline-block w-fit">
                Discover More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}