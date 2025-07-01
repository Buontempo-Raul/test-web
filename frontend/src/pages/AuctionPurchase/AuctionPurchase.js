// frontend/src/pages/AuctionPurchase/AuctionPurchase.js
// IMPROVED VERSION with better error handling and debugging

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './AuctionPurchase.css';

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
      
      const token = localStorage.getItem('token');
      const apiUrl = `/api/auction-purchases/${auctionId}`;
      
      console.log(`📡 Making request to: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } : {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📊 Response status: ${response.status}`);
      console.log(`📊 Response headers:`, response.headers);
      
      // Get response text first to check if it's HTML or JSON
      const responseText = await response.text();
      console.log(`📄 Response text (first 500 chars):`, responseText.substring(0, 500));
      
      // Check if response is HTML (error page)
      if (responseText.startsWith('<!DOCTYPE html>') || responseText.startsWith('<html')) {
        throw new Error('Backend returned HTML instead of JSON. This usually means the route is not found or there\'s a server error.');
      }
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        throw new Error(`Failed to parse response as JSON: ${parseError.message}`);
      }
      
      console.log(`📦 Parsed response:`, data);
      
      if (data.success) {
        setPurchase(data.purchase);
        
        // Set initial step based on purchase status
        if (data.purchase.status === 'pending') {
          setStep(1);
        } else if (data.purchase.status === 'address_provided') {
          setStep(2);
        } else {
          setStep(3);
        }
        
        // Pre-fill shipping data if available
        if (data.purchase.shippingAddress) {
          setShippingData(data.purchase.shippingAddress);
        }
        
        console.log('✅ Purchase data loaded successfully');
      } else {
        setError(data.message || 'Failed to load purchase information');
        console.error('❌ API returned error:', data.message);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      
      // Enhanced error handling with debugging info
      let errorMessage = 'Failed to load purchase information';
      let debugMessage = err.message;
      
      if (err.message.includes('HTML instead of JSON')) {
        errorMessage = 'Server configuration error';
        debugMessage = 'The backend is returning HTML instead of JSON. This could mean: 1) The auction purchase doesn\'t exist in the database, 2) The backend route is not properly configured, 3) The server is not running correctly.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server';
        debugMessage = 'Make sure your backend server is running on the correct port (usually :5000)';
      }
      
      setError(errorMessage);
      setDebugInfo({
        originalError: err.message,
        debugMessage,
        auctionId,
        timestamp: new Date().toISOString(),
        apiUrl: `/api/auction-purchases/${auctionId}`,
        suggestions: [
          'Check if the backend server is running',
          'Verify the auction purchase exists in the database',
          'Run the debugging script: node backend/scripts/debugAuctionPurchase.js',
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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auction-purchases/${auctionId}/shipping`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shippingData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStep(2);
        await fetchPurchaseData(); // Refresh data
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update shipping address');
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
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auction-purchases/${auctionId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethod,
          paymentResult
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStep(3);
        await fetchPurchaseData(); // Refresh data
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="auction-purchase-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading purchase information...</p>
          <small>Auction ID: {auctionId}</small>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="auction-purchase-container">
        <div className="error-container">
          <h2>Error</h2>
          <p className="error-message">{error}</p>
          
          {debugInfo && (
            <div className="debug-info">
              <details>
                <summary>🔍 Debug Information (Click to expand)</summary>
                <div className="debug-content">
                  <p><strong>Auction ID:</strong> {debugInfo.auctionId}</p>
                  <p><strong>API URL:</strong> {debugInfo.apiUrl}</p>
                  <p><strong>Time:</strong> {debugInfo.timestamp}</p>
                  <p><strong>Original Error:</strong> {debugInfo.originalError}</p>
                  <p><strong>Debug Message:</strong> {debugInfo.debugMessage}</p>
                  
                  <h4>Suggested Actions:</h4>
                  <ul>
                    {debugInfo.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                  
                  <h4>Quick Tests:</h4>
                  <ul>
                    <li>
                      <a 
                        href={`/api/auction-purchases/test`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Test Auction Purchase API
                      </a>
                    </li>
                    <li>
                      <a 
                        href={`/api/test`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Test Backend Connection
                      </a>
                    </li>
                  </ul>
                </div>
              </details>
            </div>
          )}
          
          <div className="error-actions">
            <button onClick={() => fetchPurchaseData()} className="btn btn-secondary">
              🔄 Retry
            </button>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              🏠 Return Home
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
          <h2>Purchase Not Found</h2>
          <p>The auction purchase could not be found.</p>
          <p><strong>Auction ID:</strong> {auctionId}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Return Home
          </button>
        </div>
      </div>
    );
  }
  
  // Check if user is authenticated and is the winner
  if (isAuthenticated && currentUser && currentUser._id !== purchase.winner._id) {
    return (
      <div className="auction-purchase-container">
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>You are not authorized to view this purchase.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Return Home
          </button>
        </div>
      </div>
    );
  }
  
  if (purchase.status === 'expired') {
    return (
      <div className="auction-purchase-container">
        <div className="expired-container">
          <h2>⏰ Purchase Window Expired</h2>
          <p>Unfortunately, the 7-day purchase window for this auction has expired.</p>
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
      {step === 1 && (
        <div className="step-content">
          <h3>📦 Shipping Information</h3>
          <form onSubmit={handleShippingSubmit} className="shipping-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={shippingData.fullName}
                  onChange={(e) => setShippingData({...shippingData, fullName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={shippingData.phoneNumber}
                  onChange={(e) => setShippingData({...shippingData, phoneNumber: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                value={shippingData.address}
                onChange={(e) => setShippingData({...shippingData, address: e.target.value})}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  value={shippingData.city}
                  onChange={(e) => setShippingData({...shippingData, city: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input
                  type="text"
                  value={shippingData.state}
                  onChange={(e) => setShippingData({...shippingData, state: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Postal Code *</label>
                <input
                  type="text"
                  value={shippingData.postalCode}
                  onChange={(e) => setShippingData({...shippingData, postalCode: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Country *</label>
              <select
                value={shippingData.country}
                onChange={(e) => setShippingData({...shippingData, country: e.target.value})}
                required
              >
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isProcessing}
            >
              {isProcessing ? 'Saving...' : 'Continue to Payment'}
            </button>
          </form>
        </div>
      )}
      
      {step === 2 && (
        <div className="step-content">
          <h3>💳 Payment Information</h3>
          <form onSubmit={handlePaymentSubmit} className="payment-form">
            <div className="payment-methods">
              <label className="payment-method">
                <input
                  type="radio"
                  value="credit_card"
                  checked={paymentMethod === 'credit_card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Credit Card</span>
              </label>
              <label className="payment-method">
                <input
                  type="radio"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>PayPal</span>
              </label>
            </div>
            
            <div className="payment-simulation">
              <p className="notice">
                🔧 <strong>Development Mode:</strong> This is a simulated payment for testing purposes.
              </p>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : `Pay $${purchase.totalAmount.toFixed(2)}`}
            </button>
          </form>
        </div>
      )}
      
      {step === 3 && (
        <div className="step-content">
          <div className="completion-message">
            <h3>🎉 Purchase Complete!</h3>
            <p>Thank you for your purchase! The artist has been notified and will prepare your artwork for shipping.</p>
            
            <div className="next-steps">
              <h4>What happens next:</h4>
              <ul>
                <li>The artist will prepare your artwork for shipping</li>
                <li>You'll receive tracking information once it's shipped</li>
                <li>Estimated delivery: 5-10 business days</li>
              </ul>
            </div>
            
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Return to Browse Artworks
            </button>
          </div>
        </div>
      )}
      
      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-panel" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', fontSize: '0.8rem' }}>
          <details>
            <summary>🔧 Development Debug Info</summary>
            <pre>{JSON.stringify({ 
              auctionId, 
              step, 
              status: purchase?.status,
              isAuthenticated,
              currentUserId: currentUser?._id,
              winnerId: purchase?.winner?._id
            }, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default AuctionPurchase;