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

  // FIXED: Helper function to get the primary image from a post
  const getPostImage = (post) => {
    // Check for images array first (new format)
    if (post.images && post.images.length > 0) {
      return post.images[0];
    }
    
    // Check for content field (old format)
    if (post.content) {
      if (post.content.url) {
        return post.content.url;
      }
      if (post.content.items && post.content.items.length > 0) {
        return post.content.items[0].url;
      }
    }
    
    // Return placeholder if no image found
    return null;
  };

  // FIXED: Helper function to get all images from a post
  const getAllPostImages = (post) => {
    // Check for images array first (new format)
    if (post.images && post.images.length > 0) {
      return post.images;
    }
    
    // Check for content field (old format)
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

  const getPlaceholderImage = () => {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0yMCAyNy41QzI0LjE0MjEgMjcuNSAyNy41IDI0LjE0MjEgMjcuNSAyMEMyNy41IDE1Ljg1NzkgMjQuMTQyMSAxMi41IDIwIDEyLjVDMTUuODU3OSAxMi41IDEyLjUgMTUuODU3OSAxMi41IDIwQzEyLjUgMjQuMTQyMSAxNS44NTc5IDI3LjUgMjAgMjcuNVoiIGZpbGw9IiM2Qzc1N0QiLz4KPC9zdmc+';
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
              const primaryImage = getPostImage(post);
              
              return (
                <tr key={post._id}>
                  <td>
                    <div className="post-preview">
                      <div className="post-image">
                        <img 
                          src={primaryImage || getPlaceholderImage()} 
                          alt="Post preview"
                          onError={(e) => {
                            e.target.src = getPlaceholderImage();
                          }}
                        />
                      </div>
                      <div className="post-content">
                        <div className="post-caption">
                          {truncateText(post.caption)}
                        </div>
                        <div className="post-tags">
                          {post.tags && post.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="tag">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="creator-info">
                      <div className="creator-avatar">
                        {post.creator?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="creator-details">
                        <div className="creator-name">{post.creator?.username || 'Unknown User'}</div>
                        <div className="creator-email">{post.creator?.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="engagement-stats">
                      <div className="stat">
                        <span className="stat-icon">❤️</span>
                        <span>{post.likes || 0}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-icon">💬</span>
                        <span>{post.comments ? post.comments.length : 0}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ 
                        background: status.color,
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      {status.text}
                    </span>
                  </td>
                  <td>{formatDate(post.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleViewPost(post)}
                        className="view-button"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(post)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FIXED: Post Detail Modal */}
      {showPostModal && selectedPost && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Post Details</h3>
              <button onClick={() => setShowPostModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <div className="post-detail">
                {/* FIXED: Post Images Section - Full Width */}
                <div className="post-images-section">
                  <h4>Images ({getAllPostImages(selectedPost).length})</h4>
                  <div className="post-images-grid">
                    {getAllPostImages(selectedPost).length > 0 ? (
                      getAllPostImages(selectedPost).map((imageUrl, index) => (
                        <div key={index} className="post-image-item">
                          <img 
                            src={imageUrl} 
                            alt={`Post image ${index + 1}`}
                            onError={(e) => {
                              e.target.src = getPlaceholderImage();
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="no-images">
                        <img src={getPlaceholderImage()} alt="No image available" />
                        <p>No images available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Two-column layout for detailed information */}
                <div className="post-detail-content">
                  <div className="post-info-left">
                    <div className="info-section">
                      <h4>Creator Information</h4>
                      <div className="creator-info">
                        <div className="creator-avatar">
                          {selectedPost.creator?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="creator-details">
                          <div className="creator-name">{selectedPost.creator?.username || 'Unknown User'}</div>
                          <div className="creator-email">{selectedPost.creator?.email || 'No email'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="info-section">
                      <h4>Post Details</h4>
                      <div className="detail-item">
                        <strong>Caption:</strong>
                        <p>{selectedPost.caption || 'No caption'}</p>
                      </div>
                      <div className="detail-item">
                        <strong>Tags:</strong>
                        <div className="post-tags">
                          {selectedPost.tags && selectedPost.tags.length > 0 ? (
                            selectedPost.tags.map(tag => (
                              <span key={tag} className="tag">#{tag}</span>
                            ))
                          ) : (
                            <span className="no-tags">No tags</span>
                          )}
                        </div>
                      </div>
                      <div className="detail-item">
                        <strong>Created:</strong>
                        <p>{formatDate(selectedPost.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="post-info-right">
                    <div className="info-section">
                      <h4>Engagement</h4>
                      <div className="engagement-stats">
                        <div className="stat">
                          <span className="stat-icon">❤️</span>
                          <span>{selectedPost.likes || 0} likes</span>
                        </div>
                        <div className="stat">
                          <span className="stat-icon">💬</span>
                          <span>{selectedPost.comments ? selectedPost.comments.length : 0} comments</span>
                        </div>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="info-section">
                      <h4>Comments ({selectedPost.comments ? selectedPost.comments.length : 0})</h4>
                      <div className="comments-list">
                        {selectedPost.comments && selectedPost.comments.length > 0 ? (
                          selectedPost.comments.map((comment, index) => (
                            <div key={index} className="comment-item">
                              <span className="comment-user">{comment.user?.username || 'Unknown User'}:</span>
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
              <p>Are you sure you want to delete this post by <strong>{selectedPost.creator?.username || 'Unknown User'}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
              
              <div className="delete-preview">
                <div className="post-preview small">
                  <div className="post-image">
                    <img 
                      src={getPostImage(selectedPost) || getPlaceholderImage()} 
                      alt="Post preview"
                      onError={(e) => {
                        e.target.src = getPlaceholderImage();
                      }}
                    />
                  </div>
                  <div className="post-content">
                    <div className="post-caption">
                      {truncateText(selectedPost.caption)}
                    </div>
                  </div>
                </div>
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
                  className="delete-confirm-button"
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
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .admin-header {
          margin-bottom: 2rem;
        }

        .admin-header h1 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .admin-header p {
          color: #7f8c8d;
        }

        .admin-filters {
          margin-bottom: 2rem;
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .search-input {
          padding: 0.75rem 1rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
          min-width: 300px;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .admin-table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
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

        .no-tags {
          color: #6c757d;
          font-style: italic;
          font-size: 0.9rem;
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

        .creator-details {
          display: flex;
          flex-direction: column;
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

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .view-button,
        .delete-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
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
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          width: 800px;
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
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.3s ease;
        }

        .close-button:hover {
          background: #f8f9fa;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .post-detail {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .post-detail-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .post-images-section {
          width: 100%;
          margin-bottom: 3rem;
        }

        .post-images-section h4 {
          color: #2c3e50;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .post-images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          justify-items: center;
          max-width: 1000px;
          margin: 0 auto;
        }

        .post-image-item {
          border-radius: 12px;
          overflow: hidden;
          background: #f8f9fa;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .post-image-item img {
          width: 100%;
          height: 400px;
          object-fit: cover;
        }

        .no-images {
          text-align: center;
          padding: 2rem;
          color: #7f8c8d;
        }

        .no-images img {
          width: 100px;
          height: 100px;
          opacity: 0.5;
          margin-bottom: 1rem;
        }

        .info-section {
          margin-bottom: 2rem;
        }

        .info-section h4 {
          color: #2c3e50;
          margin-bottom: 1rem;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 0.5rem;
        }

        .detail-item {
          margin-bottom: 1rem;
        }

        .detail-item strong {
          display: block;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }

        .detail-item p {
          margin: 0;
          color: #7f8c8d;
          line-height: 1.6;
        }

        .comments-list {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 1rem;
        }

        .comment-item {
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #f8f9fa;
        }

        .comment-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .comment-user {
          font-weight: 600;
          color: #2c3e50;
          margin-right: 0.5rem;
        }

        .comment-text {
          color: #7f8c8d;
        }

        .no-comments {
          color: #7f8c8d;
          font-style: italic;
          text-align: center;
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

          .post-detail-content {
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