import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const GUEST_CART_KEY = 'autoparts_guest_cart';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

// Helpers for guest cart in localStorage
const loadGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};
const saveGuestCart = (items) => {
  try { localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items)); } catch { /* ignore */ }
};

// Fetch product details from API and compute totals for guest cart
const enrichGuestCart = async (rawItems) => {
  if (!rawItems.length) return { items: [], total: 0 };
  const enriched = await Promise.all(
    rawItems.map(async (it) => {
      try {
        const res = await axios.get(`${API_URL}/api/products/${it.product_id}`);
        const p = res.data;
        return {
          product_id: it.product_id,
          quantity: it.quantity,
          title: p.title,
          price: p.price,
          image: p.images?.[0] || null,
          stock: p.stock,
          subtotal: p.price * it.quantity,
        };
      } catch {
        return null;
      }
    })
  );
  const items = enriched.filter(Boolean);
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  return { items, total };
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await axios.get(`${API_URL}/api/cart`, { withCredentials: true });
        setCart(response.data);
      } else {
        const raw = loadGuestCart();
        const enriched = await enrichGuestCart(raw);
        setCart(enriched);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // Migrate guest cart to user cart when authentication happens
  useEffect(() => {
    if (!isAuthenticated) return;
    const guestItems = loadGuestCart();
    if (guestItems.length === 0) return;
    (async () => {
      try {
        for (const it of guestItems) {
          await axios.post(
            `${API_URL}/api/cart/add`,
            { product_id: it.product_id, quantity: it.quantity },
            { withCredentials: true }
          );
        }
        localStorage.removeItem(GUEST_CART_KEY);
        await fetchCart();
      } catch (e) { /* silent */ }
    })();
  }, [isAuthenticated, fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (isAuthenticated) {
      await axios.post(`${API_URL}/api/cart/add`,
        { product_id: productId, quantity },
        { withCredentials: true }
      );
      await fetchCart();
      return true;
    }
    // Guest: store in localStorage
    const items = loadGuestCart();
    const existing = items.find(i => i.product_id === productId);
    if (existing) existing.quantity += quantity;
    else items.push({ product_id: productId, quantity });
    saveGuestCart(items);
    await fetchCart();
    return true;
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);
    if (isAuthenticated) {
      await axios.put(`${API_URL}/api/cart/update`,
        { product_id: productId, quantity },
        { withCredentials: true }
      );
      await fetchCart();
      return;
    }
    const items = loadGuestCart().map(i =>
      i.product_id === productId ? { ...i, quantity } : i
    );
    saveGuestCart(items);
    await fetchCart();
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      await axios.delete(`${API_URL}/api/cart/remove/${productId}`, { withCredentials: true });
      await fetchCart();
      return;
    }
    const items = loadGuestCart().filter(i => i.product_id !== productId);
    saveGuestCart(items);
    await fetchCart();
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      await axios.delete(`${API_URL}/api/cart/clear`, { withCredentials: true });
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
    }
    setCart({ items: [], total: 0 });
  };

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      itemCount,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
