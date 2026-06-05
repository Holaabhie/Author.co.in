export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  category: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  rating: number;
  reviewCount: number;
  stock: number;
  badge?: "best-seller" | "new" | "limited" | "sold-out";
  description: string;
  details: string[];
  careInstructions: string[];
  modelInfo?: string;
  fabricDetails?: string;
  deliveryEstimate?: string;
  sizeChart?: { size: string; chest: string; length: string; shoulder: string }[];
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

export const products: Product[] = [
  {
    id: "1",
    name: "AUTHOR ESSENTIAL TEE",
    slug: "author-essential-tee",
    price: 1999,
    category: "t-shirts",
    images: [
      "https://www.fratelliarena.com/cdn/shop/files/FRONTE_4fa0ed50-c32c-463d-8029-fffa239d8161_2048x2048.jpg?v=1776374474",
      "https://www.fratelliarena.com/cdn/shop/files/LATO_2f07ab18-fc8d-4c88-8088-5210a90169ec_2048x2048.jpg?v=1776374474",
      "https://www.fratelliarena.com/cdn/shop/files/FRONTE_c6466a3e-2a2d-43b9-ae80-75ad0da58b2a_2048x2048.jpg?v=1778969628",
      "https://www.fratelliarena.com/cdn/shop/files/ZOOM_e807904f-51b2-4f0b-b6de-4f1025944be1_2048x2048.jpg?v=1778969655"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Black", hex: "#000000" }
    ],
    rating: 4.9,
    reviewCount: 312,
    stock: 25,
    badge: "new",
    description: "The ultimate premium daily essential. Tailored from substantial 280 GSM cotton French terry, featuring a clean drop shoulder profile and no-noise minimal design.",
    details: ["280 GSM Heavyweight Cotton", "Relaxed Fit", "Double Needle Stitched Hem", "Ribbed Collar", "Bio-washed for maximum softness"],
    careInstructions: ["Machine wash cold with like colors", "Tumble dry low", "Warm iron if needed", "Do not bleach"],
    modelInfo: "Model is 6'0\" | Wearing Size L",
    fabricDetails: "280 GSM French Terry | 100% Combed Cotton | Pre-Shrunk | Bio-Washed",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "XS", chest: "36\"", length: "26\"", shoulder: "16.5\"" },
      { size: "S", chest: "38\"", length: "27\"", shoulder: "17\"" },
      { size: "M", chest: "40\"", length: "28\"", shoulder: "17.5\"" },
      { size: "L", chest: "42\"", length: "29\"", shoulder: "18\"" },
      { size: "XL", chest: "44\"", length: "30\"", shoulder: "18.5\"" }
    ]
  },
  {
    id: "2",
    name: "AUTHOR SIGNATURE HOODIE",
    slug: "author-signature-hoodie",
    price: 2999,
    category: "hoodies",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
      "https://images.unsplash.com/photo-1578768079470-f8e01e58e1f4?w=800&q=80"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Grey", hex: "#888888" },
      { name: "Black", hex: "#000000" }
    ],
    rating: 4.8,
    reviewCount: 204,
    stock: 18,
    badge: "best-seller",
    description: "Armor against the ordinary. 400 GSM heavyweight brushed fleece, structured hood, split kangaroo pockets and premium drawstring cords with metal tips.",
    details: ["400 GSM Ultra-heavy Fleece", "Structured Boxy Fit", "Kangaroo Pocket", "Embroidered tonal branding", "Ribbed side panels"],
    careInstructions: ["Machine wash cold inside out", "Hang dry recommended", "Do not iron on embroidery"],
    modelInfo: "Model is 6'0\" | Wearing Size L",
    fabricDetails: "400 GSM Heavyduty Fleece | 80% Organic Cotton, 20% Polyester | Pre-Shrunk | Double-lined Hood",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "XS", chest: "38\"", length: "26.5\"", shoulder: "17.5\"" },
      { size: "S", chest: "40\"", length: "27.5\"", shoulder: "18\"" },
      { size: "M", chest: "42\"", length: "28.5\"", shoulder: "18.5\"" },
      { size: "L", chest: "44\"", length: "29.5\"", shoulder: "19\"" },
      { size: "XL", chest: "46\"", length: "30.5\"", shoulder: "19.5\"" }
    ]
  },
  {
    id: "3",
    name: "LUXURY FRESH WOOL TROUSERS",
    slug: "luxury-fresh-wool-trousers",
    price: 3999,
    category: "joggers",
    images: [
      "https://www.fratelliarena.com/cdn/shop/files/POSATO_f271ecea-165b-44fb-9604-37fb514c8109_2048x2048.jpg?v=1776375390",
      "https://www.fratelliarena.com/cdn/shop/files/FRONTE_43b4adcc-296b-4b12-8ccc-5dc7abca3ffd_2048x2048.jpg?v=1776375393"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Grey", hex: "#888888" },
      { name: "Black", hex: "#000000" }
    ],
    rating: 4.9,
    reviewCount: 94,
    stock: 12,
    badge: "limited",
    description: "Sartorial craftsmanship. Crafted from a refined summer-grade fresh wool blend, these trousers combine structured tailoring drape with modern streetwear fit.",
    details: ["Fresh Wool Tailored Blend", "Straight Leg Crop Fit", "Concealed Waist Closure", "Slant Side Pockets", "Buttoned Welt Back Pockets"],
    careInstructions: ["Dry clean only", "Iron low temperature with pressing cloth"],
    modelInfo: "Model is 6'1\" | Wearing Size M",
    fabricDetails: "Fresh Wool Blend | 60% Merino Wool, 40% Viscose | Anti-wrinkle | Hook & eye closure",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "XS", chest: "28-29\" Waist", length: "30\" Inseam", shoulder: "38\" Outseam" },
      { size: "S", chest: "30-31\" Waist", length: "30\" Inseam", shoulder: "39\" Outseam" },
      { size: "M", chest: "32-33\" Waist", length: "31\" Inseam", shoulder: "40\" Outseam" },
      { size: "L", chest: "34-35\" Waist", length: "31\" Inseam", shoulder: "41\" Outseam" },
      { size: "XL", chest: "36-37\" Waist", length: "32\" Inseam", shoulder: "42\" Outseam" }
    ]
  },
  {
    id: "4",
    name: "CLASSIC OVERSIZED TEE",
    slug: "classic-oversized-tee",
    price: 1499,
    category: "t-shirts",
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Cream", hex: "#F5F0EB" },
      { name: "Black", hex: "#000000" }
    ],
    rating: 4.7,
    reviewCount: 148,
    stock: 30,
    description: "Relaxed look, robust quality. 300 GSM combed cotton French terry structure that keeps its shape. Featuring dropped shoulders and boxy silhouette.",
    details: ["300 GSM Combed Cotton", "Boxy Oversized Fit", "Drop Shoulders", "High Ribbed Neck", "Bio-washed"],
    careInstructions: ["Machine wash cold", "Dry flat", "Do not iron directly on graphics"],
    modelInfo: "Model is 5'11\" | Wearing Size L",
    fabricDetails: "300 GSM Heavyweight Cotton | 100% French Terry Cotton | Bio-washed | Drop shoulder fit",
    deliveryEstimate: "Mumbai: 2-4 Days | India: 4-7 Days",
    sizeChart: [
      { size: "XS", chest: "38\"", length: "27\"", shoulder: "17.5\"" },
      { size: "S", chest: "40\"", length: "28\"", shoulder: "18\"" },
      { size: "M", chest: "42\"", length: "29\"", shoulder: "18.5\"" },
      { size: "L", chest: "44\"", length: "30\"", shoulder: "19\"" },
      { size: "XL", chest: "46\"", length: "31\"", shoulder: "19.5\"" }
    ]
  }
];

export const collections: Collection[] = [
  {
    id: "1",
    name: "NEW ARRIVALS",
    slug: "new-arrivals",
    description: "Explore the latest essentials",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80"
  },
  {
    id: "2",
    name: "ESSENTIALS",
    slug: "essentials",
    description: "Everyday luxury pieces",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80"
  }
];

export const categories: Category[] = [
  {
    id: "1",
    name: "T-Shirts",
    slug: "t-shirts",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    productCount: 2
  },
  {
    id: "2",
    name: "Tops",
    slug: "hoodies",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
    productCount: 1
  },
  {
    id: "3",
    name: "Trousers",
    slug: "joggers",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80",
    productCount: 1
  }
];
