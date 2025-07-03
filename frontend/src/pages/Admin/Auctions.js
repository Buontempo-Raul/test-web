import React, { useState, useEffect } from 'react';

// Import the admin API service
const adminAPI = {
  getAllAuctions: (params = {}) => {
    const { page = 1, limit = 10, status = 'all' } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status
    });
    
    return fetch(`/api/admin/auctions?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
  }
};

const AdminAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchAuctions();
  }, [filterStatus, pagination.current]);

  const fetchAuctions = async () => {
    try {
      setIsLoading(true);
      
      const response = await adminAPI.getAllAuctions({
        page: pagination.current,
        limit: 10,
        status: filterStatus
      });

      if (response.success) {
        setAuctions(response.auctions);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch auctions');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return 'Auction ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getAuctionStatus = (auction) => {
    if (auction.auction.isActive) {
      const timeRemaining = getTimeRemaining(auction.auction.endTime);
      if (timeRemaining === 'Auction ended') {
        return { status: 'ended', color: '#95a5a6', text: 'Ended' };
      }
      return { status: 'active', color: '#27ae60', text: 'Live' };
    }
    return { status: 'ended', color: '#95a5a6', text: 'Ended' };
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

  const handleViewAuction = (auction) => {
    setSelectedAuction(auction);
    setShowAuctionModal(true);
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading auctions...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Auctions Management</h1>
        <p>Monitor live auctions, bid history, and winners</p>
      </div>

      <div className="admin-filters">
        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Auctions</option>
            <option value="active">Live Auctions</option>
            <option value="ended">Ended Auctions</option>
          </select>
        </div>

        <div className="auction-stats">
          <div className="stat-item">
            <span className="stat-label">Total Auctions:</span>
            <span className="stat-value">{auctions.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Live:</span>
            <span className="stat-value live">{auctions.filter(a => a.auction.isActive).length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Ended:</span>
            <span className="stat-value ended">{auctions.filter(a => !a.auction.isActive).length}</span>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Artwork</th>
              <th>Artist</th>
              <th>Category</th>
              <th>Current Bid</th>
              <th>Bids Count</th>
              <th>Status</th>
              <th>Time</th>
              <th>Winner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {auctions.map(auction => {
              const status = getAuctionStatus(auction);
              return (
                <tr key={auction._id}>
                  <td>
                    <div className="artwork-preview">
                      <div className="artwork-image">
                        <img 
                          src={auction.images[0]} 
                          alt={auction.title}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0zMCA0MS4yNUMzNi4yMTMyIDQxLjI1IDQxLjI1IDM2LjIxMzIgNDEuMjUgMzBDNDEuMjUgMjMuNzg2OCAzNi4yMTMyIDE4Ljc1IDMwIDE4Ljc1QzIzLjc4NjggMTguNzUgMTguNzUgMjMuNzg2OCAxOC43NSAzMEMxOC43NSAzNi4yMTMyIDIzLjc4NjggNDEuMjUgMzAgNDEuMjVaIiBmaWxsPSIjNkM3NTdEIi8+Cjwvc3ZnPg==';
                          }}
                        />
                      </div>
                      <div className="artwork-info">
                        <div className="artwork-title">{auction.title}</div>
                        <div className="starting-bid">
                          Starting: {formatCurrency(auction.auction.startingBid)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="creator-info">
                      <div className="creator-avatar">
                        {auction.creator.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="creator-name">{auction.creator.username}</div>
                        <div className="creator-email">{auction.creator.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="category-info">
                      <span className="category-icon">{getCategoryIcon(auction.category)}</span>
                      <span className="category-name">{auction.category}</span>
                    </div>
                  </td>
                  <td>
                    <div className="bid-info">
                      <div className="current-bid">{formatCurrency(auction.auction.currentBid)}</div>
                      <div className="bid-increase">
                        +{formatCurrency(auction.auction.currentBid - auction.auction.startingBid)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="bids-count">
                      <span className="count-number">{auction.auction.bids.length}</span>
                      <span className="count-label">bids</span>
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
                    <div className="time-info">
                      {auction.auction.isActive ? (
                        <div className="time-remaining">
                          {getTimeRemaining(auction.auction.endTime)}
                        </div>
                      ) : (
                        <div className="ended-time">
                          Ended: {formatDate(auction.auction.endTime)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {auction.winner ? (
                      <div className="winner-info">
                        <div className="winner-name">{auction.winner.bidder.username}</div>
                        <div className="winning-amount">{formatCurrency(auction.winner.amount)}</div>
                      </div>
                    ) : (
                      <div className="no-winner">-</div>
                    )}
                  </td>
                  <td className="action-buttons">
                    <button
                      className="view-button"
                      onClick={() => handleViewAuction(auction)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Auction Details Modal */}
      {showAuctionModal && selectedAuction && (
        <div className="modal-overlay" onClick={() => setShowAuctionModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Auction Details</h3>
              <button onClick={() => setShowAuctionModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <div className="auction-detail">
                <div className="auction-detail-left">
                  <div className="auction-detail-image">
                    <img 
                      src={selectedAuction.images[0]} 
                      alt={selectedAuction.title}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0xNTAgMjA2LjI1QzE4MS4wNjYgMjA2LjI1IDIwNi4yNSAxODEuMDY2IDIwNi4yNSAxNTBDMjA2LjI1IDExOC45MzQgMTgxLjA2NiA5My43NSAxNTAgOTMuNzVDMTE4LjkzNCA5My43NSA5My43NSAxMTguOTM0IDkzLjc1IDE1MEM5My43NSAxODEuMDY2IDExOC45MzQgMjA2LjI1IDE1MCAyMDYuMjVaIiBmaWxsPSIjNkM3NTdEIi8+Cjwvc3ZnPg==';
                      }}
                    />
                  </div>

                  <div className="auction-info-section">
                    <h4>Auction Information</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Status:</span>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getAuctionStatus(selectedAuction).color }}
                        >
                          {getAuctionStatus(selectedAuction).text}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Starting Bid:</span>
                        <span className="info-value">{formatCurrency(selectedAuction.auction.startingBid)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Current Bid:</span>
                        <span className="info-value current-bid">{formatCurrency(selectedAuction.auction.currentBid)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Total Bids:</span>
                        <span className="info-value">{selectedAuction.auction.bids.length}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Started:</span>
                        <span className="info-value">{formatDate(selectedAuction.auction.startTime)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Ends:</span>
                        <span className="info-value">{formatDate(selectedAuction.auction.endTime)}</span>
                      </div>
                      {selectedAuction.auction.isActive && (
                        <div className="info-item full-width">
                          <span className="info-label">Time Remaining:</span>
                          <span className="info-value time-remaining">{getTimeRemaining(selectedAuction.auction.endTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="auction-detail-right">
                  <div className="artwork-info-section">
                    <h4>Artwork Details</h4>
                    <div className="detail-section">
                      <p><strong>Title:</strong> {selectedAuction.title}</p>
                      <p><strong>Artist:</strong> {selectedAuction.creator.username}</p>
                      <p><strong>Category:</strong> {selectedAuction.category}</p>
                      <p><strong>Description:</strong> {selectedAuction.description}</p>
                    </div>
                  </div>

                  {selectedAuction.winner && (
                    <div className="winner-section">
                      <h4>🏆 Auction Winner</h4>
                      <div className="winner-details">
                        <div className="winner-info-item">
                          <span className="winner-label">Winner:</span>
                          <span className="winner-value">{selectedAuction.winner.bidder.username}</span>
                        </div>
                        <div className="winner-info-item">
                          <span className="winner-label">Winning Bid:</span>
                          <span className="winner-value winning-amount">{formatCurrency(selectedAuction.winner.amount)}</span>
                        </div>
                        <div className="winner-info-item">
                          <span className="winner-label">Won At:</span>
                          <span className="winner-value">{formatDate(selectedAuction.winner.bidTime)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bids-section">
                    <h4>Bid History ({selectedAuction.auction.bids.length} bids)</h4>
                    <div className="bids-list">
                      {selectedAuction.auction.bids.length > 0 ? (
                        selectedAuction.auction.bids.map((bid, index) => (
                          <div key={bid._id} className="bid-item">
                            <div className="bid-rank">#{index + 1}</div>
                            <div className="bid-info">
                              <div className="bid-user">{bid.bidder.username}</div>
                              <div className="bid-email">{bid.bidder.email}</div>
                            </div>
                            <div className="bid-amount">{formatCurrency(bid.amount)}</div>
                            <div className="bid-time">{formatDate(bid.bidTime)}</div>
                          </div>
                        ))
                      ) : (
                        <p className="no-bids">No bids placed yet</p>
                      )}
                    </div>
                  </div>
                </div>
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
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .filter-group {
          min-width: 200px;
        }

        .filter-select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: #667eea;
        }

        .auction-stats {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stat-label {
          color: #7f8c8d;
          font-weight: 500;
        }

        .stat-value {
          font-weight: 600;
          color: #2c3e50;
        }

        .stat-value.live {
          color: #27ae60;
        }

        .stat-value.ended {
          color: #95a5a6;
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
          margin-bottom: 0.25rem;
        }

        .starting-bid {
          font-size: 0.9rem;
          color: #7f8c8d;
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

        .bid-info {
          text-align: right;
        }

        .current-bid {
          font-weight: 600;
          color: #27ae60;
          font-size: 1.1rem;
        }

        .bid-increase {
          font-size: 0.8rem;
          color: #16a085;
        }

        .bids-count {
          text-align: center;
        }

        .count-number {
          display: block;
          font-weight: 600;
          font-size: 1.2rem;
          color: #2c3e50;
        }

        .count-label {
          font-size: 0.8rem;
          color: #7f8c8d;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
        }

        .time-info {
          font-size: 0.9rem;
        }

        .time-remaining {
          color: #e67e22;
          font-weight: 600;
        }

        .ended-time {
          color: #7f8c8d;
        }

        .winner-info {
          text-align: center;
        }

        .winner-name {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }

        .winning-amount {
          color: #27ae60;
          font-weight: 600;
        }

        .no-winner {
          text-align: center;
          color: #7f8c8d;
        }

        .action-buttons {
          text-align: center;
        }

        .view-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #3498db;
          color: white;
        }

        .view-button:hover {
          background: #2980b9;
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
          max-width: 1000px;
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

        .auction-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .auction-detail-image img {
          width: 100%;
          max-width: 400px;
          height: auto;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .auction-info-section,
        .artwork-info-section,
        .winner-section,
        .bids-section {
          margin-bottom: 1.5rem;
        }

        .auction-info-section h4,
        .artwork-info-section h4,
        .winner-section h4,
        .bids-section h4 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.1rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }

        .info-item.full-width {
          grid-column: 1 / -1;
        }

        .info-label {
          color: #6c757d;
          font-weight: 500;
        }

        .info-value {
          font-weight: 600;
          color: #2c3e50;
        }

        .info-value.current-bid {
          color: #27ae60;
          font-size: 1.1rem;
        }

        .info-value.time-remaining {
          color: #e67e22;
        }

        .detail-section p {
          margin: 0.5rem 0;
          line-height: 1.5;
        }

        .winner-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          border-left: 4px solid #f39c12;
        }

        .winner-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .winner-info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .winner-label {
          color: #6c757d;
          font-weight: 500;
        }

        .winner-value {
          font-weight: 600;
          color: #2c3e50;
        }

        .winner-value.winning-amount {
          color: #27ae60;
          font-size: 1.1rem;
        }

        .bids-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .bid-item {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: 1rem;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 6px;
          margin-bottom: 0.5rem;
        }

        .bid-rank {
          font-weight: 600;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .bid-info {
          min-width: 0;
        }

        .bid-user {
          font-weight: 600;
          color: #2c3e50;
        }

        .bid-email {
          font-size: 0.9rem;
          color: #7f8c8d;
        }

        .bid-amount {
          font-weight: 600;
          color: #27ae60;
        }

        .bid-time {
          font-size: 0.9rem;
          color: #7f8c8d;
        }

        .no-bids {
          color: #7f8c8d;
          font-style: italic;
          text-align: center;
          padding: 2rem;
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
            align-items: stretch;
          }

          .auction-stats {
            justify-content: space-between;
          }

          .admin-table-container {
            overflow-x: auto;
          }

          .admin-table {
            min-width: 1200px;
          }

          .modal-content {
            width: 95%;
            margin: 1rem;
          }

          .auction-detail {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminAuctions;