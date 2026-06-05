import { z } from "zod";

// ─── API Response Types ────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── Product Types ─────────────────────────────────────────────────

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
}

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  badge: string | null;
  isFeatured: boolean;
  details: string[];
  careInstructions: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  category: { id: string; name: string; slug: string } | null;
  collection: { id: string; name: string; slug: string } | null;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  stock: number;
  badge: string | null;
  images: { url: string; alt: string }[];
  variants: { size: string; color: string; colorHex: string; stock: number }[];
  category: { name: string; slug: string } | null;
  rating: number;
  reviewCount: number;
}

// ─── Cart Types ────────────────────────────────────────────────────

export interface CartItemDTO {
  id: string;
  quantity: number;
  size: string;
  color: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    images: { url: string; alt: string }[];
    stock: number;
  };
}

export interface CartDTO {
  id: string;
  items: CartItemDTO[];
  subtotal: number;
  itemCount: number;
}

// ─── Order Types ───────────────────────────────────────────────────

export type OrderStatusType =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatusType = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderItemDTO {
  id: string;
  quantity: number;
  price: number;
  size: string;
  color: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string }[];
  };
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  status: OrderStatusType;
  paymentStatus: PaymentStatusType;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  items: OrderItemDTO[];
  shippingAddress: AddressDTO | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Address Types ─────────────────────────────────────────────────

export interface AddressDTO {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// ─── User Types ────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
}

// ─── Review Types ──────────────────────────────────────────────────

export interface ReviewDTO {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerified: boolean;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

// ─── Filter & Sort Types ──────────────────────────────────────────

export type SortOption = "popular" | "newest" | "price-asc" | "price-desc" | "rating";

export interface ProductFilters {
  category?: string;
  collection?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  badge?: string;
  search?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

// ─── Zod Validation Schemas ────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1, "Please select a size"),
  color: z.string().min(1, "Please select a color"),
  quantity: z.number().int().min(1).max(10),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(10),
});

export const addressSchema = z.object({
  label: z.enum(["Home", "Work", "Other"]).default("Home"),
  fullName: z.string().min(2, "Name is required").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  line1: z.string().min(5, "Address is required").max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  postalCode: z.string().regex(/^\d{6}$/, "Invalid PIN code"),
  country: z.string().default("India"),
  isDefault: z.boolean().default(false),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
});

export const checkoutSchema = z.object({
  shippingAddressId: z.string().min(1, "Shipping address is required"),
  billingAddressId: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200),
  description: z.string().min(10),
  price: z.number().int().positive(),
  salePrice: z.number().int().positive().optional().nullable(),
  sku: z.string().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  badge: z.string().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  details: z.array(z.string()).default([]),
  careInstructions: z.array(z.string()).default([]),
  categoryId: z.string().optional().nullable(),
  collectionId: z.string().optional().nullable(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProductInput = z.infer<typeof productSchema>;
