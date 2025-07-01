// Save this as: frontend/src/pages/AuctionPurchase/AuctionPurchase.js
// FIXED VERSION - Uses proper API service instead of relative URLs

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import './AuctionPurchase.css';

// Create API instance with proper base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AuctionPurchase = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [step, setStep] = useState(1); // 1: shipping, 2: payment, 3: complete
  
  // Shipping form state
  const [shippingData, setShippingData] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phoneNumber: ''
  });
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    fetchPurchaseData();
  }, [auctionId]);
  
  const fetchPurchaseData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`🔍 Fetching purchase data for auction ID: ${auctionId}`);
      console.log(`📡 Making request to: ${API_URL}/api/auction-purchases/${auctionId}`);
      
      // FIXED: Use axios with proper base URL instead of relative fetch
      const response = await api.get(`/api/auction-purchases/${auctionId}`);
      
      console.log(`📊 Response status: ${response.status}`);
      console.log(`📦 Response data:`, response.data);
      
      if (response.data.success) {
        setPurchase(response.data.purchase);
        
        // Set initial step based on purchase status
        if (response.data.purchase.status === 'pending') {
          setStep(1);
        } else if (response.data.purchase.status === 'address_provided') {
          setStep(2);
        } else {
          setStep(3);
        }
        
        // Pre-fill shipping data if available
        if (response.data.purchase.shippingAddress) {
          setShippingData(response.data.purchase.shippingAddress);
        }
        
        console.log('✅ Purchase data loaded successfully');
      } else {
        setError(response.data.message || 'Failed to load purchase information');
        console.error('❌ API returned error:', response.data.message);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      
      // Enhanced error handling
      let errorMessage = 'Failed to load purchase information';
      let debugMessage = err.message;
      
      if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.message || 'Server error';
        debugMessage = `Status: ${err.response.status}`;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Cannot connect to server';
        debugMessage = 'Make sure your backend server is running on port 5000';
      }
      
      setError(errorMessage);
      setDebugInfo({
        originalError: err.message,
        debugMessage,
        auctionId,
        timestamp: new Date().toISOString(),
        apiUrl: `${API_URL}/api/auction-purchases/${auctionId}`,
        suggestions: [
          'Check if the backend server is running on port 5000',
          'Verify the auction purchase exists in the database',
          'Check browser network tab for detailed error information'
        ]
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // FIXED: Use axios instead of fetch
      const response = await api.put(`/api/auction-purchases/${auctionId}/shipping`, shippingData);
      
      if (response.data.success) {
        setStep(2);
        await fetchPurchaseData(); // Refresh data
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('❌ Shipping update error:', err);
      setError(err.response?.data?.message || 'Failed to update shipping address');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Simulate payment processing (replace with actual payment gateway)
      const paymentResult = {
        id: 'pay_' + Math.random().toString(36).substr(2, 9),
        status: 'completed',
        update_time: new Date().toISOString(),
        email_address: currentUser?.email || 'customer@example.com'
      };
      
      // FIXED: Use axios instead of fetch
      const response = await api.post(`/api/auction-purchases/${auctionId}/payment`, {
        paymentResult
      });
      
      if (response.data.success) {
        setStep(3);
        await fetchPurchaseData(); // Refresh data
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('❌ Payment error:', err);
      setError(err.response?.data?.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="auction-purchase-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading purchase information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auction-purchase-container">
        <div className="error-container">
          <h2>⚠️ Error Loading Purchase</h2>
          <p className="error-message">{error}</p>
          
          {debugInfo && (
            <div className="debug-info">
              <h3>🔧 Debug Information</h3>
              <p><strong>Auction ID:</strong> {debugInfo.auctionId}</p>
              <p><strong>API URL:</strong> {debugInfo.apiUrl}</p>
              <p><strong>Error:</strong> {debugInfo.originalError}</p>
              <p><strong>Debug:</strong> {debugInfo.debugMessage}</p>
              <p><strong>Time:</strong> {debugInfo.timestamp}</p>
              
              <h4>💡 Suggestions:</h4>
              <ul>
                {debugInfo.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="error-actions">
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              🔄 Retry
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              🏠 Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="auction-purchase-container">
        <div className="error-container">
          <h2>❌ Purchase Not Found</h2>
          <p>The auction purchase could not be found.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Return Home
          </button>
        </div>
      </div>
    );
  }
  
  // Check if purchase has expired
  if (purchase.status === 'expired') {
    return (
      <div className="auction-purchase-container">
        <div className="expired-container">
          <h2>⏰ Purchase Expired</h2>
          <p>Sorry, the time limit for this auction has expired.</p>
          <div className="artwork-info">
            <h3>{purchase.artwork.title}</h3>
            <p>Winning Bid: ${purchase.winningBid.toFixed(2)}</p>
          </div>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Return Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="auction-purchase-container">
      <div className="purchase-header">
        <h1>🎉 Congratulations!</h1>
        <p>Complete your auction purchase</p>
        
        {purchase.timeRemaining && purchase.status === 'pending' && (
          <div className="time-warning">
            ⏰ Time remaining: {purchase.timeRemaining}
          </div>
        )}
      </div>
      
      {/* Artwork Information */}
      <div className="artwork-section">
        <div className="artwork-images">
          {purchase.artwork.images && purchase.artwork.images.length > 0 && (
            <img 
              src={purchase.artwork.images[0]} 
              alt={purchase.artwork.title}
              className="artwork-image"
            />
          )}
        </div>
        <div className="artwork-details">
          <h2>{purchase.artwork.title}</h2>
          <p className="artwork-description">{purchase.artwork.description}</p>
          <div className="purchase-summary">
            <div className="price-row">
              <span>Winning Bid:</span>
              <span>${purchase.winningBid.toFixed(2)}</span>
            </div>
            <div className="price-row">
              <span>Platform Fee:</span>
              <span>${purchase.platformFee.toFixed(2)}</span>
            </div>
            <div className="price-row">
              <span>Shipping:</span>
              <span>${purchase.shippingFee.toFixed(2)}</span>
            </div>
            <div className="price-row total">
              <span>Total:</span>
              <span>${purchase.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="progress-steps">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Shipping Address</div>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Payment</div>
        </div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Complete</div>
        </div>
      </div>
      
      {/* Step Content */}
      <div className="step-content">
        {step === 1 && (
          <div className="shipping-step">
            <h3>📦 Shipping Information</h3>
            <form onSubmit={handleShippingSubmit} className="shipping-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={shippingData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number *</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={shippingData.phoneNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={shippingData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={shippingData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="state">State *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={shippingData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="postalCode">Postal Code *</label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={shippingData.postalCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="country">Country *</label>
                <select
                  id="country"
                  name="country"
                  value={shippingData.country}
                  onChange={handleInputChange}
                  required
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Continue to Payment'}
              </button>
            </form>
          </div>
        )}
        
        {step === 2 && (
          <div className="payment-step">
            <h3>💳 Payment Information</h3>
            <div className="payment-summary">
              <h4>Order Summary</h4>
              <div className="summary-row">
                <span>Winning Bid:</span>
                <span>${purchase.winningBid.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Platform Fee:</span>
                <span>${purchase.platformFee.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping:</span>
                <span>${purchase.shippingFee.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>${purchase.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="payment-form">
              <div className="payment-methods">
                <div className="payment-method">
                  <input
                    type="radio"
                    id="credit_card"
                    name="paymentMethod"
                    value="credit_card"
                    checked={paymentMethod === 'credit_card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label htmlFor="credit_card">💳 Credit Card</label>
                </div>
                <div className="payment-method">
                  <input
                    type="radio"
                    id="paypal"
                    name="paymentMethod"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label htmlFor="paypal">💰 PayPal</label>
                </div>
              </div>
              
              {paymentMethod === 'credit_card' && (
                <div className="credit-card-form">
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
                  <div className="form-group">
                    <label htmlFor="cardName">Name on Card</label>
                    <input
                      type="text"
                      id="cardName"
                      required
                    />
                  </div>
                </div>
              )}
              
              <button 
                type="submit" 
                className="btn btn-success btn-full"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing Payment...' : `Pay $${purchase.totalAmount.toFixed(2)}`}
              </button>
              
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="btn btn-secondary btn-full"
                disabled={isProcessing}
              >
                Back to Shipping
              </button>
            </form>
          </div>
        )}
        
        {step === 3 && (
          <div className="completion-step">
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h3>Payment Successful!</h3>
              <p>Your purchase has been completed successfully.</p>
              
              <div className="next-steps">
                <h4>What happens next?</h4>
                <ul>
                  <li>📧 You'll receive a confirmation email shortly</li>
                  <li>🎨 The artist will be notified of your purchase</li>
                  <li>📦 Your artwork will be prepared for shipping</li>
                  <li>🚚 You'll receive tracking information once shipped</li>
                </ul>
              </div>
              
              <div className="order-details">
                <h4>Order Details</h4>
                <p><strong>Order ID:</strong> {purchase.auctionId}</p>
                <p><strong>Artwork:</strong> {purchase.artwork.title}</p>
                <p><strong>Total Paid:</strong> ${purchase.totalAmount.toFixed(2)}</p>
                <p><strong>Estimated Delivery:</strong> 5-7 business days</p>
              </div>
              
              <div className="action-buttons">
                <button onClick={() => navigate('/')} className="btn btn-primary">
                  Continue Shopping
                </button>
                <button onClick={() => navigate('/profile')} className="btn btn-secondary">
                  View My Purchases
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionPurchase;