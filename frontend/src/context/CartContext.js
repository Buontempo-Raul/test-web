// frontend/src/context/CartContext.js
import React, { createContext, useState, useEffect } from 'react';

// Create the cart context
export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  // State to store cart items
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        setCartItems([]);
      }
    }
  }, []);
  
  // Update localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    // Calculate cart total and count
    const total = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity, 
      0
    );
    setCartTotal(total);
    
    const count = cartItems.reduce(
      (sum, item) => sum + item.quantity, 
      0
    );
    setCartCount(count);
  }, [cartItems]);
  
  // Add item to cart
  const addToCart = (item, quantity = 1) => {
    setCartItems(prevItems => {
      // Check if the item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        cartItem => cartItem.id === item.id
      );
      
      if (existingItemIndex !== -1) {
        // If item exists, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        return updatedItems;
      } else {
        // If item doesn't exist, add it
        return [...prevItems, { ...item, quantity }];
      }
    });
  };
  
  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCartItems(prevItems => 
      prevItems.filter(item => item.id !== itemId)
    );
  };
  
  // Update item quantity
  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };
  
  // Create value object with cart data and functions
  const cartContextValue = {
    cartItems,
    cartTotal,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };
  
  return (
    <CartContext.Provider value={cartContextValue}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;