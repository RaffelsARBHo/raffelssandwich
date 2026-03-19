// store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartStore {
  items: any[];
  isCartOpen: boolean;  // ✅ Add this
  
  addItem: (item: any) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  setIsCartOpen: (open: boolean) => void;  // ✅ Add this
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,  // ✅ Add this

      addItem: (newItem) => {
        const { items } = get();
        const existingItem = items.find(
          (item) => item.productId === newItem.productId
        );

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.productId === newItem.productId
                ? {
                    ...item,
                    quantity: Math.min(
                      item.quantity + newItem.quantity,
                      newItem.maxQuantity || Infinity
                    ),
                  }
                : item
            ),
          });
        } else {
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (productId) => {
        const { items } = get();
        set({ items: items.filter((item) => item.productId !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          set({ items: items.filter((item) => item.productId !== productId) });
        } else {
          set({
            items: items.map((item) =>
              item.productId === productId
                ? {
                    ...item,
                    quantity: Math.min(quantity, item.maxQuantity || Infinity),
                  }
                : item
            ),
          });
        }
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price = item.price || 0; // ✅ Fallback
          const quantity = item.quantity || 0; // ✅ Fallback
          return total + price * quantity;
        }, 0);
      },

      getTotal: () => {
        const { getSubtotal } = get();
        return getSubtotal(); // Add tax/shipping here if needed
      },

      setIsCartOpen: (open) => set({ isCartOpen: open }),  // ✅ Add this
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ 
        items: state.items 
        // ✅ Only persist items, NOT isCartOpen (drawer should be closed on page reload)
      }),
    }
  )
);