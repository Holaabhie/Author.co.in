import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  image: string;
  addedAt: string;
}

interface WishlistState {
  items: WishlistItem[];

  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: WishlistItem) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  getItemCount: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: WishlistItem) => {
        const exists = get().items.some(
          (i) => i.productId === item.productId
        );
        if (exists) return;

        set((state) => ({
          items: [...state.items, { ...item, addedAt: new Date().toISOString() }],
        }));
        toast.success(`${item.name} added to wishlist`);
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
        toast.success("Removed from wishlist");
      },

      toggleItem: (item: WishlistItem) => {
        const exists = get().isInWishlist(item.productId);
        if (exists) {
          get().removeItem(item.productId);
        } else {
          get().addItem(item);
        }
      },

      isInWishlist: (productId: string) => {
        return get().items.some((item) => item.productId === productId);
      },

      clearWishlist: () => set({ items: [] }),

      getItemCount: () => get().items.length,
    }),
    {
      name: "author-wishlist",
    }
  )
);
