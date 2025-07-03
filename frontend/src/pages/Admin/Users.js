import React, { useState, useEffect } from 'react';

// Import the admin API service
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
  const [showBanModal, setShowBanModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [actionForm, setActionForm] = useState({
    action: '',
    duration: 7,
    reason: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, filterRole, filterStatus, pagination.current]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
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
      setIsLoading(false);
    }
  };

  const getUserStatus = (user) => {
    if (user.banUntil && new Date(user.banUntil) > new Date()) {
      return { status: 'banned', color: '#e74c3c', text: 'Banned' };
    }
    if (user.pauseUntil && new Date(user.pauseUntil) > new Date()) {
      return { status: 'paused', color: '#f39c12', text: 'Paused' };
    }
    if (!user.active) {
      return { status: 'inactive', color: '#95a5a6', text: 'Inactive' };
    }
    return { status: 'active', color: '#27ae60', text: 'Active' };
  };

  const getUserRole = (user) => {
    if (user.role === 'admin') return 'Admin';
    if (user.isArtist) return 'Artist';
    return 'User';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleBanClick = (user) => {
    setSelectedUser(user);
    setActionForm({
      action: user.banUntil && new Date(user.banUntil) > new Date() ? 'unban' : 'ban',
      duration: 7,
      reason: ''
    });
    setShowBanModal(true);
  };

  const handlePauseClick = (user) => {
    setSelectedUser(user);
    setActionForm({
      action: user.pauseUntil && new Date(user.pauseUntil) > new Date() ? 'unpause' : 'pause',
      duration: 7,
      reason: ''
    });
    setShowPauseModal(true);
  };

  const handleBanSubmit = async () => {
    try {
      const response = await adminAPI.banUser(selectedUser._id, {
        action: actionForm.action,
        duration: actionForm.duration,
        reason: actionForm.reason
      });

      if (response.success) {
        console.log('Ban action successful:', response);
        setShowBanModal(false);
        fetchUsers(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to update user ban status');
      }
    } catch (error) {
      console.error('Error with ban action:', error);
      // You could show an error message to the user here
    }
  };

  const handlePauseSubmit = async () => {
    try {
      const response = await adminAPI.pauseUser(selectedUser._id, {
        action: actionForm.action,
        duration: actionForm.duration,
        reason: actionForm.reason
      });

      if (response.success) {
        console.log('Pause action successful:', response);
        setShowPauseModal(false);
        fetchUsers(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to update user pause status');
      }
    } catch (error) {
      console.error('Error with pause action:', error);
      // You could show an error message to the user here
    }
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
        <p>Manage platform users, artists, and administrators</p>
      </div>

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
            <option value="banned">Banned</option>
            <option value="paused">Paused</option>
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
              <th>Last Login</th>
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
                      <div className="user-avatar">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
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
                    >
                      {status.text}
                    </span>
                  </td>
                  <td>{user.followers.length}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatDate(user.lastLogin)}</td>
                  <td className="action-buttons">
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
                          onClick={() => handleBanClick(user)}
                        >
                          {status.status === 'banned' ? 'Unban' : 'Ban'}
                        </button>
                        <button
                          className={`pause-button ${status.status === 'paused' ? 'unpause' : ''}`}
                          onClick={() => handlePauseClick(user)}
                        >
                          {status.status === 'paused' ? 'Unpause' : 'Pause'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
                <div className="detail-row">
                  <strong>Username:</strong> {selectedUser.username}
                </div>
                <div className="detail-row">
                  <strong>Email:</strong> {selectedUser.email}
                </div>
                <div className="detail-row">
                  <strong>Role:</strong> {getUserRole(selectedUser)}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getUserStatus(selectedUser).color, marginLeft: '8px' }}
                  >
                    {getUserStatus(selectedUser).text}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Followers:</strong> {selectedUser.followers.length}
                </div>
                <div className="detail-row">
                  <strong>Following:</strong> {selectedUser.following.length}
                </div>
                <div className="detail-row">
                  <strong>Joined:</strong> {formatDate(selectedUser.createdAt)}
                </div>
                <div className="detail-row">
                  <strong>Last Login:</strong> {formatDate(selectedUser.lastLogin)}
                </div>
                {selectedUser.banReason && (
                  <div className="detail-row">
                    <strong>Ban Reason:</strong> {selectedUser.banReason}
                  </div>
                )}
                {selectedUser.pauseReason && (
                  <div className="detail-row">
                    <strong>Pause Reason:</strong> {selectedUser.pauseReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="modal-overlay" onClick={() => setShowBanModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{actionForm.action === 'ban' ? 'Ban User' : 'Unban User'}</h3>
              <button onClick={() => setShowBanModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              {actionForm.action === 'ban' && (
                <>
                  <div className="form-group">
                    <label>Duration (days):</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
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
                      placeholder="Enter reason for ban..."
                      required
                    />
                  </div>
                </>
              )}
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={handleBanSubmit} 
                  className="submit-button"
                >
                  {actionForm.action === 'ban' ? 'Ban User' : 'Unban User'}
                </button>
                <button type="button" onClick={() => setShowBanModal(false)} className="cancel-button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="modal-overlay" onClick={() => setShowPauseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{actionForm.action === 'pause' ? 'Pause User' : 'Unpause User'}</h3>
              <button onClick={() => setShowPauseModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              {actionForm.action === 'pause' && (
                <>
                  <div className="form-group">
                    <label>Duration (days):</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
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
                      placeholder="Enter reason for pause..."
                      required
                    />
                  </div>
                </>
              )}
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={handlePauseSubmit} 
                  className="submit-button"
                >
                  {actionForm.action === 'pause' ? 'Pause User' : 'Unpause User'}
                </button>
                <button type="button" onClick={() => setShowPauseModal(false)} className="cancel-button">
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

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
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
        .pause-button {
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

        .user-details .detail-row {
          display: flex;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f8f9fa;
        }

        .user-details .detail-row:last-child {
          border-bottom: none;
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

        .submit-button {
          background: #667eea;
          color: white;
        }

        .submit-button:hover {
          background: #5a6fd8;
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
            min-width: 800px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .modal-content {
            width: 95%;
            margin: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminUsers;