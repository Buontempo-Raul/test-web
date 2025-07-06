
// frontend/src/pages/Admin/Auctions.js - Fixed Version with Working Sort Buttons
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const timeLeft = end - now;

    if (timeLeft <= 0) {
      return 'Ended';
    }

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

    const now = new Date();
    const endTime = new Date(auction.auction.endTime);
    
    if (auction.auction.isActive && now < endTime) {
      return { text: 'Active', class: 'status-active' };
    } else if (now >= endTime || !auction.auction.isActive) {
      return { text: 'Ended', class: 'status-ended' };
    } else {
      return { text: 'Paused', class: 'status-paused' };
    }
  };

  // FIXED: Add proper sorting logic to filteredAuctions
  const filteredAuctions = (() => {
    // First, apply filters
    let filtered = auctions.filter(auction => {
      // Status filter
      if (filterStatus === 'active' && !auction.auction?.isActive) return false;
      if (filterStatus === 'ended' && auction.auction?.isActive) return false;
      
      // Search filter
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        auction.title?.toLowerCase().includes(searchLower) ||
        auction.creator?.username?.toLowerCase().includes(searchLower) ||
        auction.category?.toLowerCase().includes(searchLower)
      );
    });

    // Then, apply sorting
    if (sortBy && filtered.length > 0) {
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

  // FIXED: Improved handleSort function with better logic
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
              placeholder="Search auctions, artists, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
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
                          src={auction.images?.[0] || '/api/placeholder/80/60'}
                          alt={auction.title}
                          className="artwork-thumbnail"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/80/60';
                          }}
                        />
                        <div className="artwork-details">
                          <h4>{auction.title}</h4>
                          <div className="starting-bid">
                            Starting: {formatCurrency(auction.auction?.startingBid || 0)}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div className="creator-info">
                        <div className="creator-avatar">
                          {auction.creator?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="creator-name">{auction.creator?.username || 'Unknown'}</div>
                          <div className="creator-email">{auction.creator?.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div className="category-info">
                        <span className="category-icon">🎨</span>
                        <span className="category-name">{auction.category || 'Uncategorized'}</span>
                      </div>
                    </td>
                    
                    <td>
                      <div className="bid-info">
                        <div className="current-bid">
                          {formatCurrency(auction.auction?.currentBid || 0)}
                        </div>
                        <div className="bid-increase">
                          +{formatCurrency((auction.auction?.currentBid || 0) - (auction.auction?.startingBid || 0))} from start
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div className="bids-count">
                        <span className="count-number">{auction.auction?.bids?.length || 0}</span>
                        <span> bids</span>
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
                    src={auction.images?.[0] || '/api/placeholder/350/200'}
                    alt={auction.title}
                    onError={(e) => {
                      e.target.src = '/api/placeholder/350/200';
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

      {/* Auction Detail Modal */}
      {showAuctionModal && selectedAuction && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="auction-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAuction.title}</h2>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>
            
            <div className="modal-content">
              <div className="auction-details-grid">
                <div className="auction-image">
                  <img
                    src={selectedAuction.images?.[0] || '/api/placeholder/400/300'}
                    alt={selectedAuction.title}
                    onError={(e) => {
                      e.target.src = '/api/placeholder/400/300';
                    }}
                  />
                </div>
                
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
                  
                  <div className="bid-history">
                    <h3>Recent Bids</h3>
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
                            <div className="bid-time">{formatDate(bid.bidTime)}</div>
                          </div>
                        ))
                    ) : (
                      <p className="no-bids">No bids placed yet</p>
                    )}
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button className="btn-primary">View Full Analytics</button>
                  <button className="btn-secondary">Export Auction Data</button>
                  {selectedAuction.auction?.isActive && (
                    <button className="btn-warning">Pause Auction</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced CSS Styles */}
      <style jsx>{`
        /* Import the enhanced CSS from the previous artifact */
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
          flex-wrap: wrap;
        }

        .btn-primary, .btn-secondary, .btn-warning {
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          border: none;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: #4ade80;
          color: white;
        }

        .btn-primary:hover {
          background: #22c55e;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          backdrop-filter: blur(10px);
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
          display: flex;
          align-items: center;
          gap: 1.5rem;
          border-left: 4px solid transparent;
          transition: all 0.3s ease;
        }

        .stat-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .stat-item:nth-child(1) { border-left-color: #3b82f6; }
        .stat-item:nth-child(2) { border-left-color: #10b981; }
        .stat-item:nth-child(3) { border-left-color: #8b5cf6; }
        .stat-item:nth-child(4) { border-left-color: #f59e0b; }

        .stat-icon {
          font-size: 2.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .stat-change {
          font-size: 0.85rem;
          color: #10b981;
          margin-top: 0.25rem;
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
          align-items: left;
          gap: 1rem;
          flex-wrap: wrap;
          flex: 1;
        }

        .search-container {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
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
          color: #9ca3af;
          font-size: 1.2rem;
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
          min-width: 160px;
        }

        .filter-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .results-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: rgb(255, 255, 255);
          font-weight: 500;
        }

        .error-message {
          color: #ef4444;
          font-weight: 600;
        }

        .admin-table-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.25rem 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: 0.5px;
        }

        .sortable-header {
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
        }

        .sortable-header:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .admin-table td {
          padding: 1.5rem 1rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .auction-row:hover {
          background: #f8fafc;
        }

        .auction-row:last-child td {
          border-bottom: none;
        }

        .artwork-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .artwork-thumbnail {
          width: 80px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
        }

        .artwork-details h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .starting-bid {
          font-size: 0.85rem;
          color: #6b7280;
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
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .creator-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .creator-email {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .category-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .category-icon {
          font-size: 1.5rem;
        }

        .category-name {
          font-weight: 500;
          color: #374151;
        }

        .bid-info {
          text-align: center;
        }

        .current-bid {
          font-size: 1.25rem;
          font-weight: 700;
          color: #059669;
          margin-bottom: 0.25rem;
        }

        .bid-increase {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .bids-count {
          text-align: center;
        }

        .count {
          font-size: 1.5rem;
          font-weight: 700;
          color: #3b82f6;
          display: block;
        }

        .count-label {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .status-container {
          text-align: center;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 25px;
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.status-active{
          color: green
        }
        
        .status-badge.status-ended{
          color: red
        }

        .status-badge.status-paused{
          color: yellow
        }

        .time-info {
          text-align: center;
        }

        .time-remaining {
          font-weight: 600;
          color: #dc2626;
          font-size: 1rem;
        }

        .ended-time {
          color: #6b7280;
          font-size: 0.9rem;
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
          margin-top: 2rem;
        }

        .pagination-btn {
          padding: 0.75rem 1.5rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          font-weight: 600;
          color: #374151;
        }

        /* Card View Styles */
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
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .card-image {
          position: relative;
          width: 100%;
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
          padding: 0.5rem 1rem;
          border-radius: 25px;
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .card-content {
          padding: 1.5rem;
        }

        .card-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
        }

        .card-artist {
          color: #6b7280;
          margin-bottom: 0.75rem;
          font-style: italic;
        }

        .card-category {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-weight: 500;
          color: #374151;
        }

        .card-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .stat {
          text-align: center;
        }

        .stat-label {
          display: block;
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1f2937;
        }

        .card-time {
          text-align: center;
          padding: 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
          font-weight: 600;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .auction-modal {
          background: white;
          border-radius: 20px;
          max-width: 900px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
        }

        .auction-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .auction-image img {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 12px;
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

        .bid-history {
          margin-top: 2rem;
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