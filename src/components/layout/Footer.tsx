"use client";

import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  const shopLinks = [
    { name: "T-Shirts", href: "/shop?category=t-shirts" },
    { name: "Tops", href: "/shop?category=tops" },
    { name: "Sweatpants", href: "/shop?category=sweatpants" },
  ];

  const aboutLinks = [
    { name: "Our Story", href: "/about" },
    { name: "Shipping", href: "/shipping" },
    { name: "Returns", href: "/returns" },
    { name: "Contact", href: "/contact" },
  ];

  const supportLinks = [
    { name: "Track Order", href: "/account/orders" },
    { name: "Size Guide", href: "/size-guide" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ];

  const socials = [
    { name: "Instagram", icon: Instagram, href: "https://instagram.com" },
    { name: "Facebook", icon: Facebook, href: "https://facebook.com" },
    { name: "X", icon: Twitter, href: "https://twitter.com" },
  ];

  return (
    <footer className="bg-black">
      {/* Top border accent */}
      <div className="w-full h-px bg-[#1a1a1a]" />

      <div className="section-padding py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto">
          {/* Desktop: 4-column grid / Mobile: stacked */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

            {/* Brand Column */}
            <div className="lg:col-span-1">
              <Link href="/" className="inline-block mb-6">
                <span className="font-[family:var(--font-barlow-condensed)] text-2xl text-white tracking-[0.15em] uppercase font-bold">
                  Author
                </span>
              </Link>
              <p className="text-[#A1A1AA] text-sm leading-relaxed max-w-[260px] mb-8">
                Premium streetwear crafted for the bold.
                Write your story through what you wear.
              </p>
              <div className="flex items-center gap-3">
                {socials.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 border border-[#1a1a1a] flex items-center justify-center text-[#A1A1AA] hover:text-white hover:border-[#333] transition-all duration-200"
                    aria-label={social.name}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Shop Column */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80 mb-6">
                Shop
              </h4>
              <ul className="space-y-4">
                {shopLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#A1A1AA] hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* About Column */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80 mb-6">
                About
              </h4>
              <ul className="space-y-4">
                {aboutLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#A1A1AA] hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80 mb-6">
                Support
              </h4>
              <ul className="space-y-4">
                {supportLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#A1A1AA] hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-[#1a1a1a]">
        <div className="section-padding py-6 max-w-7xl mx-auto">
          <p className="text-[11px] text-[#A1A1AA]/60 tracking-wider text-center md:text-left">
            © 2026 Author. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}