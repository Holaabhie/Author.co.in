"use client";

import { motion } from "framer-motion";

const looks = [
  {
    number: "01",
    name: "The Urban Bold",
    colors: ["#0a0a0a", "#d4a853", "#f5f0e8"],
  },
  {
    number: "02",
    name: "Street Refined",
    colors: ["#2a2a2a", "#f5f0e8", "#6b6560"],
  },
  {
    number: "03",
    name: "Midnight Layer",
    colors: ["#0a0a0a", "#1a1a1a", "#f5f0e8"],
  },
  {
    number: "04",
    name: "Raw Energy",
    colors: ["#1a1510", "#d4a853", "#0a0a0a"],
  },
];

export default function Lookbook() {
  return (
    <section className="section-spacing bg-ink">
      <div className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 md:mb-16">
            <span className="section-label mb-4 block">Editorial</span>
            <h2 className="section-title text-white text-2xl md:text-3xl">
              SS26 <em>Lookbook</em>
            </h2>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:gap-[2px]">
            {looks.map((look, i) => (
              <motion.div
                key={look.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group flex-shrink-0 w-[280px] md:w-auto"
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-[#0a0a0a]">
                  <span 
                    className="font-playfair absolute inset-0 flex items-center justify-center text-[120px] text-white"
                    style={{ opacity: 0.08, fontStyle: 'italic' }}
                  >
                    {look.number}
                  </span>

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />

                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {look.colors.map((color, j) => (
                      <div 
                        key={j}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="section-label text-warm block mb-1">{look.number}</span>
                    <span className="font-playfair text-white">{look.name}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}