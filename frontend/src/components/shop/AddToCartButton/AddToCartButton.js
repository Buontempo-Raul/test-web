// src/components/shop/AddToCartButton/AddToCartButton.js
import React from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../../hooks/useCart';
import './AddToCartButton.css';

const AddToCartButton = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    // Create a cart item from the product
    const cartItem = {
      id: product._id,
      title: product.title,
      price: product.price,
      image: product.images[0],
      quantity: 1
    };
    
    addToCart(cartItem);
    
    // Show a brief animation or notification
    // This could be enhanced with a toast notification library
    const btn = document.getElementById(`add-to-cart-${product._id}`);
    if (btn) {
      btn.classList.add('added');
      setTimeout(() => {
        btn.classList.remove('added');
      }, 1000);
    }
  };

  return (
    <motion.button
      id={`add-to-cart-${product._id}`}
      className="add-to-cart-button"
      onClick={handleAddToCart}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="cart-icon">🛒</span>
      <span className="button-text">Add to Cart</span>
      <span className="added-text">Added!</span>
    </motion.button>
  );
};

export default AddToCartButton;