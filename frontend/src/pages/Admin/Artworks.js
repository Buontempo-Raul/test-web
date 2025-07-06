// Beautiful AdminArtworks Component - frontend/src/pages/Admin/Artworks.js
import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';

const AdminArtworks = () => {
  const [artworks, setArtworks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [showArtworkModal, setShowArtworkModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getAllArtworks();

      if (response.data.success) {
        setArtworks(response.data.artworks);
        console.log('✅ Artworks loaded:', response.data.artworks.length);
      } else {
        console.error('Failed to fetch artworks:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getArtworkStatus = (artwork) => {
    if (artwork.auction && artwork.auction.isActive) {
      return { status: 'auction', color: '#e74c3c', text: 'Live Auction', icon: '🔥' };
    }
    if (artwork.forSale) {
      return { status: 'for-sale', color: '#27ae60', text: 'For Sale', icon: '💰' };
    }
    return { status: 'not-for-sale', color: '#95a5a6', text: 'Not For Sale', icon: '📱' };
  };

  const getCategoryIcon = (category) => {
    const icons = {
      painting: '🎨',
      digital: '💻',
      photography: '📸',
      sculpture: '🗿',
      drawing: '✏️',
      mixed: '🎭'
    };
    return icons[category] || '🎨';
  };

  const getAuctionInfo = (artwork) => {
    if (!artwork.auction) {
      return {
        hasAuction: false,
        currentBid: null,
        bidCount: 0,
        status: 'No Auction'
      };
    }

    return {
      hasAuction: true,
      currentBid: artwork.auction.currentBid,
      bidCount: artwork.auction.bids ? artwork.auction.bids.length : 0,
      status: artwork.auction.isActive ? 'Active' : 'Ended',
      startTime: artwork.auction.startTime,
      endTime: artwork.auction.endTime
    };
  };

  const handleViewArtwork = (artwork) => {
    setSelectedArtwork(artwork);
    setShowArtworkModal(true);
  };

  const handleDeleteClick = (artwork) => {
    setSelectedArtwork(artwork);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await adminAPI.deleteArtwork(selectedArtwork._id);

      if (response.data.success) {
        setArtworks(artworks.filter(artwork => artwork._id !== selectedArtwork._id));
        setShowDeleteModal(false);
        setSelectedArtwork(null);
      } else {
        throw new Error(response.data.message || 'Failed to delete artwork');
      }
    } catch (error) {
      console.error('Error deleting artwork:', error);
      alert('Failed to delete artwork. Please try again.');
    }
  };

  const filteredArtworks = artworks.filter(artwork => {
    if (filters.category && artwork.category !== filters.category) return false;
    if (filters.status === 'auction' && (!artwork.auction || !artwork.auction.isActive)) return false;
    if (filters.status === 'for-sale' && !artwork.forSale) return false;
    if (filters.status === 'not-for-sale' && artwork.forSale) return false;
    if (filters.search && !artwork.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="admin-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading artworks...</h2>
          <p>Fetching artwork data from database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>🎨 Artworks Management</h1>
          <p>Monitor and manage platform artworks</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchArtworks}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-header">
            <div className="stat-icon">🎨</div>
            <div className="stat-info">
              <h3>Total Artworks</h3>
              <div className="stat-value">{artworks.length}</div>
            </div>
          </div>
        </div>
        
        <div className="stat-card auctions">
          <div className="stat-header">
            <div className="stat-icon">🔥</div>
            <div className="stat-info">
              <h3>Live Auctions</h3>
              <div className="stat-value">
                {artworks.filter(artwork => artwork.auction && artwork.auction.isActive).length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="stat-card for-sale">
          <div className="stat-header">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>For Sale</h3>
              <div className="stat-value">
                {artworks.filter(artwork => artwork.forSale).length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="stat-card views">
          <div className="stat-header">
            <div className="stat-icon">👁️</div>
            <div className="stat-info">
              <h3>Total Views</h3>
              <div className="stat-value">
                {artworks.reduce((total, artwork) => total + (artwork.views || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-container">
          <div className="filter-group">
            <label>🔍 Search</label>
            <input
              type="text"
              placeholder="Search artworks..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label>📂 Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="painting">🎨 Painting</option>
              <option value="digital">💻 Digital</option>
              <option value="photography">📸 Photography</option>
              <option value="sculpture">🗿 Sculpture</option>
              <option value="drawing">✏️ Drawing</option>
              <option value="mixed">🎭 Mixed Media</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>🏷️ Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="auction">🔥 Live Auction</option>
              <option value="for-sale">💰 For Sale</option>
              <option value="not-for-sale">📱 Not For Sale</option>
            </select>
          </div>
          
          <button
            className="clear-filters-btn"
            onClick={() => setFilters({category: '', status: '', search: ''})}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Artworks Grid */}
      <div className="artworks-section">
        <div className="section-header">
          <h2>📋 Artworks ({filteredArtworks.length})</h2>
        </div>
        
        {filteredArtworks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎨</div>
            <h3>No artworks found</h3>
            <p>Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="artworks-grid">
            {filteredArtworks.map(artwork => {
              const status = getArtworkStatus(artwork);
              const auctionInfo = getAuctionInfo(artwork);
              
              return (
                <div key={artwork._id} className="artwork-card">
                  <div className="artwork-image-container">
                    <img 
                      src={artwork.images && artwork.images[0] ? artwork.images[0] : '/default-artwork.jpg'} 
                      alt={artwork.title}
                      className="artwork-image"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0xMDAgMTM3LjVDMTIwLjcxIDEzNy41IDEzNy41IDEyMC43MSAxMzcuNSAxMDBDMTM3LjUgNzkuMjg5MyAxMjAuNzEgNjIuNSAxMDAgNjIuNUM3OS4yODkzIDYyLjUgNjIuNSA3OS4yODkzIDYyLjUgMTAwQzYyLjUgMTIwLjcxIDc5LjI4OTMgMTM3LjUgMTAwIDEzNy41WiIgZmlsbD0iIzZDNzU3RCIvPgo8L3N2Zz4K';
                      }}
                    />
                    <div className="artwork-overlay">
                      <div className="overlay-actions">
                        <button 
                          className="overlay-btn view"
                          onClick={() => handleViewArtwork(artwork)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button 
                          className="overlay-btn delete"
                          onClick={() => handleDeleteClick(artwork)}
                          title="Delete Artwork"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="status-badge" style={{ backgroundColor: status.color }}>
                      {status.icon} {status.text}
                    </div>
                    
                    {auctionInfo.hasAuction && auctionInfo.status === 'Active' && (
                      <div className="auction-badge">
                        🔥 LIVE AUCTION
                      </div>
                    )}
                  </div>
                  
                  <div className="artwork-content">
                    <div className="artwork-header">
                      <h3 className="artwork-title">{artwork.title || 'Untitled'}</h3>
                      <div className="artwork-category">
                        {getCategoryIcon(artwork.category)} {artwork.category || 'Other'}
                      </div>
                    </div>
                    
                    <div className="artwork-artist">
                      <div className="artist-avatar">
                        {artwork.creator?.username ? artwork.creator.username.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="artist-info">
                        <div className="artist-name">{artwork.creator?.username || 'Unknown'}</div>
                        {/* <div className="artist-email">{artwork.creator?.email || 'No email'}</div> */}
                      </div>
                    </div>
                    
                    <div className="artwork-price">
                      {auctionInfo.hasAuction && auctionInfo.status === 'Active' ? (
                        <div>
                          <div className="current-bid">{formatCurrency(auctionInfo.currentBid || artwork.price)}</div>
                          <div className="bid-info">
                            {auctionInfo.currentBid ? `Current bid • ${auctionInfo.bidCount} bids` : 'Starting price'}
                          </div>
                        </div>
                      ) : artwork.forSale ? (
                        <div>
                          <div className="fixed-price">{formatCurrency(artwork.price)}</div>
                          <div className="price-info">Fixed price</div>
                        </div>
                      ) : (
                        <div className="not-for-sale-price">Not for sale</div>
                      )}
                    </div>
                    
                    <div className="artwork-stats">
                      <div className="stat-item">
                        <span className="stat-icon">👁️</span>
                        <span className="stat-text">{artwork.views || 0} views</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon">📅</span>
                        <span className="stat-text">{formatDate(artwork.createdAt)}</span>
                      </div>
                    </div>
                    
                    {artwork.tags && artwork.tags.length > 0 && (
                      <div className="artwork-tags">
                        {artwork.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="tag">#{tag}</span>
                        ))}
                        {artwork.tags.length > 3 && (
                          <span className="tag-more">+{artwork.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Artwork Details Modal */}
      {showArtworkModal && selectedArtwork && (
        <div className="modal-overlay" onClick={() => setShowArtworkModal(false)}>
          <div className="modal-content artwork-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎨 Artwork Details</h3>
              <button 
                className="modal-close"
                onClick={() => setShowArtworkModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="artwork-detail-layout">
                <div className="artwork-image-section">
                  <img 
                    src={selectedArtwork.images && selectedArtwork.images[0] ? selectedArtwork.images[0] : '/default-artwork.jpg'} 
                    alt={selectedArtwork.title}
                    className="detail-image"
                  />
                </div>
                <div className="artwork-info-section">
                  <h2>{selectedArtwork.title || 'Untitled'}</h2>
                  
                  <div className="detail-group">
                    <h4>👤 Artist Information</h4>
                    <p><strong>Name:</strong> {selectedArtwork.creator?.username || 'Unknown'}</p>
                    {/* <p><strong>Email:</strong> {selectedArtwork.creator?.email || 'No email'}</p> */}
                  </div>
                  
                  <div className="detail-group">
                    <h4>🎨 Artwork Details</h4>
                    <p><strong>Category:</strong> {getCategoryIcon(selectedArtwork.category)} {selectedArtwork.category || 'Other'}</p>
                    <p><strong>Price:</strong> {formatCurrency(selectedArtwork.price)}</p>
                    <p><strong>Views:</strong> {selectedArtwork.views || 0}</p>
                    <p><strong>Created:</strong> {formatDate(selectedArtwork.createdAt)}</p>
                    <p><strong>For Sale:</strong> {selectedArtwork.forSale ? '✅ Yes' : '❌ No'}</p>
                  </div>
                  
                  {selectedArtwork.auction && (
                    <div className="detail-group auction-info">
                      <h4>🔨 Auction Information</h4>
                      <p><strong>Status:</strong> {selectedArtwork.auction.isActive ? '🔥 Active' : '⏰ Ended'}</p>
                      <p><strong>Starting Price:</strong> {formatCurrency(selectedArtwork.auction.startingPrice)}</p>
                      <p><strong>Current Bid:</strong> {formatCurrency(selectedArtwork.auction.currentBid)}</p>
                      <p><strong>Total Bids:</strong> {selectedArtwork.auction.bids ? selectedArtwork.auction.bids.length : 0}</p>
                      {selectedArtwork.auction.startTime && (
                        <p><strong>Started:</strong> {formatDate(selectedArtwork.auction.startTime)}</p>
                      )}
                      {selectedArtwork.auction.endTime && (
                        <p><strong>Ends:</strong> {formatDate(selectedArtwork.auction.endTime)}</p>
                      )}
                    </div>
                  )}
                  
                  {selectedArtwork.description && (
                    <div className="detail-group">
                      <h4>📝 Description</h4>
                      <p>{selectedArtwork.description}</p>
                    </div>
                  )}
                  
                  {selectedArtwork.tags && selectedArtwork.tags.length > 0 && (
                    <div className="detail-group">
                      <h4>🏷️ Tags</h4>
                      <div className="tags-container">
                        {selectedArtwork.tags.map(tag => (
                          <span key={tag} className="tag">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedArtwork && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirm Delete</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-confirmation">
                <div className="delete-icon">🗑️</div>
                <h3>Delete Artwork?</h3>
                <p>Are you sure you want to delete "<strong>{selectedArtwork.title}</strong>"?</p>
                <p className="warning-text">This action cannot be undone and will permanently remove the artwork from the platform.</p>
                
                <div className="modal-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={handleDeleteConfirm}
                  >
                    Delete Artwork
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-container {
          padding: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
          background: #f8fafc;
          min-height: 100vh;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          background: white;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .header-content h1 {
          margin: 0 0 0.5rem 0;
          color: #1a202c;
          font-size: 2rem;
          font-weight: 700;
        }

        .header-content p {
          margin: 0;
          color: #718096;
          font-size: 1.1rem;
        }

        .refresh-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .refresh-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.2);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.2);
        }

        .stat-card.total { border-left: 4px solid #667eea; }
        .stat-card.auctions { border-left: 4px solid #e53e3e; }
        .stat-card.for-sale { border-left: 4px solid #38a169; }
        .stat-card.views { border-left: 4px solid #ed8936; }

        .stat-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          font-size: 2.5rem;
          opacity: 0.8;
        }

        .stat-info h3 {
          margin: 0 0 0.5rem 0;
          color: #4a5568;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
        }

        .filters-section {
          background: #7c3aed;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .filters-container {
          display: flex;
          gap: 1rem;
          align-items: end;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 150px;
        }

        .filter-group label {
          font-weight: 600;
          color:rgb(255, 255, 255);
          font-size: 0.9rem;
        }

        .filter-input, .filter-select {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: border-color 0.2s ease;
        }

        .filter-input:focus, .filter-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .clear-filters-btn {
          padding: 0.75rem 1rem;
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.2s ease;
          height: fit-content;
        }

        .clear-filters-btn:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .artworks-section {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .section-header {
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 1rem;
        }

        .section-header h2 {
          margin: 0;
          color: #1a202c;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #718096;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: #4a5568;
        }

        .artworks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .artwork-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
        }

        .artwork-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .artwork-image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .artwork-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .artwork-card:hover .artwork-image {
          transform: scale(1.05);
        }

        .artwork-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .artwork-card:hover .artwork-overlay {
          opacity: 1;
        }

        .overlay-actions {
          display: flex;
          gap: 1rem;
        }

        .overlay-btn {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s ease;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .overlay-btn:hover {
          background: white;
          transform: scale(1.1);
        }

        .overlay-btn.delete:hover {
          background: #fed7d7;
        }

        .status-badge {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .auction-badge {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          padding: 0.25rem 0.75rem;
          background: linear-gradient(135deg, #e53e3e 0%, #ff6b6b 100%);
          color: white;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .artwork-content {
          padding: 1.5rem;
        }

        .artwork-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 1rem;
        }

        .artwork-title {
          margin: 0;
          color: #1a202c;
          font-size: 1.1rem;
          font-weight: 600;
          line-height: 1.3;
        }

        .artwork-category {
          background: #edf2f7;
          color: #4a5568;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .artwork-artist {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .artist-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .artist-name {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.9rem;
        }

        .artist-email {
          color: #718096;
          font-size: 0.8rem;
        }

        .artwork-price {
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
          text-align: center;
        }

        .current-bid, .fixed-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: #38a169;
          margin-bottom: 0.25rem;
        }

        .bid-info, .price-info {
          color: #718096;
          font-size: 0.8rem;
        }

        .not-for-sale-price {
          color: #a0aec0;
          font-style: italic;
          font-weight: 500;
        }

        .artwork-stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #f7fafc;
          border-radius: 8px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stat-icon {
          opacity: 0.7;
        }

        .stat-text {
          color: #4a5568;
          font-size: 0.85rem;
        }

        .artwork-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag {
          background: #e2e8f0;
          color: #4a5568;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .tag-more {
          color: #718096;
          font-size: 0.75rem;
          font-style: italic;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .artwork-modal {
          // max-width: 900px;
        }

        .delete-modal {
          max-width: 500px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          color: #1a202c;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #718096;
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #f7fafc;
          color: #4a5568;
        }

        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
        }

        .artwork-detail-layout {
          display: flex;
          gap: 2rem;
        }

        .artwork-image-section {
          flex: 0 0 300px;
        }

        .detail-image {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 12px;
        }

        .artwork-info-section {
          flex: 1;
        }

        .artwork-info-section h2 {
          margin: 0 0 1.5rem 0;
          color: #1a202c;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .detail-group {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
        }

        .detail-group h4 {
          margin: 0 0 0.75rem 0;
          color: #2d3748;
          font-size: 1rem;
          font-weight: 600;
        }

        .detail-group p {
          margin: 0.5rem 0;
          color: #4a5568;
          line-height: 1.5;
        }

        .auction-info {
          border-left: 4px solid #e53e3e;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .delete-confirmation {
          text-align: center;
          padding: 1rem;
        }

        .delete-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.7;
        }

        .delete-confirmation h3 {
          margin: 0 0 1rem 0;
          color: #1a202c;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .delete-confirmation p {
          margin: 0.5rem 0;
          color: #4a5568;
          line-height: 1.5;
        }

        .warning-text {
          color: #e53e3e !important;
          font-weight: 600;
          margin-top: 1rem !important;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .btn-secondary {
          padding: 0.75rem 1.5rem;
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          color: #4a5568;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .btn-danger {
          padding: 0.75rem 1.5rem;
          background: #e53e3e;
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-danger:hover {
          background: #c53030;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .admin-container {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .filters-container {
            flex-direction: column;
          }

          .filter-group {
            min-width: 100%;
          }

          .artworks-grid {
            grid-template-columns: 1fr;
          }

          .artwork-detail-layout {
            flex-direction: column;
          }

          .artwork-image-section {
            flex: none;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminArtworks;