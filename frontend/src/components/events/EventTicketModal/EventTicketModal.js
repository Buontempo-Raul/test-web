// src/components/events/EventTicketModal/EventTicketModal.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './EventTicketModal.css';

const EventTicketModal = ({ event, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const totalPrice = event.price * quantity;

  const handleQuantityChange = (amount) => {
    const newQuantity = quantity + amount;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNextStep = () => {
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Show processing state
    setIsProcessing(true);
    
    // Simulate API call to process payment
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      // Automatically close after showing success
      setTimeout(() => {
        onClose();
      }, 3000);
    }, 2000);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isStepOneComplete = formData.name && formData.email && formData.phone;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="ticket-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
      >
        <button className="close-modal" onClick={onClose}>&times;</button>
        
        {isSuccess ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Purchase Successful!</h3>
            <p>Your tickets for {event.title} have been confirmed.</p>
            <p>A confirmation email has been sent to {formData.email}</p>
          </div>
        ) : (
          <>
            <div className="ticket-modal-header">
              <h2>Purchase Tickets</h2>
              <h3>{event.title}</h3>
              <div className="event-basic-info">
                <span>{formatDate(event.date)} • {event.time}</span>
                <span>{event.location}</span>
              </div>
            </div>
            
            <div className="step-indicator">
              <div className={`step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-text">Ticket Info</div>
              </div>
              <div className="step-line"></div>
              <div className={`step ${currentStep === 2 ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-text">Payment</div>
              </div>
            </div>
            
            <div className="ticket-modal-body">
              <AnimatePresence mode="wait">
                {currentStep === 1 ? (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="step-content"
                  >
                    <div className="ticket-quantity">
                      <p>Number of Tickets:</p>
                      <div className="quantity-selector">
                        <button 
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                        >-</button>
                        <span>{quantity}</span>
                        <button 
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= 10}
                        >+</button>
                      </div>
                    </div>
                    
                    <div className="ticket-price">
                      <div className="price-breakdown">
                        <div className="price-item">
                          <span>Price per ticket:</span>
                          <span>${event.price.toFixed(2)}</span>
                        </div>
                        <div className="price-item total">
                          <span>Total:</span>
                          <span>${totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ticket-form">
                      <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input 
                          type="text" 
                          id="name" 
                          name="name" 
                          value={formData.name} 
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="email">Email Address</label>
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
                        <label htmlFor="phone">Phone Number</label>
                        <input 
                          type="tel" 
                          id="phone" 
                          name="phone" 
                          value={formData.phone} 
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="step-actions">
                      <button 
                        className="proceed-btn"
                        onClick={handleNextStep}
                        disabled={!isStepOneComplete}
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="step-content"
                  >
                    <form onSubmit={handleSubmit} className="payment-form">
                      <div className="form-group">
                        <label htmlFor="cardNumber">Card Number</label>
                        <input 
                          type="text" 
                          id="cardNumber" 
                          name="cardNumber" 
                          value={formData.cardNumber} 
                          onChange={handleInputChange}
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
                            name="expiryDate" 
                            value={formData.expiryDate} 
                            onChange={handleInputChange}
                            placeholder="MM/YY"
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="cvv">CVV</label>
                          <input 
                            type="text" 
                            id="cvv" 
                            name="cvv" 
                            value={formData.cvv} 
                            onChange={handleInputChange}
                            placeholder="123"
                            required 
                          />
                        </div>
                      </div>
                      
                      <div className="purchase-summary">
                        <h4>Purchase Summary</h4>
                        <div className="summary-item">
                          <span>Event:</span>
                          <span>{event.title}</span>
                        </div>
                        <div className="summary-item">
                          <span>Date:</span>
                          <span>{formatDate(event.date)}, {event.time}</span>
                        </div>
                        <div className="summary-item">
                          <span>Tickets:</span>
                          <span>{quantity}</span>
                        </div>
                        <div className="summary-item total">
                          <span>Total:</span>
                          <span>${totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="step-actions">
                        <button 
                          type="button" 
                          className="back-btn"
                          onClick={handlePrevStep}
                        >
                          Back
                        </button>
                        <button 
                          type="submit" 
                          className="purchase-btn"
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : 'Complete Purchase'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default EventTicketModal;