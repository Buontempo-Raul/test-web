// frontend/src/pages/Admin/Auctions.js - Complete Version with View Details Button
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/adminAPI';

const AdminAuctions = () => {
  // State management
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [sortBy, setSortBy] = useState('endTime'); // 'endTime', 'currentBid', 'bidsCount'
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // Fetch auctions when filters change
  useEffect(() => {
    fetchAuctions();
  }, [filterStatus, pagination.current]);

  // Auto-refresh every 30 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchAuctions();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [filterStatus, pagination.current, isLoading]);

  const fetchAuctions = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await adminAPI.getAllAuctions({
        page: pagination.current,
        limit: 10,
        status: filterStatus
      });

      if (response.success) {
        setAuctions(response.auctions || []);
        setPagination(response.pagination || { current: 1, pages: 1, total: 0 });
      } else {
        throw new Error(response.message || 'Failed to fetch auctions');
      }
      
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setError('Failed to load auctions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions
  const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getTimeRemaining = (endTime) => {
    if (!endTime) return 'No end time';
    
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const timeLeft = end - now;

    if (timeLeft <= 0) return 'Ended';

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getAuctionStatus = (auction) => {
    if (!auction.auction) {
      return { text: 'No Auction', class: 'status-inactive' };
    }

    const isActive = auction.auction.isActive;
    const endTime = new Date(auction.auction.endTime);
    const now = new Date();
    const hasEnded = endTime <= now;

    if (isActive && !hasEnded) {
      return { text: 'Active', class: 'status-active' };
    } else if (hasEnded) {
      return { text: 'Ended', class: 'status-ended' };
    } else {
      return { text: 'Inactive', class: 'status-inactive' };
    }
  };

  // Filter and sort auctions
  const filteredAuctions = (() => {
    let filtered = auctions.filter(auction => {
      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && !auction.auction?.isActive) return false;
        if (filterStatus === 'ended' && auction.auction?.isActive) return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          auction.title?.toLowerCase().includes(searchLower) ||
          auction.creator?.username?.toLowerCase().includes(searchLower) ||
          auction.category?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal, bVal;

        switch (sortBy) {
          case 'currentBid':
            aVal = a.auction?.currentBid || 0;
            bVal = b.auction?.currentBid || 0;
            break;
          
          case 'bidsCount':
            aVal = a.auction?.bids?.length || 0;
            bVal = b.auction?.bids?.length || 0;
            break;
    
          case 'endTime':
            aVal = new Date(a.auction?.endTime || 0).getTime();
            bVal = new Date(b.auction?.endTime || 0).getTime();
            break;
          
          default:
            return 0;
        }

        // Apply sort order
        if (sortOrder === 'desc') {
          return bVal - aVal;
        } else {
          return aVal - bVal;
        }
      });
    }

    return filtered;
  })();

  // Calculate statistics
  const stats = {
    total: auctions.length,
    active: auctions.filter(a => a.auction?.isActive).length,
    ended: auctions.filter(a => !a.auction?.isActive).length,
    totalRevenue: auctions
      .filter(a => !a.auction?.isActive && a.auction?.bids?.length > 0)
      .reduce((sum, a) => sum + (a.auction?.currentBid || 0), 0)
  };

  // Event handlers
  const handleViewAuction = (auction) => {
    setSelectedAuction(auction);
    setShowAuctionModal(true);
  };

  const handleCloseModal = () => {
    setSelectedAuction(null);
    setShowAuctionModal(false);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, current: newPage }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // If clicking the same field, toggle sort order
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      // If clicking a different field, set it as sortBy and default to desc
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Title', 'Artist', 'Category', 'Current Bid', 'Bids Count', 'Status', 'End Time'].join(','),
      ...filteredAuctions.map(auction => [
        auction.title || '',
        auction.creator?.username || '',
        auction.category || '',
        auction.auction?.currentBid || 0,
        auction.auction?.bids?.length || 0,
        getAuctionStatus(auction).text,
        auction.auction?.endTime || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `auctions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading && auctions.length === 0) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading auctions...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header Section */}
      <div className="admin-header">
        <div className="header-content">
          <div>
            <h1>Auction Management</h1>
            <p>Monitor live auctions, track performance, and manage bids</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              className="btn-secondary"
            >
              {viewMode === 'table' ? '🃏 Card View' : '📋 Table View'}
            </button>
            <button onClick={exportToCSV} className="btn-primary">
              📊 Export Report
            </button>
            <button onClick={fetchAuctions} className="btn-secondary">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="auction-stats">
        <div className="stat-item">
          <div className="stat-icon">🔨</div>
          <div className="stat-content">
            <div className="stat-label">Total Auctions</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-change">All time</div>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <div className="stat-label">Active Auctions</div>
            <div className="stat-value">{stats.active}</div>
            <div className="stat-change">Currently live</div>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{stats.ended}</div>
            <div className="stat-change">Finished auctions</div>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-change">From completed auctions</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="admin-filters">
        <div className="filter-group">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon"></span>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Auctions</option>
            <option value="active">Active Only</option>
            <option value="ended">Ended Only</option>
          </select>
        </div>

        <div className="results-info">
          {error ? (
            <span className="error-message">⚠️ {error}</span>
          ) : (
            <span>
              Showing {filteredAuctions.length} of {auctions.length} auctions
              {searchTerm && ` matching "${searchTerm}"`}
              {sortBy && ` (sorted by ${sortBy} ${sortOrder})`}
            </span>
          )}
        </div>
      </div>

      {/* Table/Card View */}
      {viewMode === 'table' ? (
        /* Table View - With Working Sort Buttons */
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Artwork</th>
                <th>Artist</th>
                <th>Category</th>
                <th 
                  onClick={() => handleSort('currentBid')}
                  className="sortable-header"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Current Bid {sortBy === 'currentBid' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  onClick={() => handleSort('bidsCount')}
                  className="sortable-header"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Bids {sortBy === 'bidsCount' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th>Status</th>
                <th 
                  onClick={() => handleSort('endTime')}
                  className="sortable-header"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  End Time {sortBy === 'endTime' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuctions.map((auction) => {
                const status = getAuctionStatus(auction);
                return (
                  <tr key={auction._id} className="auction-row">
                    <td>
                      <div className="artwork-info">
                        <img
                          src={auction.images?.[0] || 'https://via.placeholder.com/80x60/e5e7eb/6b7280?text=No+Image'}
                          alt={auction.title}
                          className="artwork-thumbnail"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80x60/e5e7eb/6b7280?text=No+Image';
                          }}
                        />
                        <div className="artwork-details">
                          <div className="artwork-title">{auction.title}</div>
                          <div className="artwork-id">ID: {auction._id?.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="creator-info">
                        <div className="creator-avatar">
                          {auction.creator?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="creator-name">{auction.creator?.username || 'Unknown'}</div>
                      </div>
                    </td>
                    <td>
                      <span className="category-tag">
                        {auction.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td>
                      <div className="bid-info">
                        <div className="bid-amount">{formatCurrency(auction.auction?.currentBid || 0)}</div>
                        <div className="bid-starting">Starting: {formatCurrency(auction.auction?.startingBid || 0)}</div>
                      </div>
                    </td>
                    <td>
                      <div className="bids-count">
                        <span className="bids-number">{auction.auction?.bids?.length || 0}</span>
                        <span className="bids-label">bids</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${status.class}`}>
                        {status.text}
                      </span>
                    </td>
                    <td>
                      <div className="time-info">
                        {auction.auction?.isActive ? (
                          <span className="time-remaining">⏰ {getTimeRemaining(auction.auction.endTime)}</span>
                        ) : (
                          <span className="ended-time">Ended: {formatDate(auction.auction?.endTime)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewAuction(auction)}
                        className="btn-view-details"
                        title="View image and bid history"
                      >
                        👁️ View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredAuctions.length === 0 && !isLoading && (
            <div className="no-results">
              <h3>No auctions found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      ) : (
        /* Card View */
        <div className="auction-cards-grid">
          {filteredAuctions.map((auction) => {
            const status = getAuctionStatus(auction);
            return (
              <div key={auction._id} className="auction-card">
                <div className="card-image">
                  <img
                    src={auction.images?.[0] || 'https://via.placeholder.com/350x200/e5e7eb/6b7280?text=No+Image'}
                    alt={auction.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/350x200/e5e7eb/6b7280?text=No+Image';
                    }}
                  />
                  <div className={`card-status ${status.class}`}>
                    {status.text}
                  </div>
                </div>
                
                <div className="card-content">
                  <h3 className="card-title">{auction.title}</h3>
                  
                  <div className="card-creator">
                    <div className="creator-avatar">
                      {auction.creator?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="creator-name">{auction.creator?.username || 'Unknown'}</div>
                  </div>
                  
                  <div className="card-category">
                    <span className="category-icon">🎨</span>
                    {auction.category || 'Uncategorized'}
                  </div>
                  
                  <div className="card-bid-info">
                    <div className="current-bid">{formatCurrency(auction.auction?.currentBid || 0)}</div>
                    <div className="bids-count">{auction.auction?.bids?.length || 0} bids</div>
                  </div>
                  
                  <div className="card-time">
                    {auction.auction?.isActive ? (
                      <span className="time-remaining">⏰ {getTimeRemaining(auction.auction.endTime)}</span>
                    ) : (
                      <span className="ended-time">Ended: {formatDate(auction.auction?.endTime)}</span>
                    )}
                  </div>
                  
                  <div className="card-actions">
                    <button
                      onClick={() => handleViewAuction(auction)}
                      className="btn-view-details-card"
                      title="View image and bid history"
                    >
                      👁️ View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredAuctions.length === 0 && !isLoading && (
            <div className="no-results">
              <h3>No auctions found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={pagination.current === 1}
            className="pagination-btn"
          >
            ← Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.current} of {pagination.pages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.current + 1)}
            disabled={pagination.current === pagination.pages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}

      {/* Auction Detail Modal - Shows Image and Bid History */}
      {showAuctionModal && selectedAuction && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="auction-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAuction.title}</h2>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>
            
            <div className="modal-content">
              {/* Full-width auction image */}
              <div className="auction-image-full">
                <img
                  src={selectedAuction.images?.[0] || 'https://via.placeholder.com/800x400/e5e7eb/6b7280?text=No+Image'}
                  alt={selectedAuction.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x400/e5e7eb/6b7280?text=No+Image';
                  }}
                />
              </div>

              {/* Auction details and bid history below */}
              <div className="auction-details-grid">
                <div className="auction-info">
                  <div className="info-section">
                    <h3>Auction Details</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Starting Bid:</span>
                        <span className="value">{formatCurrency(selectedAuction.auction?.startingBid || 0)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Current Bid:</span>
                        <span className="value">{formatCurrency(selectedAuction.auction?.currentBid || 0)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Total Bids:</span>
                        <span className="value">{selectedAuction.auction?.bids?.length || 0}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Status:</span>
                        <span className={`value ${getAuctionStatus(selectedAuction).class}`}>
                          {getAuctionStatus(selectedAuction).text}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">End Time:</span>
                        <span className="value">{formatDate(selectedAuction.auction?.endTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bid-history-section">
                  <h3>Bid History</h3>
                  {selectedAuction.auction?.bids?.length > 0 ? (
                    selectedAuction.auction.bids
                      .sort((a, b) => new Date(b.bidTime) - new Date(a.bidTime))
                      .slice(0, 5)
                      .map((bid, index) => (
                        <div key={bid._id || index} className="bid-item">
                          <div className="bid-rank">#{index + 1}</div>
                          <div className="bid-info">
                            <div className="bid-user">{bid.bidder?.username || 'Anonymous'}</div>
                            <div className="bid-email">{bid.bidder?.email || 'No email'}</div>
                          </div>
                          <div className="bid-amount">{formatCurrency(bid.amount)}</div>
                          {/* <div className="bid-time">{formatDate(bid.bidTime)}</div> */}
                        </div>
                      ))
                  ) : (
                    <p className="no-bids">No bids placed yet</p>
                  )}
                </div>
              </div>
              
              <div className="modal-actions">
                <button className="btn-secondary">Export Auction Data</button>
                {selectedAuction.auction?.isActive && (
                  <button className="btn-warning">Pause Auction</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced CSS Styles */}
      <style jsx>{`
        .admin-page {
          padding: 0;
          background: #f8fafc;
          min-height: 100vh;
        }

        .admin-header {
          margin-bottom: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          color: white;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .admin-header h1 {
          margin: 0 0 0.5rem 0;
          color: white;
          font-size: 2.5rem;
          font-weight: 700;
        }

        .admin-header p {
          margin: 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.1rem;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .btn-primary, .btn-secondary, .btn-warning {
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background: #5a67d8;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .btn-warning {
          background: #f59e0b;
          color: white;
        }

        .btn-warning:hover {
          background: #d97706;
          transform: translateY(-2px);
        }

        .auction-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-item {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.8);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .stat-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .stat-icon {
          font-size: 2rem;
          opacity: 0.8;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1f2937;
          margin: 0;
        }

        .stat-change {
          font-size: 0.85rem;
          color: #10b981;
          margin-top: 0.5rem;
        }

        .admin-filters {
          background: #7c3aed;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-container {
          position: relative;
          max-width: 400px;
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: white;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
        }

        .filter-select {
          padding: 0.875rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: white;
          color: #374151;
          font-weight: 500;
        }

        .filter-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .results-info {
          color:rgb(255, 255, 255);
          font-size: 1rem;
        }

        .error-message {
          color: #ef4444;
          font-weight: 600;
        }

        .admin-table-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          margin-bottom: 2rem;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          background: #f8fafc;
          padding: 1.5rem 1rem;
          text-align: left;
          font-weight: 700;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sortable-header:hover {
          background: #e5e7eb;
          color: #667eea;
        }

        .admin-table td {
          padding: 1.25rem 1rem;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }

        .auction-row:hover {
          background: #f8fafc;
        }

        .artwork-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .artwork-thumbnail {
          width: 60px;
          height: 45px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
        }

        .artwork-details {
          flex: 1;
        }

        .artwork-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .artwork-id {
          font-size: 0.8rem;
          color: #6b7280;
          font-family: monospace;
        }

        .creator-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .creator-avatar {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: #667eea;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .creator-name {
          font-weight: 500;
          color: #374151;
        }

        .category-tag {
          background: #e0e7ff;
          color: #3730a3;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .bid-info {
          text-align: right;
        }

        .bid-amount {
          font-weight: 700;
          color: #059669;
          font-size: 1.1rem;
          margin-bottom: 0.25rem;
        }

        .bid-starting {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .bids-count {
          text-align: center;
        }

        .bids-number {
          font-weight: 700;
          color: #1f2937;
          font-size: 1.25rem;
          display: block;
        }

        .bids-label {
          font-size: 0.8rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge {
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-ended {
          background: #f3f4f6;
          color: #374151;
        }

        .status-inactive {
          background: #fef3c7;
          color: #92400e;
        }

        .time-info {
          text-align: center;
        }

        .time-remaining {
          color: #059669;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .ended-time {
          color: #6b7280;
          font-size: 0.85rem;
        }

        .btn-view-details {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.625rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-view-details:hover {
          background: #5a67d8;
          transform: translateY(-2px);
        }

        .auction-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .auction-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }

        .auction-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .card-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-status {
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .card-content {
          padding: 1.5rem;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 1rem 0;
        }

        .card-creator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .card-category {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .category-icon {
          opacity: 0.7;
        }

        .card-bid-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .current-bid {
          font-weight: 700;
          color: #059669;
          font-size: 1.25rem;
        }

        .card-time {
          text-align: center;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #f1f5f9;
          border-radius: 8px;
        }

        .card-actions {
          margin-top: 1rem;
        }

        .btn-view-details-card {
          width: 100%;
          background: #667eea;
          color: white;
          border: none;
          padding: 0.875rem 1rem;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-view-details-card:hover {
          background: #5a67d8;
          transform: translateY(-2px);
        }

        .no-results {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .no-results h3 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          padding: 2rem;
        }

        .pagination-btn {
          padding: 0.75rem 1.5rem;
          border: 2px solid #e5e7eb;
          background: white;
          color: #374151;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          color: #6b7280;
          font-weight: 500;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .auction-modal {
          background: white;
          border-radius: 20px;
          max-width: 1400px;
          width: 95%;
          max-height: 90vh;
          overflow: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 20px 20px 0 0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 700;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 1.5rem;
          padding: 0.5rem;
          border-radius: 50%;
          cursor: pointer;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .modal-content {
          padding: 2rem;
          width: 100%;
          max-width: none;
        }

        .auction-image-full {
          margin-bottom: 2rem;
        }

        .auction-image-full img {
          width: 100%;
          height: 400px;
          object-fit: cover;
          border-radius: 12px;
        }

        .auction-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .bid-history-section h3 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .info-section h3 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .info-grid {
          display: grid;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .info-item .label {
          font-weight: 600;
          color: #374151;
        }

        .info-item .value {
          font-weight: 700;
          color: #1f2937;
        }

        .bid-history-section {
          margin-top: 0;
        }

        .bid-item {
          display: grid;
          grid-template-columns: 50px 1fr auto auto;
          gap: 1rem;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 0.75rem;
        }

        .bid-rank {
          background: #667eea;
          color: white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .bid-user {
          font-weight: 600;
          color: #1f2937;
        }

        .bid-email {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .bid-amount {
          font-weight: 700;
          color: #059669;
          font-size: 1.1rem;
        }

        .bid-time {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .no-bids {
          text-align: center;
          color: #6b7280;
          font-style: italic;
          padding: 2rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .admin-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
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
          .admin-header {
            padding: 1.5rem;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
            justify-content: stretch;
          }

          .header-actions button {
            flex: 1;
          }

          .auction-stats {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }

          .admin-filters {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-group {
            flex-direction: column;
          }

          .search-container {
            max-width: none;
          }

          .admin-table-container {
            overflow-x: auto;
          }

          .admin-table {
            min-width: 800px;
          }

          .auction-cards-grid {
            grid-template-columns: 1fr;
          }

          .auction-details-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .auction-image-full img {
            height: 250px;
          }

          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminAuctions;