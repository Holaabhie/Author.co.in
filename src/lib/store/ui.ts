import { create } from "zustand";

interface UIState {
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;

  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
  closeAllOverlays: () => void;
}

let closeCartCallback: (() => void) | null = null;

export const registerCloseCart = (cb: () => void) => {
  closeCartCallback = cb;
};

export const useUIStore = create<UIState>((set) => ({
  isSearchOpen: false,
  isMobileMenuOpen: false,

  // Opening search closes menu + cart
  openSearch: () => {
    set({ isSearchOpen: true, isMobileMenuOpen: false });
    closeCartCallback?.();
  },
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => {
    const current = useUIStore.getState().isSearchOpen;
    if (current) {
      set({ isSearchOpen: false });
    } else {
      set({ isSearchOpen: true, isMobileMenuOpen: false });
      closeCartCallback?.();
    }
  },

  // Opening menu closes search + cart
  openMobileMenu: () => {
    set({ isMobileMenuOpen: true, isSearchOpen: false });
    closeCartCallback?.();
  },
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () => {
    const current = useUIStore.getState().isMobileMenuOpen;
    if (current) {
      set({ isMobileMenuOpen: false });
    } else {
      set({ isMobileMenuOpen: true, isSearchOpen: false });
      closeCartCallback?.();
    }
  },

  // Close everything
  closeAllOverlays: () => {
    set({ isSearchOpen: false, isMobileMenuOpen: false });
    closeCartCallback?.();
  },
}));
