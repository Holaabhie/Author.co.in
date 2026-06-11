'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import './author-loader.css';

/**
 * AuthorPageLoader
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-viewport brand loading overlay that:
 *  • Appears immediately on page load (zero-flash via CSS visibility trick)
 *  • Plays the SVG ellipse stroke-draw + text reveal sequence
 *  • Auto-dismisses after 2.5s with a smooth opacity fade-out
 *  • Does NOT re-run on client-side navigation (only true page loads / refresh)
 *  • Skips entirely on auth pages (/login, /register) — they already own the full viewport
 */

const SKIP_PATHS = ['/login', '/register', '/reset-password', '/update-password'];

export default function AuthorPageLoader() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Skip on auth pages
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) {
      const el = overlayRef.current;
      if (el) {
        el.style.display = 'none';
      }
      return;
    }

    const el = overlayRef.current;
    if (!el) return;

    // Show overlay
    el.style.display = 'flex';
    el.style.opacity = '1';
    el.style.visibility = 'visible';

    // Dismiss after 2.5 s
    const dismissTimer = setTimeout(() => {
      el.style.transition = 'opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.55s';
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
    }, 2500);

    return () => clearTimeout(dismissTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // deliberately only on mount

  return (
    <>
      <div id="author-loader" ref={overlayRef} role="status" aria-label="Loading Author Co">

        {/* ── SVG Logo — 200px wide ──────────────────────────────────── */}
        <svg
          width="200"
          height="120"
          viewBox="0 0 200 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* 1 ── Ellipse outline — stroke draw animation */}
          <ellipse
            cx="100"
            cy="60"
            rx="94"
            ry="54"
            stroke="#F5F0E8"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
            className="al-ellipse"
          />

          {/* ── Logo Text Group ────────────────────────────────────────── */}
          <g className="al-logo-text">
            {/* 2 ── "Author" — italic serif, slightly smaller & bolder */}
            <text
              x="100"
              y="66"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="Georgia, 'Playfair Display', serif"
              fontSize="32"
              fontStyle="italic"
              fontWeight="bold"
              fill="#F5F0E8"
            >
              Author
            </text>

            {/* 3 ── "Co" — Barlow Condensed, bolder, tighter spacing */}
            <text
              x="146"
              y="82"
              textAnchor="start"
              dominantBaseline="middle"
              fontFamily="var(--font-barlow-condensed), 'Barlow Condensed', sans-serif"
              fontSize="13"
              fontWeight="bold"
              letterSpacing="3"
              fill="#B8A07A"
            >
              Co
            </text>
          </g>
        </svg>

      </div>
    </>
  );
}
