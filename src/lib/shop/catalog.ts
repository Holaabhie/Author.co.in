export type ShopCategorySlug = "tshirts" | "tops" | "sweatpants";
export type ShopColorSlug = "black" | "white";
export type ProductImageRole = "front" | "back" | "detail";

export type ShopImage = {
  publicId: string;
  role: ProductImageRole;
  alt: string;
};

export type ShopColor = {
  slug: ShopColorSlug;
  label: string;
  hex: string;
  variantColor?: string;
  images: ShopImage[];
};

export type ShopProduct = {
  slug: string;
  name: string;
  price: number;
  badge: "new" | "best-seller" | "limited" | null;
  description: string;
  sizes: string[];
  category: ShopCategorySlug;
  colors: Record<ShopColorSlug, ShopColor>;
};

export function isShopCategorySlug(value: string): value is ShopCategorySlug {
  return ["tshirts", "tops", "sweatpants"].includes(value);
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpxirx0mn";

export function cloudinaryImageUrl(publicId: string) {
  if (!CLOUD_NAME || !publicId) return "";
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/${publicId}`;
}

// ─── PRODUCT DATA ────────────────────────────────────────────────
export const PRODUCTS: ShopProduct[] = [
  // ── T-SHIRTS ──
  {
    slug: "author-essential-tee",
    name: "Author Essential Tee",
    price: 949,
    badge: "new",
    description: "Premium Looper Lycra T-shirt designed for ultimate comfort and a sleek fit. Wrinkle resistant and shape retaining.",
    sizes: ["S", "M", "L"],
    category: "tshirts",
    colors: {
      black: {
        slug: "black",
        label: "Black",
        hex: "#0A0A0A",
        images: [
          { publicId: "products/tshirt_black_front", alt: "Author Essential Tee Black Front", role: "front" },
          { publicId: "products/tshirt_black_back",  alt: "Author Essential Tee Black Back",  role: "back"  },
        ],
      },
      white: {
        slug: "white",
        label: "White",
        hex: "#FFFFFF",
        images: [
          { publicId: "products/tshirt_white_front", alt: "Author Essential Tee White Front", role: "front" },
          { publicId: "products/tshirt_white_back",  alt: "Author Essential Tee White Back",  role: "back"  },
        ],
      },
    },
  },

  // ── TOPS ──
  {
    slug: "author-essential-top",
    name: "Author Essential Top",
    price: 1199,
    badge: null,
    description: "Minimal AUTHOR top designed for a premium clean silhouette.",
    sizes: ["S", "M", "L"],
    category: "tops",
    colors: {
      black: {
        slug: "black",
        label: "Black",
        hex: "#0A0A0A",
        images: [
          { publicId: "products/top_black_front", alt: "Author Essential Top Black Front", role: "front" },
          { publicId: "products/top_black_back",  alt: "Author Essential Top Black Back",  role: "back"  },
        ],
      },
      white: {
        slug: "white",
        label: "White",
        hex: "#FFFFFF",
        images: [
          { publicId: "products/top_white_front", alt: "Author Essential Top White Front", role: "front" },
          { publicId: "products/top_white_back",  alt: "Author Essential Top White Back",  role: "back"  },
        ],
      },
    },
  },

  // ── SWEATPANTS ──
  {
    slug: "author-essential-sweatpants",
    name: "Author Essential Sweatpants",
    price: 2299,
    badge: null,
    description: "Premium AUTHOR sweatpants with relaxed streetwear comfort.",
    sizes: ["S", "M", "L"],
    category: "sweatpants",
    colors: {
      black: {
        slug: "black",
        label: "Black",
        hex: "#0A0A0A",
        images: [
          { publicId: "products/sweatpants_black_front", alt: "Author Sweatpants Black Front", role: "front" },
          { publicId: "products/sweatpants_black_back",  alt: "Author Sweatpants Black Back",  role: "back"  },
          { publicId: "products/sweatpants_black_1st",   alt: "Author Sweatpants Black Side",  role: "detail" },
          { publicId: "products/sweatpants_black_2nd",   alt: "Author Sweatpants Black Detail", role: "detail" },
          { publicId: "products/sweatpants_black_3rd",   alt: "Author Sweatpants Black Full",   role: "detail" },
        ],
      },
      white: {
        slug: "white",
        label: "White",
        hex: "#FFFFFF",
        images: [
          { publicId: "products/sweatpants_white_front", alt: "Author Sweatpants White Front", role: "front" },
          { publicId: "products/sweatpants_white_back",  alt: "Author Sweatpants White Back",  role: "back"  },
          { publicId: "products/sweatpants_white_1st",   alt: "Author Sweatpants White Side",  role: "detail" },
          { publicId: "products/sweatpants_white_2nd",   alt: "Author Sweatpants White Detail", role: "detail" },
          { publicId: "products/sweatpants_white_3rd",   alt: "Author Sweatpants White Full",   role: "detail" },
        ],
      },
    },
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────
export function getProductsByCategory(category: string) {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getProductByCategoryAndSlug(category: string, slug: string) {
  return PRODUCTS.find((p) => p.category === category && p.slug === slug);
}

export function getShopProduct(slug: string) {
  return PRODUCTS.find((product) => product.slug === slug);
}

export function getColorFromParam(
  product: ShopProduct,
  colorParam?: string | null
): ShopColorSlug {
  const normalized = colorParam?.toLowerCase();
  if (normalized === "black" || normalized === "white") {
    return product.colors[normalized] ? normalized : "black";
  }
  return product.colors.black ? "black" : "white";
}

export const SHOP_IMAGE_PUBLIC_IDS = Array.from(
  new Set(
    PRODUCTS.flatMap((p) =>
      Object.values(p.colors).flatMap((c) => c.images.map((img) => img.publicId))
    )
  )
);
