import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, userAPI, cartAPI } from './api';

// ==================== AUTH STORE ====================
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await authAPI.login(credentials);
          const { access, refresh } = res.data;
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
          const profileRes = await userAPI.getProfile();
          set({ user: profileRes.data, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data };
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await authAPI.register(data);
          const { tokens, user } = res.data;
          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
          set({ user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data };
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),

      loadUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        try {
          const res = await userAPI.getProfile();
          set({ user: res.data, isAuthenticated: true });
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      },
    }),
    { name: 'auth-storage', partialize: (state) => ({ isAuthenticated: state.isAuthenticated }) }
  )
);

// ==================== CART STORE ====================
export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      coupon: null,
      couponDiscount: 0,

      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const res = await cartAPI.getCart();
          set({ cart: res.data, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      addToCart: async (productId, variantId = null, quantity = 1) => {
        try {
          await cartAPI.addToCart({ product_id: productId, variant_id: variantId, quantity });
          get().fetchCart();
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data };
        }
      },

      updateQuantity: async (itemId, quantity) => {
        try {
          await cartAPI.updateQuantity(itemId, quantity);
          get().fetchCart();
        } catch {}
      },

      removeItem: async (itemId) => {
        try {
          await cartAPI.removeItem(itemId);
          get().fetchCart();
        } catch {}
      },

      clearCart: async () => {
        try {
          await cartAPI.clearCart();
          set({ cart: null, coupon: null, couponDiscount: 0 });
        } catch {}
      },

      applyCoupon: (coupon, discount) => set({ coupon, couponDiscount: discount }),
      removeCoupon: () => set({ coupon: null, couponDiscount: 0 }),

      get totalItems() {
        return get().cart?.total_items || 0;
      },
    }),
    { name: 'cart-storage', partialize: () => ({}) }
  )
);

// ==================== WISHLIST STORE ====================
export const useWishlistStore = create((set, get) => ({
  items: [],

  fetchWishlist: async () => {
    try {
      const res = await userAPI.getWishlist();
      set({ items: res.data });
    } catch {}
  },

  toggle: async (productId) => {
    try {
      await userAPI.toggleWishlist(productId);
      get().fetchWishlist();
    } catch {}
  },

  isInWishlist: (productId) => {
    return get().items.some((item) => item.id === productId);
  },
}));

// ==================== UI STORE ====================
export const useUIStore = create((set) => ({
  searchQuery: '',
  searchOpen: false,
  mobileMenuOpen: false,
  cartDrawerOpen: false,

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),
  setCartDrawerOpen: (v) => set({ cartDrawerOpen: v }),
}));
