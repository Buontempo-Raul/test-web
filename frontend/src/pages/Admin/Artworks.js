import React, { useState, useEffect } from 'react';

// Import the admin API service
const adminAPI = {
  getAllArtworks: (params = {}) => {
    const { page = 1, limit = 10, search = '', category = '', status = '' } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      category,
      status
    });
    
    return fetch(`/api/admin/artworks?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
  },

  deleteArtwork: (artworkId) => {
    return fetch(`/api/admin/artworks/${artworkId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
  }
};

const AdminArtworks = () => {
  const [artworks, setArtworks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [showArtworkModal, setShowArtworkModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchArtworks();
  }, [searchTerm, filterCategory, filterStatus, pagination.current]);

  const fetchArtworks = async () => {
    try {
      setIsLoading(true);
      
      const response = await adminAPI.getAllArtworks({
        page: pagination.current,
        limit: 10,
        search: searchTerm,
        category: filterCategory,
        status: filterStatus
      });

      if (response.success) {
        setArtworks(response.artworks);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch artworks');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching artworks:', error);
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getArtworkStatus = (artwork) => {
    if (artwork.auction.isActive) {
      return { status: 'auction', color: '#f39c12', text: 'Live Auction' };
    }
    if (artwork.forSale) {
      return { status: 'for-sale', color: '#27ae60', text: 'For Sale' };
    }
    return { status: 'not-for-sale', color: '#95a5a6', text: 'Not For Sale' };
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

      if (response.success) {
        console.log('Artwork deleted successfully:', response);
        // Remove from local state
        setArtworks(artworks.filter(artwork => artwork._id !== selectedArtwork._id));
        setShowDeleteModal(false);
        setSelectedArtwork(null);
      } else {
        throw new Error(response.message || 'Failed to delete artwork');
      }
    } catch (error) {
      console.error('Error deleting artwork:', error);
      // You could show an error message to the user here
    }
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading artworks...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Artworks Management</h1>
        <p>Monitor and manage artworks across the platform</p>
      </div>

      <div className="admin-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search artworks, artists, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="painting">Painting</option>
            <option value="digital">Digital Art</option>
            <option value="photography">Photography</option>
            <option value="sculpture">Sculpture</option>
            <option value="drawing">Drawing</option>
            <option value="mixed">Mixed Media</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="for-sale">For Sale</option>
            <option value="auction">Live Auction</option>
            <option value="not-for-sale">Not For Sale</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Artwork</th>
              <th>Artist</th>
              <th>Category</th>
              <th>Price/Bid</th>
              <th>Status</th>
              <th>Engagement</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {artworks.map(artwork => {
              const status = getArtworkStatus(artwork);
              return (
                <tr key={artwork._id}>
                  <td>
                    <div className="artwork-preview">
                      <div className="artwork-image">
                        <img 
                          src={artwork.images[0]} 
                          alt={artwork.title}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0zMCA0MS4yNUMzNi4yMTMyIDQxLjI1IDQxLjI1IDM2LjIxMzIgNDEuMjUgMzBDNDEuMjUgMjMuNzg2OCAzNi4yMTMyIDE4Ljc1IDMwIDE4Ljc1QzIzLjc4NjggMTguNzUgMTguNzUgMjMuNzg2OCAxOC43NSAzMEMxOC43NSAzNi4yMTMyIDIzLjc4NjggNDEuMjUgMzAgNDEuMjVaIiBmaWxsPSIjNkM3NTdEIi8+Cjwvc3ZnPg==';
                          }}
                        />
                      </div>
                      <div className="artwork-info">
                        <div className="artwork-title">{artwork.title}</div>
                        <div className="artwork-tags">
                          {artwork.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="tag">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="creator-info">
                      <div className="creator-avatar">
                        {artwork.creator.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="creator-name">{artwork.creator.username}</div>
                        <div className="creator-email">{artwork.creator.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="category-info">
                      <span className="category-icon">{getCategoryIcon(artwork.category)}</span>
                      <span className="category-name">{artwork.category}</span>
                    </div>
                  </td>
                  <td>
                    <div className="price-info">
                      {artwork.auction.isActive ? (
                        <div>
                          <div className="current-bid">{formatCurrency(artwork.auction.currentBid)}</div>
                          <div className="bid-label">Current Bid</div>
                        </div>
                      ) : artwork.forSale ? (
                        <div>
                          <div className="price">{formatCurrency(artwork.price)}</div>
                          <div className="price-label">Fixed Price</div>
                        </div>
                      ) : (
                        <div className="not-for-sale">Not For Sale</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.text}
                    </span>
                  </td>
                  <td>
                    <div className="engagement-stats">
                      <div className="stat">
                        <span className="stat-icon">❤️</span>
                        <span>{artwork.likes}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-icon">👁️</span>
                        <span>{artwork.views}</span>
                      </div>
                    </div>
                  </td>
                  <td>{formatDate(artwork.createdAt)}</td>
                  <td className="action-buttons">
                    <button
                      className="view-button"
                      onClick={() => handleViewArtwork(artwork)}
                    >
                      View
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteClick(artwork)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Artwork Details Modal */}
      {showArtworkModal && selectedArtwork && (
        <div className="modal-overlay" onClick={() => setShowArtworkModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Artwork Details</h3>
              <button onClick={() => setShowArtworkModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <div className="artwork-detail">
                <div className="artwork-detail-image">
                  <img 
                    src={selectedArtwork.images[0]} 
                    alt={selectedArtwork.title}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0xNTAgMjA2LjI1QzE4MS4wNjYgMjA2LjI1IDIwNi4yNSAxODEuMDY2IDIwNi4yNSAxNTBDMjA2LjI1IDExOC45MzQgMTgxLjA2NiA5My43NSAxNTAgOTMuNzVDMTE4LjkzNCA5My43NSA5My43NSAxMTguOTM0IDkzLjc1IDE1MEM5My43NSAxODEuMDY2IDExOC45MzQgMjA2LjI1IDE1MCAyMDYuMjVaIiBmaWxsPSIjNkM3NTdEIi8+Cjwvc3ZnPg==';
                    }}
                  />
                </div>
                <div className="artwork-detail-content">
                  <div className="detail-section">
                    <h4>Title</h4>
                    <p>{selectedArtwork.title}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Artist</h4>
                    <div className="creator-info">
                      <div className="creator-avatar">
                        {selectedArtwork.creator.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="creator-name">{selectedArtwork.creator.username}</div>
                        <div className="creator-email">{selectedArtwork.creator.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Description</h4>
                    <p>{selectedArtwork.description}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Category</h4>
                    <div className="category-info">
                      <span className="category-icon">{getCategoryIcon(selectedArtwork.category)}</span>
                      <span className="category-name">{selectedArtwork.category}</span>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Tags</h4>
                    <div className="artwork-tags">
                      {selectedArtwork.tags.map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Pricing & Status</h4>
                    <div className="pricing-detail">
                      {selectedArtwork.auction.isActive ? (
                        <div>
                          <div className="price-item">
                            <span className="price-label">Current Bid:</span>
                            <span className="price-value">{formatCurrency(selectedArtwork.auction.currentBid)}</span>
                          </div>
                          <div className="price-item">
                            <span className="price-label">Total Bids:</span>
                            <span className="price-value">{selectedArtwork.auction.bids.length}</span>
                          </div>
                          <div className="price-item">
                            <span className="price-label">Auction End:</span>
                            <span className="price-value">{formatDate(selectedArtwork.auction.endTime)}</span>
                          </div>
                        </div>
                      ) : selectedArtwork.forSale ? (
                        <div className="price-item">
                          <span className="price-label">Price:</span>
                          <span className="price-value">{formatCurrency(selectedArtwork.price)}</span>
                        </div>
                      ) : (
                        <div className="not-for-sale">This artwork is not for sale</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Engagement</h4>
                    <div className="engagement-detail">
                      <div className="engagement-item">
                        <span className="engagement-icon">❤️</span>
                        <span className="engagement-label">Likes:</span>
                        <span className="engagement-value">{selectedArtwork.likes}</span>
                      </div>
                      <div className="engagement-item">
                        <span className="engagement-icon">👁️</span>
                        <span className="engagement-label">Views:</span>
                        <span className="engagement-value">{selectedArtwork.views}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedArtwork.auction.isActive && selectedArtwork.auction.bids.length > 0 && (
                    <div className="detail-section">
                      <h4>Recent Bids</h4>
                      <div className="bids-list">
                        {selectedArtwork.auction.bids.slice(0, 3).map((bid, index) => (
                          <div key={index} className="bid-item">
                            <span className="bid-user">{bid.bidder.username}</span>
                            <span className="bid-amount">{formatCurrency(bid.amount)}</span>
                            <span className="bid-time">{formatDate(bid.bidTime)}</span>
                          </div>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Artwork</h3>
              <button onClick={() => setShowDeleteModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this artwork by <strong>{selectedArtwork.creator.username}</strong>?</p>
              <p className="warning-text">This action cannot be undone and will also remove any associated posts.</p>
              
              <div className="delete-preview">
                <div className="artwork-preview">
                  <div className="artwork-image">
                    <img 
                      src={selectedArtwork.images[0]} 
                      alt={selectedArtwork.title}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0zMCA0MS4yNUMzNi4yMTMyIDQxLjI1IDQxLjI1IDM2LjIxMzIgNDEuMjUgMzBDNDEuMjUgMjMuNzg2OCAzNi4yMTMyIDE4Ljc1IDMwIDE4Ljc1QzIzLjc4NjggMTguNzUgMTguNzUgMjMuNzg2OCAxOC43NSAzMEMxOC43NSAzNi4yMTMyIDIzLjc4NjggNDEuMjUgMzAgNDEuMjVaIiBmaWxsPSIjNkM3NTdEIi8+Cjwvc3ZnPg==';
                      }}
                    />
                  </div>
                  <div className="artwork-info">
                    <div className="artwork-title">{selectedArtwork.title}</div>
                    <div className="artwork-price">
                      {selectedArtwork.forSale ? formatCurrency(selectedArtwork.price) : 'Not for sale'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  onClick={handleDeleteConfirm} 
                  className="delete-confirm-button"
                >
                  Delete Artwork
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-page {
          padding: 0;
        }

        .admin-header {
          margin-bottom: 2rem;
        }

        .admin-header h1 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
        }

        .admin-header p {
          margin: 0;
          color: #7f8c8d;
        }

        .admin-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .filter-group {
          flex: 1;
          min-width: 200px;
        }

        .search-input,
        .filter-select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .search-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #667eea;
        }

        .admin-table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          background: #f8f9fa;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 2px solid #e9ecef;
        }

        .admin-table td {
          padding: 1rem;
          border-bottom: 1px solid #e9ecef;
          vertical-align: middle;
        }

        .admin-table tr:hover {
          background-color: #f8f9fa;
        }

        .artwork-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
          max-width: 300px;
        }

        .artwork-image {
          flex-shrink: 0;
        }

        .artwork-image img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
        }

        .artwork-info {
          flex: 1;
          min-width: 0;
        }

        .artwork-title {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .artwork-price {
          color: #27ae60;
          font-weight: 500;
        }

        .artwork-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .tag {
          background: #e9ecef;
          color: #6c757d;
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .creator-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .creator-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }

        .creator-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .creator-email {
          font-size: 0.9rem;
          color: #7f8c8d;
        }

        .category-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .category-icon {
          font-size: 1.2rem;
        }

        .category-name {
          font-weight: 500;
          text-transform: capitalize;
          color: #2c3e50;
        }

        .price-info {
          text-align: right;
        }

        .current-bid,
        .price {
          font-weight: 600;
          color: #27ae60;
          font-size: 1.1rem;
        }

        .bid-label,
        .price-label {
          font-size: 0.8rem;
          color: #7f8c8d;
          text-transform: uppercase;
        }

        .not-for-sale {
          color: #95a5a6;
          font-style: italic;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
        }

        .engagement-stats {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .stat-icon {
          font-size: 1rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .view-button,
        .delete-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-button {
          background: #3498db;
          color: white;
        }

        .view-button:hover {
          background: #2980b9;
        }

        .delete-button {
          background: #e74c3c;
          color: white;
        }

        .delete-button:hover {
          background: #c0392b;
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
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-content.large {
          max-width: 900px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e9ecef;
        }

        .modal-header h3 {
          margin: 0;
          color: #2c3e50;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #7f8c8d;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.3s ease;
        }

        .close-button:hover {
          background: #f8f9fa;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .artwork-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .artwork-detail-image img {
          width: 100%;
          max-width: 400px;
          height: auto;
          border-radius: 8px;
        }

        .detail-section {
          margin-bottom: 1.5rem;
        }

        .detail-section h4 {
          margin: 0 0 0.75rem 0;
          color: #2c3e50;
          font-size: 1rem;
        }

        .detail-section p {
          margin: 0;
          line-height: 1.5;
          color: #495057;
        }

        .pricing-detail {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .price-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-label {
          color: #6c757d;
        }

        .price-value {
          font-weight: 600;
          color: #2c3e50;
        }

        .engagement-detail {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .engagement-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .engagement-icon {
          font-size: 1.2rem;
        }

        .engagement-label {
          color: #6c757d;
          min-width: 60px;
        }

        .engagement-value {
          font-weight: 600;
          color: #2c3e50;
        }

        .bids-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .bid-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .bid-user {
          font-weight: 500;
        }

        .bid-amount {
          font-weight: 600;
          color: #27ae60;
        }

        .bid-time {
          font-size: 0.9rem;
          color: #7f8c8d;
        }

        .warning-text {
          color: #e74c3c;
          font-weight: 500;
          margin: 1rem 0;
        }

        .delete-preview {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .delete-confirm-button,
        .cancel-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .delete-confirm-button {
          background: #e74c3c;
          color: white;
        }

        .delete-confirm-button:hover {
          background: #c0392b;
        }

        .cancel-button {
          background: #e9ecef;
          color: #6c757d;
        }

        .cancel-button:hover {
          background: #dee2e6;
        }

        .admin-loading {
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
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .admin-filters {
            flex-direction: column;
          }

          .admin-table-container {
            overflow-x: auto;
          }

          .admin-table {
            min-width: 1000px;
          }

          .modal-content {
            width: 95%;
            margin: 1rem;
          }

          .artwork-detail {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminArtworks;