// frontend/src/pages/AuctionPurchase/AuctionPurchase.js
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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auction-purchases/${auctionId}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      const data = await response.json();
      
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
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load purchase information');
      console.error('Error fetching purchase:', err);
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
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="auction-purchase-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Return Home
          </button>
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
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Return Home
          </button>
        </div>
      </div>
    );
  }
  
  // Check if user is the winner (if logged in)
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
      
      {/* Artwork Info */}
      <div className="artwork-summary">
        <div className="artwork-image">
          {purchase.artwork.images && purchase.artwork.images.length > 0 && (
            <img 
              src={purchase.artwork.images[0]} 
              alt={purchase.artwork.title}
              onError={(e) => {
                e.target.src = '/api/placeholder/300/200';
              }}
            />
          )}
        </div>
        <div className="artwork-details">
          <h2>{purchase.artwork.title}</h2>
          <p className="artist">by {purchase.artist.username}</p>
          <p className="description">{purchase.artwork.description}</p>
        </div>
      </div>
      
      {/* Purchase Summary */}
      <div className="purchase-summary">
        <h3>Purchase Summary</h3>
        <div className="summary-row">
          <span>Winning Bid:</span>
          <span>${purchase.winningBid.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Platform Fee (5%):</span>
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
      
      {/* Step Content */}
      {step === 1 && (
        <div className="step-content">
          <h3>📦 Shipping Address</h3>
          
          {!isAuthenticated && (
            <div className="login-notice">
              <p>Please <a href="/login">log in</a> to continue with your purchase.</p>
            </div>
          )}
          
          {isAuthenticated && (
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
                  <label>State/Province *</label>
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
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
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
          )}
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
            
            {paymentMethod === 'credit_card' && (
              <div className="credit-card-form">
                <div className="form-group">
                  <label>Card Number *</label>
                  <input type="text" placeholder="1234 5678 9012 3456" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date *</label>
                    <input type="text" placeholder="MM/YY" required />
                  </div>
                  <div className="form-group">
                    <label>CVV *</label>
                    <input type="text" placeholder="123" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Cardholder Name *</label>
                  <input type="text" required />
                </div>
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary payment-button"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : `Pay $${purchase.totalAmount.toFixed(2)}`}
            </button>
          </form>
        </div>
      )}
      
      {step === 3 && (
        <div className="step-content completion-step">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h3>Payment Successful!</h3>
            <p>Your purchase has been completed successfully.</p>
          </div>
          
          <div className="next-steps">
            <h4>What happens next?</h4>
            <ol>
              <li>The artist has been notified of your payment</li>
              <li>They will prepare and ship your artwork</li>
              <li>You'll receive tracking information once shipped</li>
              <li>Enjoy your new artwork!</li>
            </ol>
          </div>
          
          {purchase.trackingNumber && (
            <div className="tracking-info">
              <h4>📦 Tracking Information</h4>
              <p><strong>Carrier:</strong> {purchase.shippingCarrier}</p>
              <p><strong>Tracking Number:</strong> {purchase.trackingNumber}</p>
            </div>
          )}
          
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-primary"
          >
            Return Home
          </button>
        </div>
      )}
    </div>
  );
};

export default AuctionPurchase;