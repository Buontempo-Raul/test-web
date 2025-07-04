import React, { useState, useEffect } from 'react';

// Enhanced Admin API service
const adminAPI = {
  getAllUsers: (params = {}) => {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      role,
      status
    });
    
    return fetch(`/api/admin/users?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
  },

  banUser: (userId, data) => {
    return fetch(`/api/admin/users/${userId}/ban`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  pauseUser: (userId, data) => {
    return fetch(`/api/admin/users/${userId}/pause`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  fullyRestoreUser: (userId, data) => {
    return fetch(`/api/admin/users/${userId}/restore`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(res => res.json());
  }
};

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

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, filterRole, filterStatus, pagination.current]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
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
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setActionError('Failed to fetch users. Please try again.');
      setIsLoading(false);
    }
  };

  const getUserStatus = (user) => {
    const now = new Date();
    
    // Check current ban status
    if (user.banUntil && new Date(user.banUntil) > now) {
      return { 
        status: 'banned', 
        color: '#e74c3c', 
        text: user.permanentlyBanned ? 'Banned (Permanent Email Ban)' : 'Banned',
        isPermanent: user.permanentlyBanned
      };
    }
    
    // Check current pause status
    if (user.pauseUntil && new Date(user.pauseUntil) > now) {
      return { 
        status: 'paused', 
        color: '#f39c12', 
        text: 'Paused (Temporary)',
        isPermanent: false
      };
    }
    
    // Check if permanently banned but not currently restricted
    if (user.permanentlyBanned) {
      return { 
        status: 'permanently_banned', 
        color: '#8e44ad', 
        text: 'Email Permanently Banned',
        isPermanent: true
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleActionClick = (user, actionType) => {
    setSelectedUser(user);
    const userStatus = getUserStatus(user);
    
    let action = '';
    let defaultReason = '';
    
    if (actionType === 'ban') {
      action = userStatus.status === 'banned' ? 'unban' : 'ban';
      defaultReason = action === 'ban' ? 'Violation of community guidelines' : '';
    } else if (actionType === 'pause') {
      action = userStatus.status === 'paused' ? 'unpause' : 'pause';
      defaultReason = action === 'pause' ? 'Account under review' : '';
    } else if (actionType === 'restore') {
      action = 'restore';
      defaultReason = 'Admin decision to fully restore account';
    }
    
    setActionForm({
      action: action,
      type: actionType,
      duration: actionType === 'pause' ? 7 : 30,
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

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>User Management</h1>
        <p>Manage platform users with ban and pause controls</p>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color banned"></span>
            <span>Ban = Permanent email restriction</span>
          </div>
          <div className="legend-item">
            <span className="legend-color paused"></span>
            <span>Pause = Temporary restriction</span>
          </div>
        </div>
      </div>

      {(actionError || actionSuccess) && (
        <div className={`message-banner ${actionSuccess ? 'success' : 'error'}`}>
          <span>{actionSuccess || actionError}</span>
          <button onClick={() => {setActionError(null); setActionSuccess(null)}}>×</button>
        </div>
      )}

      <div className="admin-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
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
            {users.map(user => {
              const status = getUserStatus(user);
              return (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
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
                      title={status.isPermanent ? 'Email permanently banned from registration' : ''}
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
                            className={`ban-button ${status.status === 'banned' ? 'unban' : ''}`}
                            onClick={() => handleActionClick(user, 'ban')}
                          >
                            {status.status === 'banned' ? 'Unban' : 'Ban'}
                          </button>
                          <button 
                            className={`pause-button ${status.status === 'paused' ? 'unpause' : ''}`}
                            onClick={() => handleActionClick(user, 'pause')}
                          >
                            {status.status === 'paused' ? 'Unpause' : 'Pause'}
                          </button>
                          {user.permanentlyBanned && (
                            <button 
                              className="restore-button"
                              onClick={() => handleActionClick(user, 'restore')}
                              title="Fully restore account and allow email re-registration"
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
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setPagination({...pagination, current: pagination.current - 1})}
            disabled={pagination.current === 1}
          >
            Previous
          </button>
          <span>Page {pagination.current} of {pagination.pages}</span>
          <button 
            onClick={() => setPagination({...pagination, current: pagination.current + 1})}
            disabled={pagination.current === pagination.pages}
          >
            Next
          </button>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button onClick={() => setShowUserModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <div className="user-details">
                <div className="user-detail-avatar">
                  <UserAvatar user={selectedUser} size="80px" />
                </div>
                <div className="user-detail-info">
                  <h4>{selectedUser.username}</h4>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Role:</strong> {getUserRole(selectedUser)}</p>
                  <p><strong>Status:</strong> {getUserStatus(selectedUser).text}</p>
                  <p><strong>Followers:</strong> {selectedUser.followers?.length || 0}</p>
                  <p><strong>Joined:</strong> {formatDate(selectedUser.createdAt)}</p>
                  <p><strong>Last Login:</strong> {formatDate(selectedUser.lastLogin)}</p>
                  
                  {selectedUser.permanentlyBanned && (
                    <div className="permanent-ban-warning">
                      <p><strong>⚠️ Email Permanently Banned:</strong> This email cannot be used for new registrations</p>
                    </div>
                  )}
                  
                  {selectedUser.banUntil && new Date(selectedUser.banUntil) > new Date() && (
                    <div className="ban-info">
                      <p><strong>Banned until:</strong> {formatDate(selectedUser.banUntil)}</p>
                      <p><strong>Ban reason:</strong> {selectedUser.banReason}</p>
                    </div>
                  )}
                  
                  {selectedUser.pauseUntil && new Date(selectedUser.pauseUntil) > new Date() && (
                    <div className="pause-info">
                      <p><strong>Paused until:</strong> {formatDate(selectedUser.pauseUntil)}</p>
                      <p><strong>Pause reason:</strong> {selectedUser.pauseReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {actionForm.action === 'ban' && 'Ban User (Permanent Email Restriction)'}
                {actionForm.action === 'unban' && 'Unban User'}
                {actionForm.action === 'pause' && 'Pause User (Temporary Restriction)'}
                {actionForm.action === 'unpause' && 'Unpause User'}
                {actionForm.action === 'restore' && 'Fully Restore User'}
              </h3>
              <button onClick={() => setShowActionModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              {actionForm.action === 'ban' && (
                <div className="warning-box">
                  <p><strong>⚠️ Warning:</strong> Banning a user will permanently prevent this email from registering new accounts, even after the ban period expires.</p>
                </div>
              )}
              
              {actionForm.action === 'pause' && (
                <div className="info-box">
                  <p><strong>ℹ️ Info:</strong> Pausing is temporary. The user can return normally after the pause period without permanent restrictions.</p>
                </div>
              )}
              
              {actionForm.action === 'restore' && (
                <div className="info-box">
                  <p><strong>ℹ️ Info:</strong> This will fully restore the user account and allow the email to be used for new registrations if the account is deleted.</p>
                </div>
              )}

              {(actionForm.action === 'ban' || actionForm.action === 'pause') && (
                <>
                  <div className="form-group">
                    <label>Duration (days):</label>
                    <input
                      type="number"
                      min="1"
                      max={actionForm.action === 'ban' ? 365 : 90}
                      value={actionForm.duration}
                      onChange={(e) => setActionForm({...actionForm, duration: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Reason:</label>
                    <textarea
                      value={actionForm.reason}
                      onChange={(e) => setActionForm({...actionForm, reason: e.target.value})}
                      className="form-textarea"
                      placeholder={`Enter reason for ${actionForm.action}...`}
                      required
                    />
                  </div>
                </>
              )}
              
              {actionForm.action === 'restore' && (
                <div className="form-group">
                  <label>Reason for restoration:</label>
                  <textarea
                    value={actionForm.reason}
                    onChange={(e) => setActionForm({...actionForm, reason: e.target.value})}
                    className="form-textarea"
                    placeholder="Enter reason for full restoration..."
                  />
                </div>
              )}

              {actionError && (
                <div className="error-message">{actionError}</div>
              )}
              
              {actionSuccess && (
                <div className="success-message">{actionSuccess}</div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={handleActionSubmit} 
                  className="submit-button"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 
                   actionForm.action === 'ban' ? 'Ban User' :
                   actionForm.action === 'unban' ? 'Unban User' :
                   actionForm.action === 'pause' ? 'Pause User' :
                   actionForm.action === 'unpause' ? 'Unpause User' :
                   'Restore User'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowActionModal(false)} 
                  className="cancel-button"
                  disabled={actionLoading}
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
          margin: 0 0 1rem 0;
          color: #7f8c8d;
        }

        .legend {
          display: flex;
          gap: 2rem;
          margin-top: 0.5rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .legend-color.banned {
          background: #e74c3c;
        }

        .legend-color.paused {
          background: #f39c12;
        }

        .message-banner {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .message-banner.success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .message-banner.error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .message-banner button {
          background: none;
          border: none;
          color: inherit;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
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
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .role-badge.admin {
          background: #e74c3c;
          color: white;
        }

        .role-badge.artist {
          background: #9b59b6;
          color: white;
        }

        .role-badge.user {
          background: #3498db;
          color: white;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .view-button,
        .ban-button,
        .pause-button,
        .restore-button {
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

        .ban-button {
          background: #e74c3c;
          color: white;
        }

        .ban-button:hover {
          background: #c0392b;
        }

        .ban-button.unban {
          background: #27ae60;
        }

        .ban-button.unban:hover {
          background: #229954;
        }

        .pause-button {
          background: #f39c12;
          color: white;
        }

        .pause-button:hover {
          background: #e67e22;
        }

        .pause-button.unpause {
          background: #27ae60;
        }

        .pause-button.unpause:hover {
          background: #229954;
        }

        .restore-button {
          background: #8e44ad;
          color: white;
        }

        .restore-button:hover {
          background: #7d3c98;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .pagination button {
          padding: 0.5rem 1rem;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          border-radius: 4px;
        }

        .pagination button:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
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
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 1.5rem 1rem 1.5rem;
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
          color: #6c757d;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .close-button:hover {
          background-color: #f8f9fa;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .user-details {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .user-detail-info h4 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
        }

        .user-detail-info p {
          margin: 0.5rem 0;
          color: #666;
        }

        .permanent-ban-warning {
          background: #fff3cd;
          border: 1px solid #faebcc;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
        }

        .ban-info,
        .pause-info {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .warning-box {
          background: #fff3cd;
          border: 1px solid #faebcc;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .info-box {
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-textarea {
          min-height: 100px;
          resize: vertical;
        }

        .error-message {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .success-message {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .submit-button,
        .cancel-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-button:disabled,
        .cancel-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .submit-button {
          background: #667eea;
          color: white;
        }

        .submit-button:hover:not(:disabled) {
          background: #5a6fd8;
        }

        .cancel-button {
          background: #e9ecef;
          color: #6c757d;
        }

        .cancel-button:hover:not(:disabled) {
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
            min-width: 900px;
          }

          .action-buttons {
            flex-direction: column;
            gap: 0.25rem;
          }

          .modal-content {
            width: 95%;
            margin: 1rem;
          }

          .user-details {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .legend {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminUsers;