import React, { useState, useEffect } from 'react';

// Import the admin API service
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
  }
};

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchPosts();
  }, [searchTerm, pagination.current]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      
      const response = await adminAPI.getAllPosts({
        page: pagination.current,
        limit: 10,
        search: searchTerm
      });

      if (response.success) {
        setPosts(response.posts);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch posts');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
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
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const handleDeleteClick = (post) => {
    setSelectedPost(post);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await adminAPI.deletePost(selectedPost._id);

      if (response.success) {
        console.log('Post deleted successfully:', response);
        // Remove from local state
        setPosts(posts.filter(post => post._id !== selectedPost._id));
        setShowDeleteModal(false);
        setSelectedPost(null);
      } else {
        throw new Error(response.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      // You could show an error message to the user here
    }
  };

  const getPostStatus = (post) => {
    // Check for potential issues
    if (post.caption.toLowerCase().includes('inappropriate') || 
        post.caption.toLowerCase().includes('violates')) {
      return { status: 'flagged', color: '#e74c3c', text: 'Flagged' };
    }
    
    if (post.linkedShopItems && post.linkedShopItems.length > 0) {
      return { status: 'commercial', color: '#f39c12', text: 'Commercial' };
    }
    
    return { status: 'normal', color: '#27ae60', text: 'Normal' };
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading posts...</p>
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
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
            {posts.map(post => {
              const status = getPostStatus(post);
              return (
                <tr key={post._id}>
                  <td>
                    <div className="post-preview">
                      <div className="post-image">
                        <img 
                          src={post.content[0]} 
                          alt="Post preview"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0yMCAyNy41QzI0LjE0MjEgMjcuNSAyNy41IDI0LjE0MjEgMjcuNSAyMEMyNy41IDE1Ljg1NzkgMjQuMTQyMSAxMi41IDIwIDEyLjVDMTUuODU3OSAxMi41IDEyLjUgMTUuODU3OSAxMi41IDIwQzEyLjUgMjQuMTQyMSAxNS44NTc5IDI3LjUgMjAgMjcuNVoiIGZpbGw9IiM2Qzc1N0QiLz4KPC9zdmc+';
                          }}
                        />
                      </div>
                      <div className="post-content">
                        <div className="post-caption">
                          {truncateText(post.caption)}
                        </div>
                        <div className="post-tags">
                          {post.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="tag">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="creator-info">
                      <div className="creator-avatar">
                        {post.creator.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="creator-name">{post.creator.username}</div>
                        <div className="creator-email">{post.creator.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="engagement-stats">
                      <div className="stat">
                        <span className="stat-icon">❤️</span>
                        <span>{post.likes}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-icon">💬</span>
                        <span>{post.comments.length}</span>
                      </div>
                      {post.linkedShopItems.length > 0 && (
                        <div className="stat">
                          <span className="stat-icon">🛒</span>
                          <span>{post.linkedShopItems.length}</span>
                        </div>
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
                  <td>{formatDate(post.createdAt)}</td>
                  <td className="action-buttons">
                    <button
                      className="view-button"
                      onClick={() => handleViewPost(post)}
                    >
                      View
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteClick(post)}
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

      {/* Post Details Modal */}
      {showPostModal && selectedPost && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Post Details</h3>
              <button onClick={() => setShowPostModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <div className="post-detail">
                <div className="post-detail-image">
                  <img 
                    src={selectedPost.content[0]} 
                    alt="Post content"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0xMDAgMTM3LjVDMTIwLjcxMSAxMzcuNSAxMzcuNSAxMjAuNzExIDEzNy41IDEwMEMxMzcuNSA3OS4yODkzIDEyMC43MTEgNjIuNSAxMDAgNjIuNUM3OS4yODkzIDYyLjUgNjIuNSA3OS4yODkzIDYyLjUgMTAwQzYyLjUgMTIwLjcxMSA3OS4yODkzIDEzNy41IDEwMCAxMzcuNVoiIGZpbGw9IiM2Qzc1N0QiLz4KPC9zdmc+';
                    }}
                  />
                </div>
                <div className="post-detail-content">
                  <div className="detail-section">
                    <h4>Creator</h4>
                    <div className="creator-info">
                      <div className="creator-avatar">
                        {selectedPost.creator.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="creator-name">{selectedPost.creator.username}</div>
                        <div className="creator-email">{selectedPost.creator.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Caption</h4>
                    <p className="post-caption-full">{selectedPost.caption}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Tags</h4>
                    <div className="post-tags">
                      {selectedPost.tags.map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Engagement</h4>
                    <div className="engagement-detail">
                      <div className="engagement-item">
                        <span className="engagement-label">Likes:</span>
                        <span className="engagement-value">{selectedPost.likes}</span>
                      </div>
                      <div className="engagement-item">
                        <span className="engagement-label">Comments:</span>
                        <span className="engagement-value">{selectedPost.comments.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedPost.linkedShopItems.length > 0 && (
                    <div className="detail-section">
                      <h4>Linked Products</h4>
                      <div className="linked-products">
                        {selectedPost.linkedShopItems.map(item => (
                          <div key={item._id} className="linked-product">
                            <span className="product-title">{item.title}</span>
                            <span className="product-price">${item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="detail-section">
                    <h4>Comments</h4>
                    <div className="comments-list">
                      {selectedPost.comments.length > 0 ? (
                        selectedPost.comments.map((comment, index) => (
                          <div key={index} className="comment-item">
                            <span className="comment-user">{comment.user.username}:</span>
                            <span className="comment-text">{comment.text}</span>
                          </div>
                        ))
                      ) : (
                        <p className="no-comments">No comments yet</p>
                      )}
                    </div>
                  </div>
                </div>
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
              <h3>Delete Post</h3>
              <button onClick={() => setShowDeleteModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this post by <strong>{selectedPost.creator.username}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
              
              <div className="delete-preview">
                <div className="post-preview small">
                  <div className="post-image">
                    <img 
                      src={selectedPost.content[0]} 
                      alt="Post preview"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0yMCAyNy41QzI0LjE0MjEgMjcuNSAyNy41IDI0LjE0MjEgMjcuNSAyMEMyNy41IDE1Ljg1NzkgMjQuMTQyMSAxMi41IDIwIDEyLjVDMTUuODU3OSAxMi41IDEyLjUgMTUuODU3OSAxMi41IDIwQzEyLjUgMjQuMTQyMSAxNS44NTc5IDI3LjUgMjAgMjcuNVoiIGZpbGw9IiM2Qzc1N0QiLz4KPC9zdmc+';
                      }}
                    />
                  </div>
                  <div className="post-content">
                    <div className="post-caption">
                      {truncateText(selectedPost.caption, 60)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  onClick={handleDeleteConfirm} 
                  className="delete-confirm-button"
                >
                  Delete Post
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
          min-width: 300px;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .search-input:focus {
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

        .post-preview {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          max-width: 400px;
        }

        .post-preview.small {
          max-width: 300px;
        }

        .post-image {
          flex-shrink: 0;
        }

        .post-image img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
        }

        .post-content {
          flex: 1;
          min-width: 0;
        }

        .post-caption {
          color: #2c3e50;
          font-size: 0.9rem;
          line-height: 1.4;
          margin-bottom: 0.5rem;
        }

        .post-tags {
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
          max-width: 800px;
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

        .post-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .post-detail-image img {
          width: 100%;
          max-width: 300px;
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

        .post-caption-full {
          margin: 0;
          line-height: 1.5;
          color: #495057;
        }

        .engagement-detail {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .engagement-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .engagement-label {
          color: #6c757d;
        }

        .engagement-value {
          font-weight: 600;
          color: #2c3e50;
        }

        .linked-products {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .linked-product {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .product-title {
          font-weight: 500;
        }

        .product-price {
          font-weight: 600;
          color: #27ae60;
        }

        .comments-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .comment-item {
          padding: 0.5rem 0;
          border-bottom: 1px solid #f8f9fa;
        }

        .comment-item:last-child {
          border-bottom: none;
        }

        .comment-user {
          font-weight: 600;
          color: #2c3e50;
          margin-right: 0.5rem;
        }

        .comment-text {
          color: #495057;
        }

        .no-comments {
          color: #7f8c8d;
          font-style: italic;
          margin: 0;
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
          .admin-table-container {
            overflow-x: auto;
          }

          .admin-table {
            min-width: 900px;
          }

          .modal-content {
            width: 95%;
            margin: 1rem;
          }

          .post-detail {
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

export default AdminPosts;