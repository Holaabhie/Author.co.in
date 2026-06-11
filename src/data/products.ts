// Product data — AUTHOR Brand
// Architecture: static TypeScript array, sourced from src/data/products.ts
// Launch products: Author Essential Tee, Author Sweatpants, Author Signature Top
// Archived products: isActive = false (preserved for historical data, not shown in store)

export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  slug: string;
  price: number;
  salePrice?: number;
  category: string;
  images: string[];
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
// LAUNCH PRODUCTS (isActive: true)
// ============================================================

export const products: Product[] = [
  // ── LAUNCH PRODUCT 1: T-SHIRT ────────────────────────────
  {
    id: "1",
    name: "Author Essential Tee",
    subtitle: "270 GSM Looper Lycra",
    slug: "author-essential-tee",
    price: 949,
    category: "t-shirts",
    images: [
      "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto/products/tshirt_black_front",
      "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto/products/tshirt_black_back",
      "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto/products/tshirt_white_front",
      "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto/products/tshirt_white_back",
    ],
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Black", hex: "#0A0A0A" },
      { name: "White", hex: "#FFFFFF" },
    ],
    rating: 4.9,
    reviewCount: 312,
    stock: 25,
    badge: "new",
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

  // ── LAUNCH PRODUCT 2: SWEATPANTS ─────────────────────────
  {
    id: "2",
    name: "Author Essential Sweatpants",
    subtitle: "320 GSM Premium Fleece",
    slug: "author-essential-sweatpants",
    price: 2299,
    category: "sweatpants",
    images: [
      "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto/products/sweatpants_black_front",
      "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto/products/sweatpants_black_back",
      "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto/products/sweatpants_white_front",
      "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto/products/sweatpants_white_back",
    ],
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Black", hex: "#0A0A0A" },
      { name: "White", hex: "#FFFFFF" },
    ],
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

  // ── LAUNCH PRODUCT 3: TOP ─────────────────────────────────
  {
    id: "3",
    name: "Author Essential Top",
    subtitle: "320 GSM 1x1 Cotton Lycra",
    slug: "author-essential-top",
    price: 1199,
    category: "tops",
    images: [
      "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto/products/top_black_front",
      "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto/products/top_black_back",
      "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto/products/top_white_front",
      "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto/products/top_white_back",
    ],
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Black", hex: "#0A0A0A" },
      { name: "White", hex: "#FFFFFF" },
    ],
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
    id: "arch-4",
    name: "AUTHOR SIGNATURE HOODIE",
    subtitle: "400 GSM Heavyweight Fleece",
    slug: "author-signature-hoodie",
    price: 2999,
    category: "hoodies",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
      "https://images.unsplash.com/photo-1578768079470-f8e01e58e1f4?w=800&q=80",
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
    modelInfo: "Model is 6'0\" | Wearing Size L",
    fabricDetails: "400 GSM Heavyduty Fleece | 80% Organic Cotton, 20% Polyester | Pre-Shrunk | Double-lined Hood",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "XS", chest: "38\"", length: "26.5\"", shoulder: "17.5\"" },
      { size: "S", chest: "40\"", length: "27.5\"", shoulder: "18\"" },
      { size: "M", chest: "42\"", length: "28.5\"", shoulder: "18.5\"" },
      { size: "L", chest: "44\"", length: "29.5\"", shoulder: "19\"" },
      { size: "XL", chest: "46\"", length: "30.5\"", shoulder: "19.5\"" },
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
      "https://www.fratelliarena.com/cdn/shop/files/POSATO_f271ecea-165b-44fb-9604-37fb514c8109_2048x2048.jpg?v=1776375390",
      "https://www.fratelliarena.com/cdn/shop/files/FRONTE_43b4adcc-296b-4b12-8ccc-5dc7abca3ffd_2048x2048.jpg?v=1776375393",
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
      "Sartorial craftsmanship. Crafted from a refined summer-grade fresh wool blend, these trousers combine structured tailoring drape with modern streetwear fit.",
    details: [
      "Fresh Wool Tailored Blend",
      "Straight Leg Crop Fit",
      "Concealed Waist Closure",
      "Slant Side Pockets",
      "Buttoned Welt Back Pockets",
    ],
    careInstructions: ["Dry clean only", "Iron low temperature with pressing cloth"],
    modelInfo: "Model is 6'1\" | Wearing Size M",
    fabricDetails: "Fresh Wool Blend | 60% Merino Wool, 40% Viscose | Anti-wrinkle | Hook & eye closure",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "XS", chest: "28-29\" Waist", length: "30\" Inseam", shoulder: "38\" Outseam" },
      { size: "S", chest: "30-31\" Waist", length: "30\" Inseam", shoulder: "39\" Outseam" },
      { size: "M", chest: "32-33\" Waist", length: "31\" Inseam", shoulder: "40\" Outseam" },
      { size: "L", chest: "34-35\" Waist", length: "31\" Inseam", shoulder: "41\" Outseam" },
      { size: "XL", chest: "36-37\" Waist", length: "32\" Inseam", shoulder: "42\" Outseam" },
    ],
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
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
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
      "Relaxed look, robust quality. 300 GSM combed cotton French terry structure that keeps its shape. Featuring dropped shoulders and boxy silhouette.",
    details: [
      "300 GSM Combed Cotton",
      "Boxy Oversized Fit",
      "Drop Shoulders",
      "High Ribbed Neck",
      "Bio-washed",
    ],
    careInstructions: [
      "Machine wash cold",
      "Dry flat",
      "Do not iron directly on graphics",
    ],
    modelInfo: "Model is 5'11\" | Wearing Size L",
    fabricDetails: "300 GSM Heavyweight Cotton | 100% French Terry Cotton | Bio-washed | Drop shoulder fit",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "XS", chest: "38\"", length: "27\"", shoulder: "17.5\"" },
      { size: "S", chest: "40\"", length: "28\"", shoulder: "18\"" },
      { size: "M", chest: "42\"", length: "29\"", shoulder: "18.5\"" },
      { size: "L", chest: "44\"", length: "30\"", shoulder: "19\"" },
      { size: "XL", chest: "46\"", length: "31\"", shoulder: "19.5\"" },
    ],
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
      "https://www.fratelliarena.com/cdn/shop/files/POSATO_f271ecea-165b-44fb-9604-37fb514c8109_2048x2048.jpg?v=1776375390",
      "https://www.fratelliarena.com/cdn/shop/files/FRONTE_43b4adcc-296b-4b12-8ccc-5dc7abca3ffd_2048x2048.jpg?v=1776375393",
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
      "Built for the pavement. Structured cuts, heavy street weight, and nothing extra. Engineered for an immaculate tailored drape with a relaxed modern street silhouette.",
    details: [
      "Premium heavy cotton-poly blend",
      "Relaxed tailored fit",
      "Hidden drawcords at waistband",
      "Slanted trouser side pockets",
      "Reinforced triple needle stitching",
    ],
    careInstructions: [
      "Machine wash cold inside out",
      "Hang dry recommended",
      "Warm iron if needed",
    ],
    modelInfo: "Model is 6'1\" | Wearing Size M",
    fabricDetails: "70% Cotton, 30% Polyester | Heavyweight Streetwear Blend | Pre-Shrunk",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "XS", chest: "28-29\" Waist", length: "30\" Inseam", shoulder: "38\" Outseam" },
      { size: "S", chest: "30-31\" Waist", length: "30\" Inseam", shoulder: "39\" Outseam" },
      { size: "M", chest: "32-33\" Waist", length: "31\" Inseam", shoulder: "40\" Outseam" },
      { size: "L", chest: "34-35\" Waist", length: "31\" Inseam", shoulder: "41\" Outseam" },
      { size: "XL", chest: "36-37\" Waist", length: "32\" Inseam", shoulder: "42\" Outseam" },
    ],
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
    image: "https://www.fratelliarena.com/cdn/shop/files/FRONTE_4fa0ed50-c32c-463d-8029-fffa239d8161_2048x2048.jpg?v=1776374474",
    productCount: 1,
  },
  {
    id: "2",
    name: "Sweatpants",
    slug: "sweatpants",
    image: "https://www.fratelliarena.com/cdn/shop/files/POSATO_f271ecea-165b-44fb-9604-37fb514c8109_2048x2048.jpg?v=1776375390",
    productCount: 1,
  },
  {
    id: "3",
    name: "Tops",
    slug: "tops",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
    productCount: 1,
  },
];
