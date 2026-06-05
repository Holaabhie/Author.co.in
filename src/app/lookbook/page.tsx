"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const lookbookImages = [
  "https://www.fratelliarena.com/cdn/shop/files/1_cfa21556-66eb-42e1-b1b5-6b045d384eb4_2048x2048.jpg?v=1778968237",
  "https://www.fratelliarena.com/cdn/shop/files/2_43d149a9-57f8-406f-8eac-2a6e529064f7_2048x2048.jpg?v=1778968236",
  "https://www.fratelliarena.com/cdn/shop/files/3_659cb60e-ee8e-44e9-84ef-de0aadd91d36_2048x2048.jpg?v=1778968237",
  "https://www.fratelliarena.com/cdn/shop/files/4_b5b6b865-2520-476d-954d-90646c7c2067_2048x2048.jpg?v=1778968236",
  "https://www.fratelliarena.com/cdn/shop/files/5_b2e83e73-a72a-460f-9113-203f2db01e9c_2048x2048.jpg?v=1778968236",
  "https://www.fratelliarena.com/cdn/shop/files/6_9bf0580c-9818-48ee-b6b2-681e325526c4_2048x2048.jpg?v=1778968236",
  "https://www.fratelliarena.com/cdn/shop/files/7_86dcadd9-a8a4-4385-b5e5-333dd3f8025f_2048x2048.jpg?v=1778968237",
  "https://www.fratelliarena.com/cdn/shop/files/8_c11a837b-f6c5-4e14-a0e7-b2bc8a64b636_2048x2048.jpg?v=1778968234",
  "https://www.fratelliarena.com/cdn/shop/files/9_8d829b97-546d-474f-a058-75faed61c5c4_2048x2048.jpg?v=1778968237",
  "https://www.fratelliarena.com/cdn/shop/files/10_3919e78c-27bf-4492-88eb-4826eea8dca3_2048x2048.jpg?v=1778968236",
  "https://www.fratelliarena.com/cdn/shop/files/1_cfb0c47a-4cd7-421b-b0e5-8f54e3c2ee28_2048x2048.jpg?v=1776371595",
  "https://www.fratelliarena.com/cdn/shop/files/2_271ed420-17fc-499e-9b2a-4d670d90d366_2048x2048.jpg?v=1776371595",
  "https://www.fratelliarena.com/cdn/shop/files/3_681bdefd-3160-49ef-b274-f09f38033cc8_2048x2048.jpg?v=1776371595",
  "https://www.fratelliarena.com/cdn/shop/files/4_aaec974b-94a4-492b-bd58-bbd4003812c1_2048x2048.jpg?v=1776371594",
  "https://www.fratelliarena.com/cdn/shop/files/5_74cf8e01-72c5-42ed-8fda-f0473d172f2d_2048x2048.jpg?v=1776371594",
  "https://www.fratelliarena.com/cdn/shop/files/6_9eaaca06-3ec3-4e88-8f71-73f51392b26d_2048x2048.jpg?v=1776371594",
  "https://www.fratelliarena.com/cdn/shop/files/7_bb1ec409-4182-424b-9677-3e171f70fe67_2048x2048.jpg?v=1776371598",
  "https://www.fratelliarena.com/cdn/shop/files/8_aec74760-1221-4f8f-b20f-64e245eda86c_2048x2048.jpg?v=1776371598",
  "https://www.fratelliarena.com/cdn/shop/files/9_b953d51a-c97e-4c02-b765-0d14dd356be3_2048x2048.jpg?v=1776371598",
  "https://www.fratelliarena.com/cdn/shop/files/10_1a9cc3b7-f1e6-426e-bf94-263650fb0730_2048x2048.jpg?v=1776371598"
];

export default function LookbookPage() {
  return (
    <div className="min-h-screen pt-20 md:pt-28 bg-white text-black font-sans">
      {/* Header Info */}
      <div className="section-padding py-12 md:py-20 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 block mb-2 font-bold">
              VISUAL JOURNAL
            </span>
            <h1 className="text-3xl md:text-5xl uppercase tracking-[0.25em] font-bold text-black leading-tight">
              SS26 Lookbook
            </h1>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mt-2 font-semibold">
              Everyday Luxury Essentials by AUTHOR
            </p>
          </motion.div>
        </div>
      </div>

      {/* Grid of Lookbook images */}
      <div className="section-padding py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-12 md:gap-24">
            {lookbookImages.map((src, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative w-full aspect-[3/4] bg-neutral-50"
              >
                <Image
                  src={src}
                  alt={`Lookbook Editorial Frame ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 800px"
                  priority={index < 2}
                />
              </motion.div>
            ))}
          </div>

          {/* Bottom call to action */}
          <div className="text-center py-16 mt-12 border-t border-neutral-100">
            <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 block mb-4 font-bold">
              THE COLLECTION
            </span>
            <h3 className="text-base uppercase tracking-[0.2em] font-bold mb-8">
              Explore the SS26 Catalog
            </h3>
            <Link
              href="/shop"
              className="btn-primary inline-block text-center"
            >
              Shop All Essentials
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
