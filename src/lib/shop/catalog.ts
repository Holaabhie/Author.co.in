export type ShopCategorySlug = "tshirts" | "tops" | "sweatpants";
export type ShopColorSlug = "black" | "white" | "grey";
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
  colors: Partial<Record<ShopColorSlug, ShopColor>>;
};

export function isShopCategorySlug(value: string): value is ShopCategorySlug {
  return ["tshirts", "tops", "sweatpants"].includes(value);
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpxirx0mn";

export interface CloudinaryUrlOptions {
  width?: number;
  quality?: string | number;
  crop?: string;
  format?: string;
}

/**
 * Generate a high-quality optimized Cloudinary URL from a public_id.
 * Encodes spaces and special characters, and supports dynamic options.
 */
export function cloudinaryImageUrl(
  publicId: string,
  options?: number | CloudinaryUrlOptions
): string {
  if (!CLOUD_NAME || !publicId) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[cloudinaryImageUrl] Missing publicId or CLOUD_NAME. publicId="${publicId}"`);
    }
    return "";
  }

  const cleanId = publicId.replace(/^\/+/, "");
  // Encode each segment of the path to support spaces/special characters
  const encodedId = cleanId
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");

  let width = 1400;
  let quality = "auto";
  let crop = "scale";
  let format = "auto";

  if (typeof options === "number") {
    width = options;
  } else if (options) {
    if (options.width !== undefined) width = options.width;
    if (options.quality !== undefined) quality = String(options.quality);
    if (options.crop !== undefined) crop = options.crop;
    if (options.format !== undefined) format = options.format;
  }

  const qStr = quality === "auto" ? "q_auto" : `q_${quality}`;

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},c_${crop},${qStr},f_${format}/${encodedId}`;
}

/**
 * Optimizes a legacy full Cloudinary URL by swapping width and quality values.
 */
export function optimizeCloudinaryUrl(url: string, targetWidth: number): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;

  try {
    // Replace w_XXXX with w_targetWidth
    let optimized = url.replace(/w_\d+/, `w_${targetWidth}`);
    
    // Replace q_auto:best or other quality parameters with q_auto
    optimized = optimized.replace(/q_auto:[a-z]+/, "q_auto");
    
    // Make sure spaces are encoded as %20
    optimized = optimized.split(" ").join("%20");

    return optimized;
  } catch (err) {
    console.error("[optimizeCloudinaryUrl] Failed to optimize URL:", url, err);
    return url;
  }
}

// ─── PRODUCT DATA ────────────────────────────────────────────────
// Every publicId below is an EXACT Cloudinary public_id that EXISTS in
// the dpxirx0mn cloud. No products/ prefix (those don't exist).
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
          { publicId: "tshirt_2nd_ldhr3h",        alt: "Author Essential Tee Black Front", role: "front" },
          { publicId: "black_t_shirt_1st_aradpv", alt: "Author Essential Tee Black Back",  role: "back"  },
          { publicId: "DSCF5641.JPG_rz60rf",      alt: "Author Essential Tee Black Detail 1", role: "detail" },
          { publicId: "DSCF5604.JPG_jwlpqv",      alt: "Author Essential Tee Black Detail 2", role: "detail" },
        ],
      },
      white: {
        slug: "white",
        label: "White",
        hex: "#FFFFFF",
        images: [
          { publicId: "white_t_shirt_2nd_siebfk",                      alt: "Author Essential Tee White Front", role: "front" },
          { publicId: "white_tshirt_1_st_bbzsdu",                      alt: "Author Essential Tee White Back",  role: "back"  },
          { publicId: "5e863912-1833-49b5-9c8e-b80f52e2f1bc_1_kwwi1v", alt: "Author Essential Tee White Detail 1", role: "detail" },
          { publicId: "IMG_7677.JPG_rrtgih",                           alt: "Author Essential Tee White Detail 2", role: "detail" },
        ],
      },
    },
  },

  // ── TOPS ──
  {
    slug: "author-essential-top",
    name: "Author Essential Top",
    price: 849,
    badge: null,
    description: "Minimal AUTHOR top designed for a premium clean silhouette.",
    sizes: ["XS", "S", "M", "L"],
    category: "tops",
    colors: {
      black: {
        slug: "black",
        label: "Black",
        hex: "#0A0A0A",
        images: [
          { publicId: "top_black_2nd_gegyy3", alt: "Author Essential Top Black Front", role: "front" },
          { publicId: "top_black_1st_wgsy3e", alt: "Author Essential Top Black Back",  role: "back"  },
        ],
      },
      white: {
        slug: "white",
        label: "White",
        hex: "#FFFFFF",
        images: [
          { publicId: "top_1st_l0udlk", alt: "Author Essential Top White Front", role: "front" },
          { publicId: "top_2nd_kxfr24", alt: "Author Essential Top White Back",  role: "back"  },
        ],
      },
    },
  },

  // ── SWEATPANTS ──
  {
    slug: "author-essential-sweatpants",
    name: "Author Essential Sweatpants",
    price: 1399,
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
          { publicId: "sweat_black_2nd_zxtogc", alt: "Author Sweatpants Black Front",  role: "front"  },
          { publicId: "black_1st_tvrnqs",       alt: "Author Sweatpants Black Back",   role: "back"   },
          { publicId: "author-black-sweatpants-back 1s", alt: "Author Sweatpants Black Back 1s", role: "detail" },
          { publicId: "author-black-sweatpants-back 2nd", alt: "Author Sweatpants Black Back 2nd", role: "detail" },
          { publicId: "author-black-sweatpants-back 3rd", alt: "Author Sweatpants Black Back 3rd", role: "detail" },
        ],
      },
      grey: {
        slug: "grey",
        label: "Grey",
        hex: "#888888",
        variantColor: "Grey",
        images: [
          { publicId: "gray_sweat_2nd_a1mdog", alt: "Author Sweatpants Grey Front",  role: "front"  },
          { publicId: "gray_sweat_1st_cgspx0", alt: "Author Sweatpants Grey Back",   role: "back"   },
          { publicId: "DSCF5541_plog3s",       alt: "Author Sweatpants Grey Side",   role: "detail" },
          { publicId: "DSCF5529_etgtdf",       alt: "Author Sweatpants Grey Detail", role: "detail" },
          { publicId: "DSCF5515_ocdsro",       alt: "Author Sweatpants Grey Full",   role: "detail" },
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
  const normalized = colorParam?.toLowerCase() as ShopColorSlug | undefined;
  if (normalized && product.colors[normalized]) {
    return normalized;
  }
  // Return first available color
  const availableColors = Object.keys(product.colors) as ShopColorSlug[];
  return availableColors[0] || "black";
}

// Dev-mode validation: log any products missing images
if (process.env.NODE_ENV === "development") {
  for (const product of PRODUCTS) {
    for (const [colorSlug, colorData] of Object.entries(product.colors)) {
      if (!colorData || colorData.images.length === 0) {
        console.warn(`[catalog] Product "${product.slug}" color "${colorSlug}" has NO images!`);
      }
      for (const img of colorData?.images || []) {
        if (!img.publicId) {
          console.warn(`[catalog] Product "${product.slug}" color "${colorSlug}" has image with EMPTY publicId!`);
        }
      }
    }
  }
}

export const SHOP_IMAGE_PUBLIC_IDS = Array.from(
  new Set(
    PRODUCTS.flatMap((p) =>
      Object.values(p.colors).flatMap((c) => c?.images.map((img) => img.publicId) || [])
    )
  )
);
