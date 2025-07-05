import React, { useState, useEffect } from 'react';

// Admin API service
const adminAPI = {
  getAllPosts: (params = {}) => {
    const { page = 1, limit = 10, search = '' } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search
    });
    
    return fetch(`/api/admin/posts?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
  },

  deletePost: (postId) => {
    return fetch(`/api/admin/posts/${postId}`, {
      method: 'DELETE',
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

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionForm, setActionForm] = useState({
    action: '',
    type: '',
    duration: 7,
    reason: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchPosts();
  }, [searchTerm, pagination.current]);

  // Generate consistent color for username
  const generateAvatarColor = (username) => {
    if (!username) return '#6c757d';
    const colors = [
      '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#f1c40f',
      '#8e44ad', '#27ae60', '#2980b9', '#d35400', '#c0392b'
    ];
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // User Avatar Component
  const UserAvatar = ({ user, size = 40, clickable = false, onClick = null }) => {
    const [imageError, setImageError] = useState(false);
    
    const handleImageError = () => {
      setImageError(true);
    };

    const avatarStyle = {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.4}px`,
      fontWeight: '600',
      cursor: clickable ? 'pointer' : 'default',
      transition: 'all 0.2s ease'
    };

    if (!user?.profileImage || imageError) {
      return (
        <div 
          className={`user-avatar fallback ${clickable ? 'clickable' : ''}`}
          style={{ 
            ...avatarStyle,
            background: generateAvatarColor(user?.username || ''),
            color: 'white'
          }}
          onClick={clickable ? onClick : undefined}
        >
          {(user?.username || 'U').charAt(0).toUpperCase()}
        </div>
      );
    }

    return (
      <img 
        src={user.profileImage} 
        alt={user.username}
        className={`user-avatar image ${clickable ? 'clickable' : ''}`}
        style={avatarStyle}
        onError={handleImageError}
        onClick={clickable ? onClick : undefined}
      />
    );
  };

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await adminAPI.getAllPosts({
        page: pagination.current,
        limit: 10,
        search: searchTerm
      });

      if (response.success) {
        setPosts(response.posts || []);
        setPagination(response.pagination || { current: 1, pages: 1, total: 0 });
      } else {
        throw new Error(response.message || 'Failed to fetch posts');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error.message);
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

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Helper function to get the primary image from a post
  const getPostImage = (post) => {
    if (post.images && post.images.length > 0) {
      return post.images[0];
    }
    
    if (post.content) {
      if (post.content.url) {
        return post.content.url;
      }
      if (post.content.items && post.content.items.length > 0) {
        return post.content.items[0].url;
      }
    }
    
    return null;
  };

  // Helper function to get all images from a post
  const getAllPostImages = (post) => {
    if (post.images && post.images.length > 0) {
      return post.images;
    }
    
    if (post.content) {
      if (post.content.url) {
        return [post.content.url];
      }
      if (post.content.items && post.content.items.length > 0) {
        return post.content.items.map(item => item.url);
      }
    }
    
    return [];
  };

  const getPostStatus = (post) => {
    if (post.caption && (post.caption.toLowerCase().includes('inappropriate') || 
        post.caption.toLowerCase().includes('violates'))) {
      return { status: 'flagged', color: '#e74c3c', text: 'Flagged' };
    }
    
    if (post.linkedShopItems && post.linkedShopItems.length > 0) {
      return { status: 'commercial', color: '#f39c12', text: 'Commercial' };
    }
    
    return { status: 'normal', color: '#27ae60', text: 'Normal' };
  };

  const getUserStatus = (user) => {
    const now = new Date();
    
    if (user.banUntil && new Date(user.banUntil) > now) {
      return { 
        status: 'banned', 
        color: '#e74c3c', 
        text: user.permanentlyBanned ? 'Banned (Permanent)' : 'Banned',
        isPermanent: user.permanentlyBanned
      };
    }
    
    if (user.pauseUntil && new Date(user.pauseUntil) > now) {
      return { 
        status: 'paused', 
        color: '#f39c12', 
        text: 'Paused',
        isPermanent: false
      };
    }
    
    if (user.permanentlyBanned) {
      return { 
        status: 'permanently_banned', 
        color: '#8e44ad', 
        text: 'Email Banned',
        isPermanent: true
      };
    }
    
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

  const getPlaceholderImage = () => {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0yMCAyNy41QzI0LjE0MjEgMjcuNSAyNy41IDI0LjE0MjEgMjcuNSAyMEMyNy41IDE1Ljg1NzkgMjQuMTQyMSAxMi41IDIwIDEyLjVDMTUuODU3OSAxMi41IDEyLjUgMTUuODU3OSAxMi41IDIwQzEyLjUgMjQuMTQyMSAxNS44NTc5IDI3LjUgMjAgMjcuNVoiIGZpbGw9IiM2Qzc1N0QiLz4KPC9zdmc+';
  };

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const handleDeleteClick = (post) => {
    setSelectedPost(post);
    setShowDeleteModal(true);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleUserAction = (user, actionType) => {
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
    }
    
    setActionForm({
      action: action,
      type: actionType,
      duration: actionType === 'pause' ? 7 : 30,
      reason: defaultReason
    });
    setShowUserModal(false);
    setShowActionModal(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleActionSubmit = async () => {
    const { action, type, duration, reason } = actionForm;
    
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
      }

      if (response.success) {
        setActionSuccess(response.message);
        setTimeout(() => {
          setShowActionModal(false);
          setActionSuccess(null);
          fetchPosts(); // Refresh the list
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

  const handleDeleteConfirm = async () => {
    try {
      const response = await adminAPI.deletePost(selectedPost._id);

      if (response.success) {
        setPosts(posts.filter(post => post._id !== selectedPost._id));
        setShowDeleteModal(false);
        setSelectedPost(null);
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      } else {
        throw new Error(response.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post. Please try again.');
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h3>Error Loading Posts</h3>
        <p>{error}</p>
        <button onClick={fetchPosts} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Posts Management</h1>
        <p>Monitor and manage user posts across the platform</p>
      </div>

      <div className="admin-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search posts, users, or tags..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        <div className="stats-info">
          <span>{pagination.total} total posts</span>
        </div>
      </div>

      <div className="posts-table-container">
        <table className="posts-table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Creator</th>
              <th>Engagement</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-posts">
                  {searchTerm ? 'No posts found matching your search.' : 'No posts available.'}
                </td>
              </tr>
            ) : (
              posts.map(post => {
                const status = getPostStatus(post);
                const postImage = getPostImage(post);
                const userStatus = getUserStatus(post.creator || {});
                
                return (
                  <tr key={post._id} className="post-row">
                    <td>
                      <div className="post-preview">
                        <div className="post-image-container">
                          <img 
                            src={postImage || getPlaceholderImage()} 
                            alt="Post preview"
                            className="post-thumbnail"
                            onError={(e) => {
                              e.target.src = getPlaceholderImage();
                            }}
                          />
                        </div>
                        <div className="post-details">
                          <p className="post-caption">
                            {truncateText(post.caption || 'No caption', 60)}
                          </p>
                          <span className="post-meta">ID: {post._id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="creator-section">
                        <div className="creator-profile" onClick={() => handleUserClick(post.creator)}>
                          <UserAvatar 
                            user={post.creator} 
                            size={44} 
                            clickable={true}
                          />
                          <div className="creator-info">
                            <span className="creator-name">
                              {post.creator?.username || 'Unknown User'}
                            </span>
                            <span className="creator-email">
                              {post.creator?.email || 'No email'}
                            </span>
                            {userStatus.status !== 'active' && (
                              <span 
                                className="user-status-mini"
                                style={{ color: userStatus.color }}
                              >
                                {userStatus.text}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="engagement-mini">
                        <span className="engagement-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          {post.likes?.length || 0}
                        </span>
                        <span className="engagement-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21,6H3A1,1 0 0,0 2,7V17A1,1 0 0,0 3,18H21A1,1 0 0,0 22,17V7A1,1 0 0,0 21,6M12,11L6.5,7.5H17.5L12,11Z"/>
                          </svg>
                          {post.comments?.length || 0}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="status-badge modern"
                        style={{ 
                          backgroundColor: `${status.color}15`,
                          color: status.color,
                          border: `1px solid ${status.color}30`
                        }}
                      >
                        {status.text}
                      </span>
                    </td>
                    <td>
                      <span className="date-text">{formatDate(post.createdAt)}</span>
                    </td>
                    <td>
                      <div className="action-buttons modern">
                        <button 
                          onClick={() => handleViewPost(post)}
                          className="action-btn view-btn"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                          </svg>
                          View
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(post)}
                          className="action-btn delete-btn"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                          </svg>
                          Delete
                        </button>
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
            onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
            disabled={pagination.current === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.current} of {pagination.pages}
          </span>
          <button 
            onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
            disabled={pagination.current === pagination.pages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      {/* Enhanced Post Detail Modal */}
      {showPostModal && selectedPost && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Post Details</h3>
              <button onClick={() => setShowPostModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <div className="post-detail-layout">
                {/* Left side - Images */}
                <div className="post-images-section">
                  <h4>Images ({getAllPostImages(selectedPost).length})</h4>
                  <div className="post-images-grid">
                    {getAllPostImages(selectedPost).length > 0 ? (
                      getAllPostImages(selectedPost).map((image, index) => (
                        <img 
                          key={index}
                          src={image} 
                          alt={`Post image ${index + 1}`}
                          className="post-detail-image"
                          onError={(e) => {
                            e.target.src = getPlaceholderImage();
                          }}
                        />
                      ))
                    ) : (
                      <div className="no-images">No images available</div>
                    )}
                  </div>
                </div>

                {/* Right side - Information */}
                <div className="post-info-section">
                  <div className="info-card">
                    <h4>Post Information</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Caption:</label>
                        <p>{selectedPost.caption || 'No caption provided'}</p>
                      </div>
                      <div className="info-item">
                        <label>Post ID:</label>
                        <p className="monospace">{selectedPost._id}</p>
                      </div>
                      <div className="info-item">
                        <label>Created:</label>
                        <p>{formatDate(selectedPost.createdAt)}</p>
                      </div>
                      <div className="info-item">
                        <label>Status:</label>
                        <p>
                          <span 
                            className="status-badge modern"
                            style={{ 
                              backgroundColor: `${getPostStatus(selectedPost).color}15`,
                              color: getPostStatus(selectedPost).color,
                              border: `1px solid ${getPostStatus(selectedPost).color}30`
                            }}
                          >
                            {getPostStatus(selectedPost).text}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="info-card">
                    <h4>Creator Information</h4>
                    <div className="creator-detail">
                      <UserAvatar user={selectedPost.creator} size={60} />
                      <div className="creator-details">
                        <h5>{selectedPost.creator?.username || 'Unknown User'}</h5>
                        <p>{selectedPost.creator?.email || 'No email'}</p>
                        <p className="join-date">
                          Joined: {selectedPost.creator?.createdAt ? formatDate(selectedPost.creator.createdAt) : 'Unknown'}
                        </p>
                        {selectedPost.creator && (
                          <button 
                            onClick={() => handleUserClick(selectedPost.creator)}
                            className="view-profile-btn"
                          >
                            View Profile
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="info-card">
                    <h4>Engagement Stats</h4>
                    <div className="engagement-stats">
                      <div className="stat-item">
                        <span className="stat-number">{selectedPost.likes?.length || 0}</span>
                        <span className="stat-label">Likes</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{selectedPost.comments?.length || 0}</span>
                        <span className="stat-label">Comments</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{getAllPostImages(selectedPost).length}</span>
                        <span className="stat-label">Images</span>
                      </div>
                    </div>
                  </div>

                  {selectedPost.linkedShopItems && selectedPost.linkedShopItems.length > 0 && (
                    <div className="info-card">
                      <h4>Linked Products</h4>
                      <p>{selectedPost.linkedShopItems.length} product(s) linked to this post</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Profile</h3>
              <button onClick={() => setShowUserModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <div className="user-profile-section">
                <div className="profile-header">
                  <UserAvatar user={selectedUser} size={80} />
                  <div className="profile-info">
                    <h4>{selectedUser.username}</h4>
                    <p className="email">{selectedUser.email}</p>
                    <p className="join-date">Joined: {formatDate(selectedUser.createdAt)}</p>
                    <span 
                      className="status-badge modern"
                      style={{ 
                        backgroundColor: `${getUserStatus(selectedUser).color}15`,
                        color: getUserStatus(selectedUser).color,
                        border: `1px solid ${getUserStatus(selectedUser).color}30`
                      }}
                    >
                      {getUserStatus(selectedUser).text}
                    </span>
                  </div>
                </div>

                <div className="profile-actions">
                  <h5>Admin Actions</h5>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleUserAction(selectedUser, 'pause')}
                      className="action-btn pause-btn"
                    >
                      {getUserStatus(selectedUser).status === 'paused' ? 'Unpause' : 'Pause'} User
                    </button>
                    <button 
                      onClick={() => handleUserAction(selectedUser, 'ban')}
                      className="action-btn ban-btn"
                    >
                      {getUserStatus(selectedUser).status === 'banned' ? 'Unban' : 'Ban'} User
                    </button>
                  </div>
                </div>

                {selectedUser.banUntil && new Date(selectedUser.banUntil) > new Date() && (
                  <div className="restriction-info">
                    <h5>Ban Information</h5>
                    <p><strong>Banned until:</strong> {formatDate(selectedUser.banUntil)}</p>
                    <p><strong>Reason:</strong> {selectedUser.banReason || 'No reason provided'}</p>
                  </div>
                )}

                {selectedUser.pauseUntil && new Date(selectedUser.pauseUntil) > new Date() && (
                  <div className="restriction-info">
                    <h5>Pause Information</h5>
                    <p><strong>Paused until:</strong> {formatDate(selectedUser.pauseUntil)}</p>
                    <p><strong>Reason:</strong> {selectedUser.pauseReason || 'No reason provided'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {actionForm.action === 'ban' && 'Ban User'}
                {actionForm.action === 'unban' && 'Unban User'}
                {actionForm.action === 'pause' && 'Pause User'}
                {actionForm.action === 'unpause' && 'Unpause User'}
              </h3>
              <button onClick={() => setShowActionModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              {actionForm.action === 'ban' && (
                <div className="warning-box">
                  <p><strong>⚠️ Warning:</strong> Banning will permanently prevent this email from registering new accounts.</p>
                </div>
              )}
              
              {actionForm.action === 'pause' && (
                <div className="info-box">
                  <p><strong>ℹ️ Info:</strong> Pausing is temporary and fully reversible.</p>
                </div>
              )}

              {(actionForm.action === 'ban' || actionForm.action === 'pause') && (
                <>
                  <div className="form-group">
                    <label>Duration (days):</label>
                    <input
                      type="number"
                      min="1"
                      max={actionForm.action === 'ban' ? "365" : "90"}
                      value={actionForm.duration}
                      onChange={(e) => setActionForm(prev => ({ ...prev, duration: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Reason:</label>
                    <textarea
                      value={actionForm.reason}
                      onChange={(e) => setActionForm(prev => ({ ...prev, reason: e.target.value }))}
                      rows="3"
                      placeholder="Provide a reason for this action..."
                    />
                  </div>
                </>
              )}

              {actionError && (
                <div className="error-message">{actionError}</div>
              )}

              {actionSuccess && (
                <div className="success-message">{actionSuccess}</div>
              )}

              <div className="form-actions">
                <button 
                  onClick={() => setShowActionModal(false)}
                  className="cancel-button"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleActionSubmit}
                  className={`confirm-button ${actionForm.action}`}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 
                   actionForm.action === 'ban' ? 'Ban User' :
                   actionForm.action === 'unban' ? 'Unban User' :
                   actionForm.action === 'pause' ? 'Pause User' :
                   'Unpause User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPost && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <p className="warning-text">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="delete-preview">
                <strong>Post ID:</strong> {selectedPost._id}<br/>
                <strong>Creator:</strong> {selectedPost.creator?.username || 'Unknown'}<br/>
                <strong>Caption:</strong> {truncateText(selectedPost.caption || 'No caption', 100)}
              </div>
              <div className="form-actions">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  className="confirm-button delete"
                >
                  Delete Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-page {
          padding: 1.5rem;
          max-width: 1600px;
          margin: 0 auto;
          background: #f8fafc;
          min-height: 100vh;
        }

        .admin-header {
          margin-bottom: 2rem;
          background: white;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .admin-header h1 {
          color: #1e293b;
          margin-bottom: 0.5rem;
          font-size: 2rem;
          font-weight: 700;
        }

        .admin-header p {
          color: #64748b;
          font-size: 1.1rem;
        }

        .admin-filters {
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .search-input {
          padding: 0.875rem 1.25rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s ease;
          min-width: 300px;
          background: #f8fafc;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .stats-info {
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .posts-table-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .posts-table {
          width: 100%;
          border-collapse: collapse;
        }

        .posts-table th {
          background: #f8fafc;
          padding: 1.25rem 1.5rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .posts-table td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .post-row {
          transition: background-color 0.15s ease;
        }

        .post-row:hover {
          background-color: #f8fafc;
        }

        .post-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .post-image-container {
          flex-shrink: 0;
        }

        .post-thumbnail {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: 12px;
          border: 2px solid #f1f5f9;
          transition: all 0.2s ease;
        }

        .post-thumbnail:hover {
          border-color: #e2e8f0;
          transform: scale(1.05);
        }

        .post-details {
          flex: 1;
          min-width: 0;
        }

        .post-caption {
          margin: 0 0 0.5rem 0;
          font-weight: 500;
          color: #1e293b;
          line-height: 1.4;
        }

        .post-meta {
          font-size: 0.8rem;
          color: #64748b;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
        }

        .creator-section {
          min-width: 200px;
        }

        .creator-profile {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .creator-profile:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        .user-avatar.clickable:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .creator-info {
          flex: 1;
          min-width: 0;
        }

        .creator-name {
          display: block;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.25rem;
          font-size: 0.95rem;
        }

        .creator-email {
          display: block;
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .user-status-mini {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .engagement-mini {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .engagement-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }

        .engagement-item svg {
          opacity: 0.7;
        }

        .status-badge.modern {
          padding: 0.5rem 0.875rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .date-text {
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .action-buttons.modern {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-btn {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .view-btn:hover {
          background: #bfdbfe;
          transform: translateY(-1px);
        }

        .delete-btn {
          background: #fee2e2;
          color: #dc2626;
        }

        .delete-btn:hover {
          background: #fecaca;
          transform: translateY(-1px);
        }

        .no-posts {
          text-align: center;
          color: #64748b;
          font-style: italic;
          padding: 3rem;
          background: #f8fafc;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .pagination-button {
          padding: 0.75rem 1.5rem;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .pagination-button:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          color: #64748b;
          font-weight: 500;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .modal-content.large {
          max-width: 1200px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .modal-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #64748b;
          padding: 0.25rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          color: #374151;
          background: #f1f5f9;
        }

        .modal-body {
          padding: 2rem;
        }

        .post-detail-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 2rem;
        }

        .post-images-section h4 {
          margin: 0 0 1rem 0;
          color: #374151;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .post-images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }

        .post-detail-image {
          width: 300%;
          height:600px;
          object-fit: cover;
          border-radius: 12px;
          border: 2px solid #f1f5f9;
          transition: all 0.2s ease;
        }

        .post-detail-image:hover {
          border-color: #e2e8f0;
          transform: scale(1.02);
        }

        .no-images {
          color: #64748b;
          font-style: italic;
          text-align: center;
          padding: 2rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 2px dashed #e2e8f0;
        }

        .info-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border: 1px solid #f1f5f9;
        }

        .info-card h4 {
          margin: 0 0 1rem 0;
          color: #374151;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .info-grid {
          display: grid;
          gap: 1rem;
        }

        .info-item {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 1rem;
          align-items: start;
        }

        .info-item label {
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
        }

        .info-item p {
          margin: 0;
          color: #64748b;
          word-break: break-word;
        }

        .monospace {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
          font-size: 0.85rem;
        }

        .creator-detail {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .creator-details h5 {
          margin: 0 0 0.5rem 0;
          color: #1e293b;
          font-size: 1.1rem;
        }

        .creator-details p {
          margin: 0 0 0.25rem 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .join-date {
          font-size: 0.8rem !important;
        }

        .view-profile-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          margin-top: 0.5rem;
          transition: all 0.2s ease;
        }

        .view-profile-btn:hover {
          background: #2563eb;
        }

        .engagement-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .stat-item {
          text-align: center;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .user-profile-section {
          max-width: 500px;
        }

        .profile-header {
          display: flex;
          gap: 1.5rem;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 12px;
        }

        .profile-info h4 {
          margin: 0 0 0.5rem 0;
          color: #1e293b;
          font-size: 1.25rem;
        }

        .profile-info .email {
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        .profile-actions {
          margin-bottom: 2rem;
        }

        .profile-actions h5 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .profile-actions .action-buttons {
          display: flex;
          gap: 1rem;
        }

        .pause-btn {
          background: #fed7aa;
          color: #ea580c;
        }

        .pause-btn:hover {
          background: #fdba74;
        }

        .ban-btn {
          background: #fecaca;
          color: #dc2626;
        }

        .ban-btn:hover {
          background: #fca5a5;
        }

        .restriction-info {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .restriction-info h5 {
          margin: 0 0 0.5rem 0;
          color: #dc2626;
        }

        .restriction-info p {
          margin: 0 0 0.25rem 0;
          color: #374151;
          font-size: 0.9rem;
        }

        .warning-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .info-box {
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .error-message {
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 0.75rem;
          margin: 1rem 0;
          font-size: 0.9rem;
        }

        .success-message {
          color: #059669;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 6px;
          padding: 0.75rem;
          margin: 1rem 0;
          font-size: 0.9rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .cancel-button,
        .confirm-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .cancel-button {
          background: #f1f5f9;
          color: #64748b;
        }

        .cancel-button:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .confirm-button {
          color: white;
        }

        .confirm-button.ban {
          background: #dc2626;
        }

        .confirm-button.ban:hover:not(:disabled) {
          background: #b91c1c;
        }

        .confirm-button.unban {
          background: #059669;
        }

        .confirm-button.unban:hover:not(:disabled) {
          background: #047857;
        }

        .confirm-button.pause {
          background: #ea580c;
        }

        .confirm-button.pause:hover:not(:disabled) {
          background: #c2410c;
        }

        .confirm-button.unpause {
          background: #059669;
        }

        .confirm-button.unpause:hover:not(:disabled) {
          background: #047857;
        }

        .confirm-button.delete {
          background: #dc2626;
        }

        .confirm-button.delete:hover:not(:disabled) {
          background: #b91c1c;
        }

        .confirm-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .warning-text {
          color: #dc2626;
          font-weight: 500;
          margin: 1rem 0;
        }

        .delete-preview {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
          border-left: 4px solid #dc2626;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .admin-loading,
        .admin-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .retry-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          margin-top: 1rem;
          transition: all 0.2s ease;
        }

        .retry-button:hover {
          background: #2563eb;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .post-detail-layout {
            grid-template-columns: 1fr;
          }

          .engagement-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .admin-page {
            padding: 1rem;
          }

          .admin-filters {
            flex-direction: column;
            align-items: stretch;
          }

          .search-input {
            min-width: auto;
          }

          .posts-table-container {
            overflow-x: auto;
          }

          .posts-table {
            min-width: 900px;
          }

          .modal-content {
            width: 95%;
            margin: 1rem;
          }

          .creator-profile {
            flex-direction: column;
            text-align: center;
          }

          .action-buttons {
            flex-direction: column;
          }

          .form-actions {
            flex-direction: column;
          }

          .pagination {
            flex-direction: column;
            gap: 0.5rem;
          }

          .profile-header {
            flex-direction: column;
            text-align: center;
          }

          .info-item {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPosts;