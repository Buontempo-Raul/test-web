// src/pages/Shop/ProductDetail.js - Replace emojis with proper icons
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { artworkAPI, auctionAPI } from '../../services/api';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  
  // State management
  const [artwork, setArtwork] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  
  // Auction states
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isAuctionActive, setIsAuctionActive] = useState(true);

  // Fetch artwork data
  useEffect(() => {
    const fetchArtwork = async () => {
      if (!id) {
        setError('No artwork ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await artworkAPI.getArtworkById(id);
        
        if (response.data.success) {
          const artworkData = response.data.artwork;
          setArtwork(artworkData);
          
          // Set initial bid amount to starting price + minimum increment
          const nextMinBid = artworkData.currentBid ? artworkData.currentBid + 5 : artworkData.price + 5;
          setBidAmount(nextMinBid.toFixed(2));
          
          // Update page title
          document.title = `${artworkData.title} | Uncreated Auction`;
          
          // If artwork has auction data, process it
          if (artworkData.auction) {
            setBidHistory(artworkData.auction.bids || []);
            checkAuctionStatus(artworkData.auction.endTime);
            
            // Fetch latest bid history from API
            try {
              const bidResponse = await auctionAPI.getBidHistory(id, { limit: 10 });
              if (bidResponse.data.success) {
                setBidHistory(bidResponse.data.bids);
              }
            } catch (bidError) {
              console.log('Could not fetch bid history:', bidError);
            }
          } else {
            // Create initial auction data (7 days from now)
            const endTime = new Date();
            endTime.setDate(endTime.getDate() + 7);
            checkAuctionStatus(endTime);
          }
        } else {
          throw new Error(response.data.message || 'Artwork not found');
        }
      } catch (error) {
        console.error('Error fetching artwork:', error);
        setError(error.response?.data?.message || error.message || 'Failed to load artwork');
        
        // Navigate to 404 if artwork not found
        if (error.response?.status === 404) {
          navigate('/not-found');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtwork();
  }, [id, navigate]);

  // Auction timer
  useEffect(() => {
    if (!artwork?.auction?.endTime) return;

    const timer = setInterval(() => {
      checkAuctionStatus(artwork.auction.endTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [artwork?.auction?.endTime]);

  const checkAuctionStatus = (endTime) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const difference = end - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      setIsAuctionActive(true);
    } else {
      setTimeRemaining('Auction Ended');
      setIsAuctionActive(false);
    }
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please log in to place a bid');
      return;
    }

    if (!isAuctionActive) {
      alert('This auction has ended');
      return;
    }

    const bidValue = parseFloat(bidAmount);
    const currentHighest = artwork.currentBid || artwork.price;

    console.log('Submitting bid:', { bidValue, currentHighest, artworkId: id });

    if (bidValue <= currentHighest) {
      alert(`Bid must be higher than $${currentHighest.toFixed(2)}`);
      return;
    }

    if (bidValue < currentHighest + 5) {
      alert('Bid must be at least $5 higher than current bid');
      return;
    }

    setIsPlacingBid(true);

    try {
      console.log('Making API call to place bid...');
      const response = await auctionAPI.placeBid(id, bidValue);
      console.log('Bid response:', response.data);
      
      if (response.data.success) {
        // Update local state with real response data
        setBidHistory(response.data.bidHistory || []);
        setArtwork(prev => ({
          ...prev,
          currentBid: response.data.currentBid,
          highestBidder: currentUser._id,
          auction: {
            ...prev.auction,
            currentBid: response.data.currentBid,
            highestBidder: currentUser._id,
            bids: response.data.bidHistory || []
          }
        }));

        // Set next minimum bid
        setBidAmount((response.data.currentBid + 5).toFixed(2));
        
        alert('Bid placed successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to place bid');
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      console.error('Error details:', error.response?.data);
      alert(error.response?.data?.message || error.message || 'Failed to place bid. Please try again.');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const getCurrentPrice = () => {
    return artwork.currentBid || artwork.price;
  };

  const getNextMinimumBid = () => {
    return getCurrentPrice() + 5;
  };

  const isHighestBidder = () => {
    return isAuthenticated && artwork.highestBidder === currentUser?._id;
  };

  const isArtworkOwner = () => {
    return isAuthenticated && artwork.creator._id === currentUser?._id;
  };

  if (isLoading) {
    return (
      <div className="product-loading">
        <div className="loading-spinner"></div>
        <p>Loading artwork details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-error">
        <h2>Error Loading Artwork</h2>
        <p>{error}</p>
        <Link to="/shop" className="back-to-shop">Back to Shop</Link>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="product-not-found">
        <h2>Artwork Not Found</h2>
        <p>The artwork you're looking for doesn't exist or has been removed.</p>
        <Link to="/shop" className="back-to-shop">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      {/* Breadcrumbs */}
      <nav className="product-breadcrumbs">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <Link to={`/shop?category=${artwork.category}`}>
          {artwork.category.charAt(0).toUpperCase() + artwork.category.slice(1)}
        </Link>
        <span>/</span>
        <span>{artwork.title}</span>
      </nav>
      
      <div className="product-main">
        {/* Image Gallery */}
        <div className="product-gallery">
          <div className="main-image-container">
            <motion.img 
              src={artwork.images[activeImage] || '/api/placeholder/600/600'} 
              alt={artwork.title}
              className="main-image"
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onError={(e) => {
                e.target.src = '/api/placeholder/600/600';
              }}
            />
            
            {artwork.isSold && (
              <div className="sold-overlay-large">
                <span>SOLD</span>
              </div>
            )}
          </div>
          
          {artwork.images && artwork.images.length > 1 && (
            <div className="image-thumbnails">
              {artwork.images.map((image, index) => (
                <div 
                  key={index}
                  className={`thumbnail ${index === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img 
                    src={image || '/api/placeholder/100/100'} 
                    alt={`${artwork.title} ${index + 1}`}
                    onError={(e) => {
                      e.target.src = '/api/placeholder/100/100';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="product-info">
          <div className="product-header">
            <h1 className="product-title">{artwork.title}</h1>
            <div className="product-artist">
              <span>by </span>
              <Link to={`/profile/${artwork.creator.username}`} className="artist-link">
                {artwork.creator.username}
              </Link>
              {artwork.creator.isArtist && (
                <svg className="verified-artist-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
                  <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
                  <path d="M12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
                  <path d="M12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
                </svg>
              )}
            </div>
          </div>

          {artwork.description && (
            <div className="product-description">
              <h3>Description</h3>
              <p>{artwork.description}</p>
            </div>
          )}

          {/* Auction Section */}
          <div className="auction-section">
            <div className="auction-header">
              <h2>Live Auction</h2>
              <div className={`auction-status ${isAuctionActive ? 'active' : 'ended'}`}>
                <svg className="auction-status-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                {isAuctionActive ? 'Live' : 'Ended'}
              </div>
            </div>

            <div className="auction-timer">
              <span className="timer-label">Time Remaining:</span>
              <span className={`timer-value ${!isAuctionActive ? 'ended' : ''}`}>
                {timeRemaining}
              </span>
            </div>

            <div className="price-section">
              <div className="current-price">
                <span className="price-label">Current Bid:</span>
                <span className="price-value">${getCurrentPrice().toFixed(2)}</span>
              </div>
            </div>

            {/* Bidding Form */}
            {isAuctionActive && !isArtworkOwner() && (
              <form onSubmit={handleBidSubmit} className="bid-form">
                <div className="bid-input-group">
                  <label htmlFor="bidAmount">Your Bid ($):</label>
                  <input
                    type="number"
                    id="bidAmount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min={getNextMinimumBid()}
                    step="0.01"
                    disabled={isPlacingBid}
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className={`bid-button ${isHighestBidder() ? 'highest-bidder' : ''}`}
                  disabled={isPlacingBid || !isAuthenticated}
                >
                  {isPlacingBid ? 'Placing Bid...' : 
                   isHighestBidder() ? 'Increase Your Bid' : 'Place Bid'}
                </button>
                
                {!isAuthenticated && (
                  <p className="login-prompt">
                    <Link to="/login">Log in</Link> to place a bid
                  </p>
                )}
                
                {isHighestBidder() && (
                  <p className="highest-bidder-notice">
                    <svg className="crown-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C6 4 6 6 6 6s0-2 1.5-2 1.5 2 1.5 2 0-2 1.5-2 1.5 2 1.5 2 0-2 1.5-2 1.5 2 1.5 2 0-2 1.5-2a2.5 2.5 0 0 1 0 5H18l-1.5 9H7.5L6 9Z"/>
                    </svg>
                    You are currently the highest bidder!
                  </p>
                )}
              </form>
            )}

            {isArtworkOwner() && (
              <div className="owner-notice">
                <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                This is your artwork. You cannot bid on your own items.
              </div>
            )}

            {!isAuctionActive && (
              <div className="auction-ended">
                <h3>Auction Ended</h3>
                {bidHistory.length > 0 ? (
                  <p>
                    <svg className="trophy-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C6 4 6 6 6 6s0-2 1.5-2 1.5 2 1.5 2 0-2 1.5-2 1.5 2 1.5 2 0-2 1.5-2 1.5 2 1.5 2 0-2 1.5-2a2.5 2.5 0 0 1 0 5H18l-1.5 9H7.5L6 9Z"/>
                    </svg>
                    Winner: <strong>{bidHistory[0].bidder.username}</strong> 
                    with a bid of <strong>${bidHistory[0].amount.toFixed(2)}</strong>
                  </p>
                ) : (
                  <p>No bids were placed for this auction.</p>
                )}
              </div>
            )}
          </div>

          {/* Bid History */}
          <div className="bid-history">
            <h3>Bid History</h3>
            {bidHistory.length > 0 ? (
              <div className="bid-list">
                <AnimatePresence>
                  {bidHistory.slice(0, 10).map((bid, index) => (
                    <motion.div
                      key={bid.id}
                      className={`bid-item ${index === 0 ? 'highest' : ''}`}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bid-info">
                        <span className="bidder">{bid.bidder.username}</span>
                        <span className="bid-amount">${bid.amount.toFixed(2)}</span>
                      </div>
                      <div className="bid-time">
                        {new Date(bid.timestamp).toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <p className="no-bids">No bids yet. Be the first to bid!</p>
            )}
          </div>

          {/* Artwork Details */}
          <div className="artwork-details">
            <h3>Artwork Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">
                  {artwork.category.charAt(0).toUpperCase() + artwork.category.slice(1)}
                </span>
              </div>
              
              {artwork.medium && (
                <div className="detail-item">
                  <span className="detail-label">Medium:</span>
                  <span className="detail-value">{artwork.medium}</span>
                </div>
              )}
              
              <div className="detail-item">
                <span className="detail-label">Views:</span>
                <span className="detail-value">
                  <svg className="views-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {artwork.views || 0}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Likes:</span>
                <span className="detail-value">
                  <svg className="likes-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {artwork.likes || 0}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Listed:</span>
                <span className="detail-value">
                  {new Date(artwork.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {artwork.tags && artwork.tags.length > 0 && (
            <div className="artwork-tags">
              <h3>Tags</h3>
              <div className="tag-list">
                {artwork.tags.map((tag, index) => (
                  <Link 
                    key={index} 
                    to={`/shop?search=${tag}`} 
                    className="tag"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;