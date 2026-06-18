// Product data — AUTHOR Brand
// Architecture: static TypeScript array, sourced from src/data/products.ts
// Launch products: separated into Black and White variants per category
// Archived products: isActive = false (preserved for historical data, not shown in store)

export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  slug: string;
  price: number;
  salePrice?: number;
  category: string;
  images: { url: string; color: string }[];
  // Sizing: current launch = S/M/L; architecture supports XS/S/M/L/XL/XXL for future
  sizes: string[];
  colors: { name: string; hex: string }[];
  rating: number;
  reviewCount: number;
  stock: number;
  badge?: "best-seller" | "new" | "limited" | "sold-out";
  description: string;
  // Extended product details
  fabric?: string;
  gsm?: string;
  fit?: string;
  neck?: string;
  sleeve?: string;
  features?: string[];
  details: string[];
  careInstructions: string[];
  modelInfo?: string;
  fabricDetails?: string;
  deliveryEstimate?: string;
  sizeChart?: { size: string; chest: string; length: string; shoulder: string }[];
  // Archive flag — set to false to hide from store while preserving data
  isActive: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

// ============================================================
// Cloudinary base URL helper
// ============================================================
const CLD = "https://res.cloudinary.com/dpxirx0mn/image/upload/w_1400,c_scale,q_auto:best,f_auto";

// ============================================================
// LAUNCH PRODUCTS (isActive: true)
// Each color variant is a separate product card
// ============================================================

export const products: Product[] = [
  // ── T-SHIRTS ─────────────────────────────────────────────────

  // 1. Black T-Shirt
  {
    id: "1",
    name: "AUTHOR Black T-Shirt",
    subtitle: "270 GSM Looper Lycra",
    slug: "black-tshirt",
    price: 949,
    category: "tshirts",
    // Image order: front image first (was swapped from back-first)
    images: [
      { url: `${CLD}/tshirt_2nd_ldhr3h`, color: "Black" },
      { url: `${CLD}/black_t_shirt_1st_aradpv`, color: "Black" },
      { url: `${CLD}/DSCF5641.JPG_rz60rf`, color: "Black" },
      { url: `${CLD}/DSCF5604.JPG_jwlpqv`, color: "Black" },
    ],
    sizes: ["S", "M", "L"],
    colors: [{ name: "Black", hex: "#0A0A0A" }],
    rating: 4.9,
    reviewCount: 312,
    stock: 25,
    // badge removed — was "new", removed per user request to clean T-shirt cards
    badge: undefined,
    description:
      "Premium Looper Lycra T-shirt designed for ultimate comfort and a sleek fit. Wrinkle resistant and shape retaining.",
    fabric: "Looper Lycra",
    gsm: "270 GSM",
    fit: "Relax Fit",
    neck: "Round Neck",
    sleeve: "Half Sleeve",
    details: [
      "270 GSM Looper Lycra",
      "Relax Fit",
      "Round Neck",
      "Half Sleeve",
      "Wrinkle Resistant",
      "Shape Retaining",
    ],
    careInstructions: [
      "Machine Wash Cold",
      "Do Not Bleach",
      "Line Dry In Shade",
      "Low Heat Iron",
      "Do Not Iron On Embroidery",
      "Do Not Dry Clean",
    ],
    modelInfo: "Model is 6'0\" | Wearing Size M",
    fabricDetails: "270 GSM Looper Lycra | Relax Fit | Round Neck | Half Sleeve",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "S", chest: "38\"", length: "27\"", shoulder: "17\"" },
      { size: "M", chest: "40\"", length: "28\"", shoulder: "17.5\"" },
      { size: "L", chest: "42\"", length: "29\"", shoulder: "18\"" },
    ],
    isActive: true,
  },

  // 2. White T-Shirt
  {
    id: "1b",
    name: "AUTHOR White T-Shirt",
    subtitle: "270 GSM Looper Lycra",
    slug: "white-tshirt",
    price: 949,
    category: "tshirts",
    // Image order: front image first (was swapped from back-first)
    images: [
      { url: `${CLD}/white_t_shirt_2nd_siebfk`, color: "White" },
      { url: `${CLD}/white_tshirt_1_st_bbzsdu`, color: "White" },
      { url: `${CLD}/5e863912-1833-49b5-9c8e-b80f52e2f1bc_1_kwwi1v`, color: "White" },
      { url: `${CLD}/IMG_7677.JPG_rrtgih`, color: "White" },
    ],
    sizes: ["S", "M", "L"],
    colors: [{ name: "White", hex: "#FFFFFF" }],
    rating: 4.9,
    reviewCount: 278,
    stock: 22,
    // badge removed — was "new", removed per user request to clean T-shirt cards
    badge: undefined,
    description:
      "Premium Looper Lycra T-shirt designed for ultimate comfort and a sleek fit. Wrinkle resistant and shape retaining.",
    fabric: "Looper Lycra",
    gsm: "270 GSM",
    fit: "Relax Fit",
    neck: "Round Neck",
    sleeve: "Half Sleeve",
    details: [
      "270 GSM Looper Lycra",
      "Relax Fit",
      "Round Neck",
      "Half Sleeve",
      "Wrinkle Resistant",
      "Shape Retaining",
    ],
    careInstructions: [
      "Machine Wash Cold",
      "Do Not Bleach",
      "Line Dry In Shade",
      "Low Heat Iron",
      "Do Not Iron On Embroidery",
      "Do Not Dry Clean",
    ],
    modelInfo: "Model is 6'0\" | Wearing Size M",
    fabricDetails: "270 GSM Looper Lycra | Relax Fit | Round Neck | Half Sleeve",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "S", chest: "38\"", length: "27\"", shoulder: "17\"" },
      { size: "M", chest: "40\"", length: "28\"", shoulder: "17.5\"" },
      { size: "L", chest: "42\"", length: "29\"", shoulder: "18\"" },
    ],
    isActive: true,
  },

  // ── SWEATPANTS ───────────────────────────────────────────────

  // 3. Black Sweatpants
  {
    id: "2",
    name: "AUTHOR Black Sweatpants",
    subtitle: "320 GSM Premium Fleece",
    slug: "black-sweatpants",
    price: 1399,
    category: "sweatpants",
    // Image order: front image first (was swapped from back-first)
    images: [
      { url: `${CLD}/sweat_black_2nd_zxtogc`, color: "Black" },
      { url: `${CLD}/black_1st_tvrnqs`, color: "Black" },
      { url: `${CLD}/author-black-sweatpants-back%201s`, color: "Black" },
      { url: `${CLD}/author-black-sweatpants-back%202nd`, color: "Black" },
      { url: `${CLD}/author-black-sweatpants-back%203rd`, color: "Black" },
    ],
    sizes: ["S", "M", "L"],
    colors: [{ name: "Black", hex: "#0A0A0A" }],
    rating: 4.8,
    reviewCount: 204,
    stock: 18,
    badge: undefined,
    description:
      "Premium AUTHOR sweatpants with relaxed streetwear comfort.",
    fabric: "Fleece",
    gsm: "320 GSM",
    features: [
      "Unfinished Hem",
      "Unfinished Waistband",
      "Two Back Pockets",
      "Logo On Right Pocket",
    ],
    details: [
      "320 GSM Premium Fleece",
      "Unfinished Hem",
      "Unfinished Waistband",
      "Two Back Pockets",
      "Logo On Right Pocket",
    ],
    careInstructions: [
      "Machine Wash Cold",
      "Wash Inside Out",
      "Wash With Similar Colors",
      "Use Mild Detergent",
      "Do Not Bleach",
      "Do Not Wring",
      "Tumble Dry Low Or Line Dry",
      "Cool Iron If Required",
      "Do Not Iron On Embroidery",
      "Do Not Dry Clean",
    ],
    modelInfo: "Model is 6'0\" | Wearing Size M",
    fabricDetails: "320 GSM Premium Fleece | Structured Silhouette",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "S", chest: "30-31\" Waist", length: "30\" Inseam", shoulder: "39\" Outseam" },
      { size: "M", chest: "32-33\" Waist", length: "31\" Inseam", shoulder: "40\" Outseam" },
      { size: "L", chest: "34-35\" Waist", length: "31\" Inseam", shoulder: "41\" Outseam" },
    ],
    isActive: true,
  },

  // 4. White Sweatpants
  {
    id: "2b",
    name: "AUTHOR White Sweatpants",
    subtitle: "320 GSM Premium Fleece",
    slug: "white-sweatpants",
    price: 1399,
    category: "sweatpants",
    // Image order: front image first (was swapped from back-first)
    images: [
      { url: `${CLD}/gray_sweat_2nd_a1mdog`, color: "White" },
      { url: `${CLD}/gray_sweat_1st_cgspx0`, color: "White" },
      { url: `${CLD}/DSCF5541_plog3s`, color: "White" },
      { url: `${CLD}/DSCF5529_etgtdf`, color: "White" },
      { url: `${CLD}/DSCF5515_ocdsro`, color: "White" },
    ],
    sizes: ["S", "M", "L"],
    colors: [{ name: "White", hex: "#FFFFFF" }],
    rating: 4.8,
    reviewCount: 186,
    stock: 16,
    badge: undefined,
    description:
      "Premium AUTHOR sweatpants with relaxed streetwear comfort.",
    fabric: "Fleece",
    gsm: "320 GSM",
    features: [
      "Unfinished Hem",
      "Unfinished Waistband",
      "Two Back Pockets",
      "Logo On Right Pocket",
    ],
    details: [
      "320 GSM Premium Fleece",
      "Unfinished Hem",
      "Unfinished Waistband",
      "Two Back Pockets",
      "Logo On Right Pocket",
    ],
    careInstructions: [
      "Machine Wash Cold",
      "Wash Inside Out",
      "Wash With Similar Colors",
      "Use Mild Detergent",
      "Do Not Bleach",
      "Do Not Wring",
      "Tumble Dry Low Or Line Dry",
      "Cool Iron If Required",
      "Do Not Iron On Embroidery",
      "Do Not Dry Clean",
    ],
    modelInfo: "Model is 6'0\" | Wearing Size M",
    fabricDetails: "320 GSM Premium Fleece | Structured Silhouette",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "S", chest: "30-31\" Waist", length: "30\" Inseam", shoulder: "39\" Outseam" },
      { size: "M", chest: "32-33\" Waist", length: "31\" Inseam", shoulder: "40\" Outseam" },
      { size: "L", chest: "34-35\" Waist", length: "31\" Inseam", shoulder: "41\" Outseam" },
    ],
    isActive: true,
  },

  // ── TOPS ─────────────────────────────────────────────────────

  // 5. Black Top
  {
    id: "3",
    name: "AUTHOR Black Top",
    subtitle: "320 GSM 1x1 Cotton Lycra",
    slug: "black-top",
    price: 849,
    category: "tops",
    // Image order: front image first (was swapped from back-first)
    images: [
      { url: `${CLD}/top_black_2nd_gegyy3`, color: "Black" },
      { url: `${CLD}/top_black_1st_wgsy3e`, color: "Black" },
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Black", hex: "#0A0A0A" }],
    rating: 4.9,
    reviewCount: 124,
    stock: 22,
    badge: undefined,
    description:
      "Minimal AUTHOR top designed for a premium clean silhouette.",
    fabric: "1x1 Cotton Lycra",
    gsm: "320 GSM",
    details: [
      "320 GSM 1x1 Cotton Lycra",
      "Skin Tight Fit",
      "Square Neck",
      "Premium Stretch",
      "Sculpted Silhouette",
    ],
    careInstructions: [
      "Machine Wash Cold",
      "Do Not Bleach",
      "Low Heat Iron",
      "Do Not Dry Clean",
    ],
    modelInfo: "Model is 5'9\" | Wearing Size S",
    fabricDetails: "320 GSM 1x1 Cotton Lycra | Skin Tight Stretchable",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "XS", chest: "30\"", length: "17\"", shoulder: "14\"" },
      { size: "S", chest: "32\"", length: "17.5\"", shoulder: "14.5\"" },
      { size: "M", chest: "34\"", length: "18\"", shoulder: "15\"" },
      { size: "L", chest: "36\"", length: "18.5\"", shoulder: "15.5\"" },
    ],
    isActive: true,
  },

  // 6. White Top
  {
    id: "3b",
    name: "AUTHOR White Top",
    subtitle: "320 GSM 1x1 Cotton Lycra",
    slug: "white-top",
    price: 849,
    category: "tops",
    images: [
      { url: `${CLD}/top_1st_l0udlk`, color: "White" },
      { url: `${CLD}/top_2nd_kxfr24`, color: "White" },
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "White", hex: "#FFFFFF" }],
    rating: 4.9,
    reviewCount: 98,
    stock: 20,
    badge: undefined,
    description:
      "Minimal AUTHOR top designed for a premium clean silhouette.",
    fabric: "1x1 Cotton Lycra",
    gsm: "320 GSM",
    details: [
      "320 GSM 1x1 Cotton Lycra",
      "Skin Tight Fit",
      "Square Neck",
      "Premium Stretch",
      "Sculpted Silhouette",
    ],
    careInstructions: [
      "Machine Wash Cold",
      "Do Not Bleach",
      "Low Heat Iron",
      "Do Not Dry Clean",
    ],
    modelInfo: "Model is 5'9\" | Wearing Size S",
    fabricDetails: "320 GSM 1x1 Cotton Lycra | Skin Tight Stretchable",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "XS", chest: "30\"", length: "17\"", shoulder: "14\"" },
      { size: "S", chest: "32\"", length: "17.5\"", shoulder: "14.5\"" },
      { size: "M", chest: "34\"", length: "18\"", shoulder: "15\"" },
      { size: "L", chest: "36\"", length: "18.5\"", shoulder: "15.5\"" },
    ],
    isActive: true,
  },

  // ============================================================
  // ARCHIVED PRODUCTS (isActive: false — preserved, not displayed)
  // ============================================================

  {
    id: "arch-1-old",
    name: "Author Essential Tee",
    subtitle: "270 GSM Looper Lycra",
    slug: "author-essential-tee",
    price: 949,
    category: "t-shirts",
    images: [
      { url: `${CLD}/tshirt_2nd_ldhr3h`, color: "Black" },
      { url: `${CLD}/black_t_shirt_1st_aradpv`, color: "Black" },
    ],
    sizes: ["S", "M", "L"],
    colors: [{ name: "Black", hex: "#0A0A0A" }],
    rating: 4.9,
    reviewCount: 312,
    stock: 25,
    badge: "new",
    description: "Premium Looper Lycra T-shirt designed for ultimate comfort and a sleek fit.",
    details: ["270 GSM Looper Lycra", "Relax Fit", "Round Neck", "Half Sleeve"],
    careInstructions: ["Machine Wash Cold", "Do Not Bleach"],
    isActive: false,
  },

  {
    id: "arch-2-old",
    name: "Author Essential Sweatpants",
    subtitle: "320 GSM Premium Fleece",
    slug: "author-essential-sweatpants",
    price: 1399,
    category: "sweatpants",
    images: [
      { url: `${CLD}/sweat_black_2nd_zxtogc`, color: "Black" },
      { url: `${CLD}/black_1st_tvrnqs`, color: "Black" },
    ],
    sizes: ["S", "M", "L"],
    colors: [{ name: "Black", hex: "#0A0A0A" }],
    rating: 4.8,
    reviewCount: 204,
    stock: 18,
    description: "Premium AUTHOR sweatpants with relaxed streetwear comfort.",
    details: ["320 GSM Premium Fleece"],
    careInstructions: ["Machine Wash Cold"],
    isActive: false,
  },

  {
    id: "arch-3-old",
    name: "Author Essential Top",
    subtitle: "320 GSM 1x1 Cotton Lycra",
    slug: "author-essential-top",
    price: 849,
    category: "tops",
    images: [
      { url: `${CLD}/top_black_2nd_gegyy3`, color: "Black" },
      { url: `${CLD}/top_black_1st_wgsy3e`, color: "Black" },
    ],
    sizes: ["S", "M", "L"],
    colors: [{ name: "Black", hex: "#0A0A0A" }],
    rating: 4.9,
    reviewCount: 124,
    stock: 22,
    description: "Minimal AUTHOR top designed for a premium clean silhouette.",
    details: ["320 GSM 1x1 Cotton Lycra"],
    careInstructions: ["Machine Wash Cold"],
    isActive: false,
  },

  {
    id: "arch-4",
    name: "AUTHOR SIGNATURE HOODIE",
    subtitle: "400 GSM Heavyweight Fleece",
    slug: "author-signature-hoodie",
    price: 2999,
    category: "hoodies",
    images: [
      { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80", color: "Grey" },
      { url: "https://images.unsplash.com/photo-1578768079470-f8e01e58e1f4?w=800&q=80", color: "Black" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Grey", hex: "#888888" },
      { name: "Black", hex: "#000000" },
    ],
    rating: 4.8,
    reviewCount: 204,
    stock: 18,
    badge: "best-seller",
    description:
      "Armor against the ordinary. 400 GSM heavyweight brushed fleece, structured hood, split kangaroo pockets and premium drawstring cords with metal tips.",
    details: [
      "400 GSM Ultra-heavy Fleece",
      "Structured Boxy Fit",
      "Kangaroo Pocket",
      "Embroidered tonal branding",
      "Ribbed side panels",
    ],
    careInstructions: [
      "Machine wash cold inside out",
      "Hang dry recommended",
      "Do not iron on embroidery",
    ],
    isActive: false,
  },

  {
    id: "arch-5",
    name: "LUXURY FRESH WOOL TROUSERS",
    subtitle: "Fresh Wool Tailored Blend",
    slug: "luxury-fresh-wool-trousers",
    price: 3999,
    category: "trousers",
    images: [
      { url: "https://www.fratelliarena.com/cdn/shop/files/POSATO_f271ecea-165b-44fb-9604-37fb514c8109_2048x2048.jpg?v=1776375390", color: "Grey" },
      { url: "https://www.fratelliarena.com/cdn/shop/files/FRONTE_43b4adcc-296b-4b12-8ccc-5dc7abca3ffd_2048x2048.jpg?v=1776375393", color: "Grey" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Grey", hex: "#888888" },
      { name: "Black", hex: "#000000" },
    ],
    rating: 4.9,
    reviewCount: 94,
    stock: 12,
    badge: "limited",
    description:
      "Sartorial craftsmanship. Crafted from a refined summer-grade fresh wool blend.",
    details: [
      "Fresh Wool Tailored Blend",
      "Straight Leg Crop Fit",
    ],
    careInstructions: ["Dry clean only"],
    isActive: false,
  },

  {
    id: "arch-6",
    name: "CLASSIC OVERSIZED TEE",
    subtitle: "300 GSM Combed Cotton",
    slug: "classic-oversized-tee",
    price: 1499,
    category: "t-shirts",
    images: [
      { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80", color: "Cream" },
      { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80", color: "Black" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Cream", hex: "#F5F0EB" },
      { name: "Black", hex: "#000000" },
    ],
    rating: 4.7,
    reviewCount: 148,
    stock: 30,
    description:
      "Relaxed look, robust quality. 300 GSM combed cotton French terry structure.",
    details: [
      "300 GSM Combed Cotton",
      "Boxy Oversized Fit",
    ],
    careInstructions: ["Machine wash cold", "Dry flat"],
    isActive: false,
  },

  {
    id: "arch-7",
    name: "AUTHOR STREET TROUSER",
    subtitle: "Heavy Cotton-Poly Blend",
    slug: "author-street-trouser",
    price: 3999,
    category: "trousers",
    images: [
      { url: "https://www.fratelliarena.com/cdn/shop/files/POSATO_f271ecea-165b-44fb-9604-37fb514c8109_2048x2048.jpg?v=1776375390", color: "Black" },
      { url: "https://www.fratelliarena.com/cdn/shop/files/FRONTE_43b4adcc-296b-4b12-8ccc-5dc7abca3ffd_2048x2048.jpg?v=1776375393", color: "Grey" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Black", hex: "#0A0A0A" },
      { name: "Grey", hex: "#C8C4BE" },
    ],
    rating: 4.8,
    reviewCount: 96,
    stock: 15,
    description:
      "Built for the pavement. Structured cuts, heavy street weight, and nothing extra.",
    details: [
      "Premium heavy cotton-poly blend",
      "Relaxed tailored fit",
    ],
    careInstructions: ["Machine wash cold inside out", "Hang dry recommended"],
    isActive: false,
  },
];

// Helper: get only active (visible in store) products
export const activeProducts = products.filter((p) => p.isActive);

export const collections: Collection[] = [
  {
    id: "1",
    name: "NEW ARRIVALS",
    slug: "new-arrivals",
    description: "Explore the latest essentials",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80",
  },
  {
    id: "2",
    name: "ESSENTIALS",
    slug: "essentials",
    description: "Everyday luxury pieces",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
  },
];

// Updated categories: T-Shirts, Sweatpants, Tops
export const categories: Category[] = [
  {
    id: "1",
    name: "T-Shirts",
    slug: "t-shirts",
    image: `${CLD}/tshirt_2nd_ldhr3h`,
    productCount: 2,
  },
  {
    id: "2",
    name: "Sweatpants",
    slug: "sweatpants",
    image: `${CLD}/sweat_black_2nd_zxtogc`,
    productCount: 2,
  },
  {
    id: "3",
    name: "Tops",
    slug: "tops",
    image: `${CLD}/top_black_2nd_gegyy3`,
    productCount: 2,
  },
];
