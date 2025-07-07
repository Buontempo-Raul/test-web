import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/adminAPI';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionForm, setActionForm] = useState({
    action: '',
    type: '', // 'ban', 'pause', or 'restore'
    duration: 7,
    reason: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounced search effect - separate from fetchUsers to prevent input focus loss
  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterStatus, pagination.current]);

  // Separate effect for search with proper debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.current !== 1) {
        setPagination(p => ({ ...p, current: 1 })); // Reset to page 1 for new search
      } else {
        fetchUsers(); // Only fetch if already on page 1
      }
    }, 500); // Increased debounce time for better UX

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      if (searchTerm) {
        setSearchLoading(true);
      } else {
        setIsLoading(true);
      }
      setActionError(null);
      
      const response = await adminAPI.getAllUsers({
        page: pagination.current,
        limit: 10,
        search: searchTerm,
        role: filterRole,
        status: filterStatus
      });

      if (response.success) {
        setUsers(response.users);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setActionError('Failed to fetch users. Please try again.');
    } finally {
      setIsLoading(false);
      setSearchLoading(false);
    }
  };

  // Enhanced status calculation
  const getUserStatus = (user) => {
    const now = new Date();
    
    // Check if permanently banned
    if (user.permanentlyBanned) {
      return { 
        status: 'permanently_banned', 
        color: '#8B0000', 
        text: 'Banned',
        isPermanent: true
      };
    }
    
    // Check current temporary ban status
    if (user.banUntil && new Date(user.banUntil) > now) {
      return { 
        status: 'banned', 
        color: '#e74c3c', 
        text: 'Temporarily Banned',
        isPermanent: false,
        until: new Date(user.banUntil).toLocaleDateString()
      };
    }
    
    // Check current pause status
    if (user.pauseUntil && new Date(user.pauseUntil) > now) {
      return { 
        status: 'paused', 
        color: '#f39c12', 
        text: 'Paused',
        isPermanent: false,
        until: new Date(user.pauseUntil).toLocaleDateString()
      };
    }
    
    // Check if inactive
    if (!user.active) {
      return { 
        status: 'inactive', 
        color: '#95a5a6', 
        text: 'Inactive',
        isPermanent: false
      };
    }
    
    // Default to active
    return { 
      status: 'active', 
      color: '#27ae60', 
      text: 'Active',
      isPermanent: false
    };
  };

  const getUserRole = (user) => {
    if (user.role === 'admin') return 'Admin';
    if (user.isArtist) return 'Artist';
    return 'User';
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleActionClick = (user, actionType) => {
    setSelectedUser(user);
    const status = getUserStatus(user);
    
    let action, defaultReason;
    
    if (actionType === 'ban') {
      action = status.status === 'banned' || status.status === 'permanently_banned' ? 'unban' : 'ban';
      defaultReason = action === 'ban' ? 'Violation of community guidelines' : '';
    } else if (actionType === 'pause') {
      action = status.status === 'paused' ? 'unpause' : 'pause';
      defaultReason = action === 'pause' ? 'Account temporarily restricted' : '';
    } else if (actionType === 'restore') {
      action = 'restore';
      defaultReason = 'Full account restoration';
    }

    setActionForm({
      action,
      type: actionType,
      duration: actionType === 'ban' ? 7 : 30,
      reason: defaultReason
    });
    setShowActionModal(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleActionSubmit = async () => {
    const { action, type, duration, reason } = actionForm;
    
    // Validation
    if ((action === 'ban' || action === 'pause') && (!reason || reason.trim().length < 3)) {
      setActionError(`${action === 'ban' ? 'Ban' : 'Pause'} reason is required and must be at least 3 characters`);
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);

      let response;
      const requestData = { action, duration, reason };

      if (type === 'ban') {
        response = await adminAPI.banUser(selectedUser._id, requestData);
      } else if (type === 'pause') {
        response = await adminAPI.pauseUser(selectedUser._id, requestData);
      } else if (type === 'restore') {
        response = await adminAPI.fullyRestoreUser(selectedUser._id, requestData);
      }

      if (response.success) {
        setActionSuccess(response.message);
        setTimeout(() => {
          setShowActionModal(false);
          setActionSuccess(null);
          fetchUsers(); // Refresh the list
        }, 2000);
      } else {
        throw new Error(response.message || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error with ${action} action:`, error);
      setActionError(error.message || `Failed to process ${action} request`);
    } finally {
      setActionLoading(false);
    }
  };

  // Component for user avatar
  const UserAvatar = ({ user, size = '40px' }) => {
    const [imageError, setImageError] = useState(false);
    
    const handleImageError = () => {
      setImageError(true);
    };

    if (!user.profileImage || imageError) {
      return (
        <div 
          className="user-avatar fallback" 
          style={{ 
            width: size, 
            height: size,
            fontSize: parseInt(size) * 0.4 + 'px'
          }}
        >
          {user.username.charAt(0).toUpperCase()}
        </div>
      );
    }

    return (
      <img 
        src={user.profileImage} 
        alt={user.username}
        className="user-avatar image"
        style={{ width: size, height: size }}
        onError={handleImageError}
      />
    );
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

  // Clear search function with focus retention
  const clearSearch = () => {
    setSearchTerm('');
    // Keep focus on the input after clearing
    setTimeout(() => {
      const searchInput = document.querySelector('.search-input');
      if (searchInput) searchInput.focus();
    }, 0);
  };

  // Handle search input change with immediate UI update
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <style>{`
        .admin-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .admin-header {
          margin-bottom: 2rem;
        }

        .admin-header h1 {
          font-size: 2rem;
          color: #2c3e50;
          margin: 0 0 0.5rem 0;
        }

        .admin-header p {
          color: #7f8c8d;
          margin: 0 0 1rem 0;
        }

        .results-count {
          color: #667eea;
          font-weight: 500;
        }

        .legend {
          display: flex;
          gap: 2rem;
          margin-top: 1rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }

        .legend-color.banned { background-color: #e74c3c; }
        .legend-color.paused { background-color: #f39c12; }

        .message-banner {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .message-banner.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message-banner.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .admin-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          padding: 1.5rem;
          border: 2px solid #8b5cf6;
          border-radius: 12px;
          background-color: #faf5ff;
        }

        .filter-group {
          flex: 1;
          min-width: 200px;
          position: relative;
          background-color: #7c3aed;
          border-radius: 15px;
        }

        .search-input,
        .filter-select {
          width: 100%;
          padding: 0.75rem;
          border: 2px hiborder-color: #6b7280;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease, background-color 0.3s ease;
          background-color: #f3f4f6; /* Changed to light gray for visibility */
          color: #1f2937; /* Darker text color for contrast */
        }

        .filter-group.search-container {
          position: relative;
        }

        .search-clear,
        .search-loading {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #e0e7ff;
          cursor: pointer Vitamins, Minerals & Supplements;
          font-size: 1.2rem;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          min-height: 20px;
        }

        .search-clear:hover {
          color: white;
        }

        .search-loading {
          cursor: default;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        .search-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #7c3aed;
          background-color: #e0e7ff; /* Lighter purple on focus for contrast */
          box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.3);
          color: #1f2937; /* Maintain dark text on focus */
        }

        .search-input::placeholder {
          color: #6b7280; /* Darker placeholder for visibility */
        }

        .search-input:focus::placeholder {
          color: #4b5563; /* Slightly darker placeholder on focus */
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

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar.fallback {
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          flex-shrink: 0;
        }

        .user-avatar.image {
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .user-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .user-email {
          font-size: 0.9rem;
          color: #7f8c8d;
        }

        .role-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 600;
          color: white !important;
          text-transform: uppercase;
        }

        .role-badge.admin { 
          background-color: #e74c3c; 
          color: white !important;
        }
        .role-badge.artist { 
          background-color: #9b59b6; 
          color: white !important;
        }
        .role-badge.user { 
          background-color: #3498db; 
          color: white !important;
        }

        .status-badge {
          padding: 0.35rem 0.8rem;
          margin: 0 0 0;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
          cursor: default;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .action-buttons button {
          padding: 0.4rem 0.8rem;
          border: none;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-button {
          background-color: #667eea;
          color: white;
        }

        .view-button:hover {
          background-color: #5a6fd8;
        }

        .ban-button {
          background-color: #e74c3c;
          color: white;
        }

        .ban-button:hover {
          background-color: #c0392b;
        }

        .ban-button.unban {
          background-color: #27ae60;
        }

        .ban-button.unban:hover {
          background-color: #219a52;
        }

        .pause-button {
          background-color: #8b5cf6;
          color: white;
        }

        .pause-button:hover {
          background-color: #7c3aed;
        }

        .pause-button.unpause {
          background-color: #16a085;
        }

        .pause-button.unpause:hover {
          background-color: #138d75;
        }

        .restore-button {
          background-color: #9b59b6;
          color: white;
        }

        .restore-button:hover {
          background-color: #8e44ad;
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 2rem;
        }

        .pagination button {
          padding: 0.5rem 1rem;
          border: 1px solid #ddd;
          background-color: white;
          cursor: pointer;
          border-radius: 4px;
        }

        .pagination button:hover:not(:disabled) {
          background-color: #f8f9fa;
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination button.active {
          background-color: #667eea;
          color: white;
          border-color: #667eea;
        }

        .admin-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .modal-actions button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background-color: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background-color: #5a6fd8;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #5a6268;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .no-results {
          text-align: center;
          padding: 3rem;
          color: #7f8c8d;
        }

        @media (max-width: 768px) {
          .admin-filters {
            flex-direction: column;
          }
          
          .filter-group {
            min-width: auto;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .admin-table {
            font-size: 0.9rem;
          }
          
          .admin-table th,
          .admin-table td {
            padding: 0.5rem;
          }
        }
      `}</style>

      <div className="admin-header">
        <h1>User Management</h1>
        <p>
          Manage platform users with ban and pause controls
          {pagination.total > 0 && (
            <span className="results-count">
              {searchTerm ? ` • Found ${pagination.total} user${pagination.total !== 1 ? 's' : ''} matching "${searchTerm}"` 
                         : ` • ${pagination.total} total user${pagination.total !== 1 ? 's' : ''}`}
            </span>
          )}
        </p>
      </div>

      {(actionError || actionSuccess) && (
        <div className={`message-banner ${actionSuccess ? 'success' : 'error'}`}>
          <span>{actionSuccess || actionError}</span>
          <button onClick={() => {setActionError(null); setActionSuccess(null)}}>×</button>
        </div>
      )}

      <div className="admin-filters">
        <div className="filter-group search-container">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
            autoComplete="off"
            spellCheck="false"
          />
          {searchLoading && (
            <div className="search-loading" title="Searching...">
              ⏳
            </div>
          )}
          {searchTerm && !searchLoading && (
            <button onClick={clearSearch} className="search-clear" title="Clear search" type="button">
              ×
            </button>
          )}
        </div>

        <div className="filter-group">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="admin">Admins</option>
            <option value="artist">Artists</option>
            <option value="user">Regular Users</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Currently Banned</option>
            <option value="permanently_banned">Permanently Banned</option>
            <option value="paused">Currently Paused</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Followers</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-results">
                  {searchTerm || filterRole || filterStatus ? 'No users found matching your criteria' : 'No users found'}
                </td>
              </tr>
            ) : (
              users.map(user => {
                const status = getUserStatus(user);
                return (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info"
                      onClick={() => handleUserClick(user)}>
                        <UserAvatar user={user} />
                        <div>
                          <div className="user-name">{user.username}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${user.role === 'admin' ? 'admin' : user.isArtist ? 'artist' : 'user'}`}>
                        {getUserRole(user)}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: status.color }}
                        title={status.isPermanent ? 'Email permanently banned from registration' : status.until ? `Until: ${status.until}` : ''}
                      >
                        {status.text}
                      </span>
                    </td>
                    <td>{user.followers?.length || 0}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="view-button"
                          onClick={() => handleUserClick(user)}
                        >
                          View
                        </button>
                        {user.role !== 'admin' && (
                          <>
                            <button 
                              className={`ban-button ${(status.status === 'banned' || status.status === 'permanently_banned') ? 'unban' : ''}`}
                              onClick={() => handleActionClick(user, 'ban')}
                            >
                              {(status.status === 'banned' || status.status === 'permanently_banned') ? 'Unban' : 'Ban'}
                            </button>
                            <button 
                              className={`pause-button ${status.status === 'paused' ? 'unpause' : ''}`}
                              onClick={() => handleActionClick(user, 'pause')}
                            >
                              {status.status === 'paused' ? 'Unpause' : 'Pause'}
                            </button>
                            {status.status === 'permanently_badded' && (
                              <button 
                                className="restore-button"
                                onClick={() => handleActionClick(user, 'restore')}
                              >
                                Restore
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPagination(p => ({ ...p, current: p.current - 1 }))}
            disabled={pagination.current === 1}
          >
            ← Previous
          </button>
          
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setPagination(p => ({ ...p, current: page }))}
              className={pagination.current === page ? 'active' : ''}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setPagination(p => ({ ...p, current: p.current + 1 }))}
            disabled={pagination.current === pagination.pages}
          >
            Next →
          </button>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>
              {actionForm.action === 'ban' ? 'Ban User' : 
               actionForm.action === 'unban' ? 'Unban User' :
               actionForm.action === 'pause' ? 'Pause User' :
               actionForm.action === 'unpause' ? 'Unpause User' :
               'Restore User'}
            </h3>
            
            {actionError && (
              <div className="message-banner error">
                <span>{actionError}</span>
              </div>
            )}
            
            {actionSuccess && (
              <div className="message-banner success">
                <span>{actionSuccess}</span>
              </div>
            )}

            {(actionForm.action === 'ban' || actionForm.action === 'pause') && (
              <>
                <div className="form-group">
                  <label>Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    max={actionForm.action === 'ban' ? 365 : 90}
                    value={actionForm.duration}
                    onChange={(e) => setActionForm({...actionForm, duration: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Reason *</label>
                  <textarea
                    value={actionForm.reason}
                    onChange={(e) => setActionForm({...actionForm, reason: e.target.value})}
                    placeholder={`Reason for ${actionForm.action}...`}
                    required
                  />
                </div>
              </>
            )}

            {actionForm.action === 'restore' && (
              <div className="form-group">
                <label>Restoration Reason</label>
                <textarea
                  value={actionForm.reason}
                  onChange={(e) => setActionForm({...actionForm, reason: e.target.value})}
                  placeholder="Reason for full account restoration..."
                />
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => setShowActionModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleActionSubmit}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : `Confirm ${actionForm.action}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
      <div className="modal">
        <div className="modal-content">
          {/* Modal Header with Avatar */}
          <div className="modal-header-with-avatar">
            <UserAvatar user={selectedUser} size="80px"/>
          </div>
          
          {/* User Information Grid */}
          <div className="user-info-grid">
            <div className="form-group">
              <label>Username:</label>
              <p>{selectedUser.username}</p>
            </div>
            
            <div className="form-group">
              <label>Email:</label>
              <p>{selectedUser.email}</p>
            </div>
            
            <div className="form-group">
              <label>Role:</label>
              <p>{getUserRole(selectedUser)}</p>
            </div>
            
            <div className="form-group">
              <label>Status:</label>
              <p>{getUserStatus(selectedUser).text}</p>
            </div>
            
            <div className="form-group">
              <label>Followers:</label>
              <p>{selectedUser.followers?.length || 0}</p>
            </div>
            
            <div className="form-group">
              <label>Joined:</label>
              <p>{formatDate(selectedUser.createdAt)}</p>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              className="btn-secondary" 
              onClick={() => setShowUserModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default AdminUsers;