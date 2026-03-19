// hooks/useCart.ts
import { useCartStore } from '@/store/cartStore';
import { CartItem, Product } from '@/types';
import { useMemo } from 'react';

export function useCart() {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getSubtotal,
    getTotal,
    isCartOpen,        // ✅ Add this
    setIsCartOpen,     // ✅ Add this
  } = useCartStore();

  const addToCart = (product: Product, quantity: number = 1) => { 
    const cartItem: CartItem = {
      id: crypto.randomUUID(), // Cart item ka unique ID
      productId: product.id, // ✅ Product ka ID (string)
      productNo: product.no,
      name: product.name,
      price: Number(product.unitPrice) || 0,
      quantity,
      image: product.imageUrlThumb,
      maxQuantity: product.availableToSell,
    };
    addItem(cartItem);
    
    // ✅ Open cart drawer when item is added
    setIsCartOpen(true);
  };

  const cartCount = useMemo(() => getTotalItems(), [items]);
  const subtotal = useMemo(() => getSubtotal(), [items]);
  const total = useMemo(() => getTotal(), [items]);

  return {
    items,
    cartCount,
    subtotal,
    total,
    addToCart,
    removeItem,
    updateQuantity,
    clearCart,
    isCartOpen,        // ✅ Add this
    setIsCartOpen,     // ✅ Add this
    openCart: () => setIsCartOpen(true),  // ✅ Helper function
  };
}