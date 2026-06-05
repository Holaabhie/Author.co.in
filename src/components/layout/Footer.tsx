"use client";

import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  const footerLinks = {
    Brand: [
      { name: "Author", href: "/" },
    ],
    Shop: [
      { name: "New Arrivals", href: "/shop?sort=newest" },
      { name: "Best Sellers", href: "/shop?sort=popular" },
      { name: "T-Shirts", href: "/shop?category=t-shirts" },
      { name: "Hoodies", href: "/shop?category=hoodies" },
      { name: "Joggers", href: "/shop?category=joggers" },
    ],
    Info: [
      { name: "About Us", href: "/about" },
      { name: "Contact", href: "/contact" },
      { name: "Shipping", href: "/shipping" },
      { name: "Returns", href: "/returns" },
      { name: "FAQ", href: "/faq" },
    ],
    Support: [
      { name: "Size Guide", href: "/size-guide" },
      { name: "Track Order", href: "/account/orders" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
    ],
  };

  return (
    <footer className="bg-[#050505]">
      <div className="section-padding py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div>
              <Link href="/" className="inline-block mb-4">
                <span className="font-playfair text-2xl text-white">Author</span>
              </Link>
              <p className="text-muted text-xs leading-relaxed max-w-[200px]">
                Premium streetwear crafted for the bold. Write your story through what you wear.
              </p>
            </div>

            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="section-label text-white/80 mb-4">{title}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-xs text-muted hover:text-white transition-colors duration-300"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="section-padding py-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-muted/60 tracking-wider">
            © 2026 AUTHOR. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}