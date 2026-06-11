import { create } from "zustand";
import { persist } from "zustand/middleware";

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

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  closeTimeout?: any;

  // Actions
  addItem: (item: CartItem) => { added: boolean; error?: string };
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  clearCartAndStorage: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      closeTimeout: null,

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

        return { added: true };
      },

      removeItem: (variantId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
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
      },

      clearCart: () => {
        set({ items: [] });
      },

      clearCartAndStorage: () => {
        set({ items: [] });
        if (typeof window !== "undefined") {
          useCartStore.persist.clearStorage();
        }
      },

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.salePrice ?? item.price;
          return total + price * item.quantity;
        }, 0);
      },

      getTax: () => {
        // 18% GST
        return Math.round(get().getSubtotal() * 0.18);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTax();
        const shipping = subtotal >= 999 ? 0 : 99;
        return subtotal + tax + shipping;
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
      partialize: (state) => ({ items: state.items }),
    }
  )
);
