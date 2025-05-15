// src/pages/Checkout/Checkout.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'United States',
    paymentMethod: 'creditCard'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // In a real app, you would make an API call to create an order
      // const response = await fetch('/api/orders', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify({
      //     items: cartItems,
      //     shipping: {
      //       firstName: formData.firstName,
      //       lastName: formData.lastName,
      //       address: formData.address,
      //       city: formData.city,
      //       zipCode: formData.zipCode,
      //       country: formData.country
      //     },
      //     paymentMethod: formData.paymentMethod,
      //     total: cartTotal
      //   })
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Order successful
      clearCart();
      setOrderPlaced(true);
      
      // Redirect to a thank you page after a few seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Error placing order:', err);
      setError('An error occurred while placing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="checkout-container">
        <div className="success-message">
          <h2>Thank you for your order!</h2>
          <p>Your order has been placed successfully.</p>
          <p>You will be redirected to the home page shortly...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="checkout-container">
        <div className="empty-cart-message">
          <h2>Your cart is empty</h2>
          <p>Please add some items to your cart before proceeding to checkout.</p>
          <Link to="/shop" className="continue-shopping-btn">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <p>Please complete your order information below</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="checkout-content">
        <div className="checkout-form-container">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="checkout-section">
              <h2>Shipping Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="zipCode">Zip Code</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="Japan">Japan</option>
                </select>
              </div>
            </div>
            
            <div className="checkout-section">
              <h2>Payment Method</h2>
              
              <div className="payment-methods">
                <div 
                  className={`payment-method ${formData.paymentMethod === 'creditCard' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, paymentMethod: 'creditCard'})}
                >
                  <input
                    type="radio"
                    id="creditCard"
                    name="paymentMethod"
                    value="creditCard"
                    checked={formData.paymentMethod === 'creditCard'}
                    onChange={handleInputChange}
                    className="payment-method-radio"
                  />
                  <div className="payment-method-info">
                    <div className="payment-method-title">Credit Card</div>
                    <div className="payment-method-description">Pay with Visa, Mastercard, or American Express</div>
                  </div>
                </div>
                
                <div 
                  className={`payment-method ${formData.paymentMethod === 'paypal' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, paymentMethod: 'paypal'})}
                >
                  <input
                    type="radio"
                    id="paypal"
                    name="paymentMethod"
                    value="paypal"
                    checked={formData.paymentMethod === 'paypal'}
                    onChange={handleInputChange}
                    className="payment-method-radio"
                  />
                  <div className="payment-method-info">
                    <div className="payment-method-title">PayPal</div>
                    <div className="payment-method-description">Pay with your PayPal account</div>
                  </div>
                </div>
              </div>
              
              {formData.paymentMethod === 'creditCard' && (
                <>
                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number</label>
                    <input
                      type="text"
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="expiryDate">Expiry Date</label>
                      <input
                        type="text"
                        id="expiryDate"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="cvv">CVV</label>
                      <input
                        type="text"
                        id="cvv"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
        
        <div className="order-summary">
          <div className="summary-section">
            <h2>Order Summary</h2>
            
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="cart-item-image" 
                  />
                  <div className="cart-item-details">
                    <div className="cart-item-title">{item.title}</div>
                    <div className="cart-item-price">
                      <span className="cart-item-quantity">Qty: {item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span>${(cartTotal * 0.1).toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${(cartTotal + (cartTotal * 0.1)).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            className="place-order-btn"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;