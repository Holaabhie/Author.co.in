import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useUIStore, registerCloseCart } from "./ui";

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  image: string;
  size: string;
  color: string;
  colorHex: string;
  quantity: number;
  stock: number;
}

export interface CouponApplyResult {
  couponCode: string;
  items: {
    productId: string;
    variantId: string;
    categorySlug: string;
    quantity: number;
    originalUnitPrice: number;
    finalUnitPrice: number;
    discountPerUnit: number;
  }[];
  originalSubtotal: number;
  discountAmount: number;
  finalTotal: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  closeTimeout?: any;

  // Coupon state
  couponCode: string | null;
  couponResult: CouponApplyResult | null;
  couponLoading: boolean;
  couponError: string | null;

  // Actions
  addItem: (item: CartItem) => { added: boolean; error?: string };
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  clearCartAndStorage: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  _recalcCoupon: () => void;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getCouponDiscount: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      closeTimeout: null,
      couponCode: null,
      couponResult: null,
      couponLoading: false,
      couponError: null,

      addItem: (newItem: CartItem) => {
        const normalizedItem = {
          ...newItem,
          variantId:
            newItem.variantId ||
            `${newItem.productId}:${newItem.size}:${newItem.color}`,
        };
        const { items, closeTimeout } = get();
        const existingIndex = items.findIndex(
          (item) => item.variantId === normalizedItem.variantId
        );

        if (existingIndex > -1) {
          const updated = [...items];
          const newQty = updated[existingIndex].quantity + normalizedItem.quantity;
          if (newQty > 10) {
            return { added: false, error: "Maximum 10 items per product" };
          }
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
          };
          set({ items: updated });
        } else {
          set({ items: [...items, normalizedItem] });
        }

        // Close other overlays when opening cart via addItem
        useUIStore.getState().closeSearch();
        useUIStore.getState().closeMobileMenu();
        set({ isOpen: true });

        // Auto-close after 1.5 seconds
        if (typeof window !== "undefined") {
          if (closeTimeout) {
            clearTimeout(closeTimeout);
          }
          const timeout = setTimeout(() => {
            if (get().isOpen) {
              set({ isOpen: false });
            }
          }, 1500);
          set({ closeTimeout: timeout });
        }

        // Auto-recalculate coupon after adding item
        setTimeout(() => get()._recalcCoupon(), 0);

        return { added: true };
      },

      removeItem: (variantId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
        // Auto-recalculate coupon after removing item
        const { items, couponCode: cc } = get();
        if (items.length === 0 && cc) {
          get().removeCoupon();
        } else {
          setTimeout(() => get()._recalcCoupon(), 0);
        }
      },

      updateQuantity: (variantId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        if (quantity > 10) {
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId ? { ...item, quantity } : item
          ),
        }));
        // Auto-recalculate coupon after quantity change
        setTimeout(() => get()._recalcCoupon(), 0);
      },

      clearCart: () => {
        set({ items: [], couponCode: null, couponResult: null, couponError: null });
      },

      clearCartAndStorage: () => {
        set({ items: [], couponCode: null, couponResult: null, couponError: null });
        if (typeof window !== "undefined") {
          useCartStore.persist.clearStorage();
        }
      },

      toggleCart: () => {
        const nextIsOpen = !get().isOpen;
        if (nextIsOpen) {
          // Close other overlays when opening cart
          useUIStore.getState().closeSearch();
          useUIStore.getState().closeMobileMenu();
        }
        set({ isOpen: nextIsOpen });
      },
      openCart: () => {
        // Close other overlays when opening cart
        useUIStore.getState().closeSearch();
        useUIStore.getState().closeMobileMenu();
        set({ isOpen: true });
      },
      closeCart: () => set({ isOpen: false }),

      applyCoupon: async (code: string) => {
        const { items } = get();
        if (items.length === 0) {
          set({ couponError: "Cart is empty" });
          return;
        }
        set({ couponLoading: true, couponError: null });
        try {
          const res = await fetch("/api/coupons/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              couponCode: code,
              items: items.map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
              })),
            }),
          });
          const json = await res.json();
          if (json.success && json.data?.valid) {
            set({
              couponCode: json.data.couponCode,
              couponResult: json.data,
              couponError: null,
            });
          } else {
            set({
              couponCode: null,
              couponResult: null,
              couponError: json.message || "Invalid coupon code",
            });
          }
        } catch {
          set({
            couponCode: null,
            couponResult: null,
            couponError: "Failed to apply coupon",
          });
        } finally {
          set({ couponLoading: false });
        }
      },

      removeCoupon: () => {
        set({ couponCode: null, couponResult: null, couponError: null });
      },

      /** Internal: re-apply coupon after cart changes */
      _recalcCoupon: () => {
        const { couponCode: cc, items } = get();
        if (!cc || items.length === 0) return;
        // Fire-and-forget recalculation
        get().applyCoupon(cc);
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.salePrice ?? item.price;
          return total + price * item.quantity;
        }, 0);
      },

      getCouponDiscount: () => {
        const result = get().couponResult;
        if (!result) return 0;
        // couponResult amounts are in paise, convert to rupees for frontend
        return result.discountAmount / 100;
      },

      getTax: () => {
        return 0;
      },

      getTotal: () => {
        const { couponResult } = get();
        if (couponResult) {
          // couponResult.finalTotal is in paise, convert to rupees
          return couponResult.finalTotal / 100;
        }
        return get().getSubtotal();
      },
    }),
    {
      name: "author-cart",
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState?.items) {
          return persistedState;
        }

        return {
          ...persistedState,
          items: persistedState.items.map((item: CartItem) => ({
            ...item,
            variantId:
              item.variantId ||
              `${item.productId}:${item.size}:${item.color}`,
          })),
        };
      },
      partialize: (state) => ({ items: state.items, couponCode: state.couponCode }),
    }
  )
);

// Register closeCart in UI store to avoid circular imports
if (typeof window !== "undefined") {
  registerCloseCart(() => useCartStore.getState().closeCart());
} else {
  registerCloseCart(() => {});
}
