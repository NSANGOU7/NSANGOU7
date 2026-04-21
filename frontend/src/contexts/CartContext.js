import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], total: 0 });
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/cart`, {
        withCredentials: true
      });
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await axios.post(`${API_URL}/api/cart/add`, 
        { product_id: productId, quantity },
        { withCredentials: true }
      );
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      await axios.put(`${API_URL}/api/cart/update`,
        { product_id: productId, quantity },
        { withCredentials: true }
      );
      await fetchCart();
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`${API_URL}/api/cart/remove/${productId}`, {
        withCredentials: true
      });
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API_URL}/api/cart/clear`, {
        withCredentials: true
      });
      setCart({ items: [], total: 0 });
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
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
