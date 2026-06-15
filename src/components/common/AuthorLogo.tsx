'use client';

import Image from "next/image";
import Link from "next/link";

interface AuthorLogoProps {
  variant?: "light" | "dark";
  className?: string;
}

// Cloudinary public ID: ChatGPT_Image_Jun_12_2026_01_32_37_PM_j3i63o
// Uses Cloudinary's e_background_removal to strip the black background server-side,
// producing a true transparent PNG. Then:
//   variant="light" (dark header)  → white oval logo visible on dark bg
//   variant="dark"  (white header) → CSS filter: invert(1) turns white→black

const CLOUD_NAME = "dpxirx0mn";
const PUBLIC_ID = "ChatGPT_Image_Jun_12_2026_01_32_37_PM_j3i63o";

// Cloudinary URL with background removal + format as PNG to keep transparency
const LOGO_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/e_background_removal,f_png,q_auto/${PUBLIC_ID}`;

export default function AuthorLogo({
  variant = "dark",
  className = "",
}: AuthorLogoProps) {
  return (
    <Link href="/" aria-label="Author Co Home" className={`inline-flex items-center ${className}`}>
      <Image
        src={LOGO_URL}
        alt="Author Co"
        width={80}
        height={44}
        priority
        style={{
          display: "block",
          background: "transparent",
          border: "none",
          outline: "none",
          boxShadow: "none",
          // Invert white logo to black when on a white/light header
          filter: variant === "dark" ? "invert(1)" : "none",
        }}
      />
    </Link>
  );
}
