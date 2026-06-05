import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";

export interface CartItem {
  productId: string;
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

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (
    productId: string,
    size: string,
    color: string,
    quantity: number
  ) => void;
  clearCart: () => void;
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

      addItem: (newItem: CartItem) => {
        const { items } = get();
        const existingIndex = items.findIndex(
          (item) =>
            item.productId === newItem.productId &&
            item.size === newItem.size &&
            item.color === newItem.color
        );

        if (existingIndex > -1) {
          const updated = [...items];
          const newQty = updated[existingIndex].quantity + newItem.quantity;
          if (newQty > 10) {
            toast.error("Maximum 10 items per product");
            return;
          }
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
          };
          set({ items: updated });
        } else {
          set({ items: [...items, newItem] });
        }

        toast.success(`${newItem.name} added to cart`);
        set({ isOpen: true });
      },

      removeItem: (productId: string, size: string, color: string) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.productId === productId &&
                item.size === size &&
                item.color === color
              )
          ),
        }));
        toast.success("Item removed from cart");
      },

      updateQuantity: (
        productId: string,
        size: string,
        color: string,
        quantity: number
      ) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }
        if (quantity > 10) {
          toast.error("Maximum 10 items per product");
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId &&
            item.size === size &&
            item.color === color
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
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
      partialize: (state) => ({ items: state.items }),
    }
  )
);
