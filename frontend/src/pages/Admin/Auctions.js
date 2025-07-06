// frontend/src/pages/Admin/Auctions.js - Enhanced Version
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
  }, [filterStatus, pagination.current, sortBy, sortOrder]);

  // Auto-refresh every 30 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchAuctions();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [filterStatus, pagination.current, sortBy, sortOrder, isLoading]);

  const fetchAuctions = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await adminAPI.getAllAuctions({
        page: pagination.current,
        limit: 10,
        status: filterStatus,
        sortBy,
        sortOrder
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
      setAuctions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTimeRemaining = (endTime) => {
    try {
      const now = new Date();
      const end = new Date(endTime);
      const diff = end - now;

      if (diff <= 0) return 'Auction ended';

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    } catch {
      return 'Invalid time';
    }
  };

  const getAuctionStatus = (auction) => {
    if (!auction?.auction) return { status: 'unknown', color: '#95a5a6', text: 'Unknown' };
    
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
    return icons[category?.toLowerCase()] || '🎨';
  };

  // Filter auctions based on search term
  const filteredAuctions = auctions.filter(auction => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      auction.title?.toLowerCase().includes(searchLower) ||
      auction.creator?.username?.toLowerCase().includes(searchLower) ||
      auction.category?.toLowerCase().includes(searchLower)
    );
  });

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
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
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
              {viewMode === 'table' ? '📋 Table View' : '🃏 Card View'}
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
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="endTime">Sort by End Time</option>
            <option value="currentBid">Sort by Current Bid</option>
            <option value="bidsCount">Sort by Bid Count</option>
            <option value="createdAt">Sort by Created Date</option>
          </select>
        </div>
        
        <div className="results-info">
          <span>Showing {filteredAuctions.length} of {stats.total} auctions</span>
          {error && <span className="error-message">⚠️ {error}</span>}
        </div>
      </div>

      {/* Content Display */}
      {viewMode === 'table' ? (
        /* Table View */
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('title')} className="sortable">
                  Artwork {sortBy === 'title' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th>Artist</th>
                <th>Category</th>
                <th onClick={() => handleSort('currentBid')} className="sortable">
                  Current Bid {sortBy === 'currentBid' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th onClick={() => handleSort('bidsCount')} className="sortable">
                  Bids {sortBy === 'bidsCount' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th>Status</th>
                <th onClick={() => handleSort('endTime')} className="sortable">
                  Time Left {sortBy === 'endTime' && (sortOrder === 'desc' ? '↓' : '↑')}
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
                        <span className="category-icon">{getCategoryIcon(auction.category)}</span>
                        <span className="category-name">{auction.category || 'Uncategorized'}</span>
                      </div>
                    </td>
                    
                    <td>
                      <div className="bid-info">
                        <div className="current-bid">
                          {formatCurrency(auction.auction?.currentBid || auction.auction?.startingBid || 0)}
                        </div>
                        <div className="bid-increase">
                          +{formatCurrency((auction.auction?.currentBid || 0) - (auction.auction?.startingBid || 0))}
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div className="bids-count">
                        <span className="count-number">{auction.auction?.bids?.length || 0}</span>
                        <span className="count-label">bids</span>
                      </div>
                    </td>
                    
                    <td>
                      <span 
                        className={`status-badge status-${status.status}`}
                        style={{ backgroundColor: status.color }}
                      >
                        {status.status === 'active' && <div className="status-dot"></div>}
                        {status.text}
                      </span>
                    </td>
                    
                    <td>
                      <div className="time-info">
                        {auction.auction?.isActive ? (
                          <div className="time-remaining">
                            {getTimeRemaining(auction.auction.endTime)}
                          </div>
                        ) : (
                          <div className="ended-time">
                            Ended: {formatDate(auction.auction?.endTime)}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleViewAuction(auction)}
                          className="action-btn btn-view"
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          className="action-btn btn-analytics"
                          title="View Analytics"
                        >
                          📊
                        </button>
                        {auction.auction?.isActive && (
                          <button
                            className="action-btn btn-pause"
                            title="Pause Auction"
                          >
                            ⏸️
                          </button>
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
                    src={auction.images?.[0] || '/api/placeholder/300/200'}
                    alt={auction.title}
                    onError={(e) => {
                      e.target.src = '/api/placeholder/300/200';
                    }}
                  />
                  <div className="card-status">
                    <span className={`status-badge status-${status.status}`}>
                      {status.status === 'active' && <div className="status-dot"></div>}
                      {status.text}
                    </span>
                  </div>
                  <div className="card-category">
                    {getCategoryIcon(auction.category)} {auction.category}
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="card-header">
                    <h3>{auction.title}</h3>
                    <div className="card-bid">
                      <div className="current-bid">{formatCurrency(auction.auction?.currentBid || 0)}</div>
                      <div className="bid-count">{auction.auction?.bids?.length || 0} bids</div>
                    </div>
                  </div>
                  
                  <div className="card-artist">
                    <div className="creator-avatar">
                      {auction.creator?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span>{auction.creator?.username || 'Unknown Artist'}</span>
                  </div>
                  
                  <div className="card-footer">
                    <div className="time-remaining">
                      ⏱️ {auction.auction?.isActive ? 
                        getTimeRemaining(auction.auction.endTime) : 
                        'Ended'}
                    </div>
                    <button
                      onClick={() => handleViewAuction(auction)}
                      className="btn-view-details"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
          
          <div className="pagination-info">
            Page {pagination.current} of {pagination.pages} ({pagination.total} total auctions)
          </div>
          
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAuction.title}</h2>
              <button onClick={handleCloseModal} className="modal-close">
                ✕
              </button>
            </div>
            
            <div className="auction-detail">
              <div className="artwork-display">
                <img
                  src={selectedAuction.images?.[0] || '/api/placeholder/400/300'}
                  alt={selectedAuction.title}
                  onError={(e) => {
                    e.target.src = '/api/placeholder/400/300';
                  }}
                />
              </div>
              
              <div className="auction-info">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Current Bid</div>
                    <div className="info-value">
                      {formatCurrency(selectedAuction.auction?.currentBid || 0)}
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-label">Total Bids</div>
                    <div className="info-value">{selectedAuction.auction?.bids?.length || 0}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-label">Time Remaining</div>
                    <div className="info-value">
                      {selectedAuction.auction?.isActive ? 
                        getTimeRemaining(selectedAuction.auction.endTime) : 
                        'Auction Ended'}
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-label">Starting Bid</div>
                    <div className="info-value">
                      {formatCurrency(selectedAuction.auction?.startingBid || 0)}
                    </div>
                  </div>
                </div>
                
                <div className="artist-info">
                  <h4>Artist Information</h4>
                  <div className="creator-info">
                    <div className="creator-avatar">
                      {selectedAuction.creator?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="creator-name">{selectedAuction.creator?.username || 'Unknown'}</div>
                      <div className="creator-email">{selectedAuction.creator?.email || 'No email'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bid-history">
                  <h4>Bid History ({selectedAuction.auction?.bids?.length || 0} bids)</h4>
                  <div className="bid-list">
                    {selectedAuction.auction?.bids && selectedAuction.auction.bids.length > 0 ? (
                      selectedAuction.auction.bids
                        .sort((a, b) => new Date(b.bidTime) - new Date(a.bidTime))
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
          flex-wrap: wrap;
        }

        .btn-primary, .btn-secondary, .btn-warning {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }

        .btn-secondary {
          background: white;
          color: #374151;
          border: 2px solid #e5e7eb;
        }

        .btn-warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .btn-primary:hover, .btn-secondary:hover, .btn-warning:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
          color:rgb(255, 255, 255);
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
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 1.5rem 1.25rem;
          text-align: left;
          font-weight: 700;
          color: #374151;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e5e7eb;
        }

        .admin-table th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .admin-table th.sortable:hover {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        }

        .admin-table td {
          padding: 1.25rem;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }

        .auction-row:hover td {
          background: #f8fafc;
          transition: background-color 0.2s ease;
        }

        .artwork-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .artwork-thumbnail {
          width: 80px;
          height: 60px;
          border-radius: 12px;
          object-fit: cover;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .artwork-details h4 {
          margin: 0 0 0.25rem 0;
          font-weight: 700;
          color: #1f2937;
          font-size: 1.1rem;
        }

        .starting-bid {
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .creator-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .creator-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.2rem;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .creator-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .creator-email {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .category-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          border-radius: 20px;
          font-weight: 600;
          color: #374151;
        }

        .category-icon {
          font-size: 1.2rem;
        }

        .bid-info {
          text-align: left;
        }

        .current-bid {
          font-size: 1.5rem;
          font-weight: 800;
          color: #059669;
          margin-bottom: 0.25rem;
        }

        .bid-increase {
          font-size: 0.875rem;
          color: #10b981;
          font-weight: 600;
        }

        .bids-count {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #eff6ff;
          border-radius: 20px;
          color: #1d4ed8;
          font-weight: 600;
        }

        .count-number {
          font-size: 1.2rem;
          font-weight: 800;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .status-active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .status-ended {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: currentColor;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .time-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .time-remaining {
          font-weight: 700;
          color: #ea580c;
          font-size: 1rem;
        }

        .ended-time {
          font-weight: 600;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.75rem;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          height: 44px;
          text-decoration: none;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-view {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }

        .btn-analytics {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .btn-pause {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
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
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .auction-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
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
        }

        .card-category {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .card-content {
          padding: 1.5rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 1rem;
        }

        .card-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          flex: 1;
          margin-right: 1rem;
        }

        .card-bid {
          text-align: right;
        }

        .card-bid .current-bid {
          font-size: 1.5rem;
          font-weight: 800;
          color: #059669;
          margin-bottom: 0.25rem;
        }

        .card-bid .bid-count {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .card-artist {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .card-artist .creator-avatar {
          width: 32px;
          height: 32px;
          font-size: 0.875rem;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
        }

        .time-remaining {
          color: #ea580c;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .btn-view-details {
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-view-details:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        /* Pagination */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          margin: 2rem 0;
        }

        .pagination-btn {
          padding: 0.75rem 1.5rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #667eea;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          color: #6b7280;
          font-weight: 500;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        .modal-content {
          background: white;
          border-radius: 24px;
          max-width: 1200px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease;
        }

        .modal-header {
          padding: 2rem;
          border-bottom: 2px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 24px 24px 0 0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 2rem;
          font-weight: 800;
          color: #1f2937;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 12px;
          transition: all 0.3s ease;
          color: #6b7280;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .auction-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          padding: 2rem;
        }

        .artwork-display img {
          width: 100%;
          height: 400px;
          object-fit: cover;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .auction-info {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .info-item {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
        }

        .info-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
        }

        .info-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1f2937;
        }

        .artist-info {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid #bfdbfe;
        }

        .artist-info h4 {
          margin: 0 0 1rem 0;
          font-size: 1.2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .bid-history {
          background: white;
          border: 2px solid #f3f4f6;
          border-radius: 16px;
        }

        .bid-history h4 {
          padding: 1.5rem 1.5rem 0 1.5rem;
          margin: 0 0 1rem 0;
          font-size: 1.2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .bid-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .bid-item {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: 1rem;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s ease;
        }

        .bid-item:hover {
          background: #f8fafc;
        }

        .bid-item:last-child {
          border-bottom: none;
        }

        .bid-rank {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .bid-user {
          font-weight: 700;
          color: #1f2937;
          font-size: 1rem;
        }

        .bid-email {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .bid-amount {
          font-weight: 800;
          color: #059669;
          font-size: 1.1rem;
        }

        .bid-time {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .no-bids {
          text-align: center;
          padding: 3rem;
          color: #9ca3af;
          font-style: italic;
          font-size: 1.1rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .no-results {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 16px;
          margin: 2rem 0;
        }

        .no-results h3 {
          margin: 0 0 1rem 0;
          color: #374151;
          font-size: 1.5rem;
        }

        .no-results p {
          margin: 0;
          color: #6b7280;
        }

        /* Loading States */
        .admin-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1.5rem;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .auction-detail {
            grid-template-columns: 1fr;
          }
          
          .info-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .admin-header {
            padding: 1.5rem;
          }

          .header-content {
            flex-direction: column;
            align-items: stretch;
          }

          .admin-header h1 {
            font-size: 2rem;
          }

          .admin-filters {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-group {
            justify-content: space-between;
          }

          .auction-stats {
            grid-template-columns: 1fr;
          }

          .admin-table-container {
            overflow-x: auto;
          }

          .admin-table {
            min-width: 1000px;
          }

          .auction-cards-grid {
            grid-template-columns: 1fr;
          }

          .modal-content {
            width: 95%;
            margin: 1rem;
            max-height: 95vh;
          }

          .auction-detail {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            padding: 1rem;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .stat-value {
            font-size: 2rem;
          }

          .header-actions {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminAuctions;