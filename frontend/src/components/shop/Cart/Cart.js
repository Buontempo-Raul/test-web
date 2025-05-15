// src/components/shop/Cart/Cart.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../../hooks/useCart';
import './Cart.css';

const Cart = () => {
  const { cartItems, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  const handleCheckout = () => {
    // In a real app, this would navigate to a checkout page
    navigate('/checkout');
    setIsOpen(false);
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  const handleQuantityChange = (id, newQuantity) => {
    updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id) => {
    removeFromCart(id);
  };

  return (
    <>
      {/* Cart Button */}
      <button className="cart-button" onClick={toggleCart}>
        <div className="cart-icon">
          <span>🛒</span>
          {cartItems.length > 0 && (
            <span className="cart-count">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
          )}
        </div>
        <span>Cart</span>
      </button>

      {/* Cart Overlay */}
      <div 
        className={`cart-overlay ${isOpen ? 'open' : ''}`} 
        onClick={toggleCart}
      ></div>

      {/* Cart Drawer */}
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="close-cart" onClick={toggleCart}>×</button>
        </div>

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <p>Your cart is empty</p>
              <button 
                className="checkout-btn" 
                onClick={toggleCart}
                style={{ marginTop: '1rem' }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="cart-item-image" 
                  />
                  <div className="cart-item-details">
                    <div>
                      <div className="cart-item-title">{item.title}</div>
                      <div className="cart-item-price">${item.price.toFixed(2)}</div>
                    </div>
                    <div className="cart-item-actions">
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <input 
                          type="number"
                          className="quantity-input"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          min="1"
                        />
                        <button 
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button 
                        className="remove-item"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="cart-summary-row total">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <button 
              className="checkout-btn"
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </button>
            <button 
              className="clear-cart"
              onClick={handleClearCart}
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;