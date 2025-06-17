// frontend/src/pages/Explore/Explore.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PostCard from '../../components/explore/PostCard/PostCard';
import CreatePostModal from '../../components/explore/CreatePostModal/CreatePostModal';
import './Explore.css';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    tag: '',
    followingOnly: false,
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10
  });

  // Fetch posts from the API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.tag && { tag: filters.tag }),
        ...(filters.followingOnly && { followingOnly: 'true' }),
        ...(filters.search && { search: filters.search })
      };

      const response = await api.get('/api/posts', { params });

      if (response.data.success) {
        setPosts(response.data.posts);
        setPagination(prev => ({
          ...prev,
          totalPages: response.data.pages,
          currentPage: response.data.currentPage
        }));
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts when component mounts or filters change
  useEffect(() => {
    fetchPosts();
  }, [filters, pagination.currentPage]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1 // Reset to first page when filters change
    }));
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.search.value;
    handleFilterChange('search', searchValue);
  };

  // Handle post creation success
  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    setShowCreateModal(false);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
    window.scrollTo(0, 0);
  };

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = !!localStorage.getItem('token');

  if (loading && posts.length === 0) {
    return (
      <div className="explore-loading">
        <div className="spinner"></div>
        <p>Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="explore-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchPosts}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="explore-container">
      <div className="explore-header">
        <h1>Explore</h1>
        {isAuthenticated && (
          <div className="explore-actions">
            <button 
              className="create-post-button"
              onClick={() => setShowCreateModal(true)}
            >
              Create Post
            </button>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="explore-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            name="search"
            placeholder="Search posts..."
            defaultValue={filters.search}
          />
          <button type="submit">Search</button>
        </form>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filters.tag === '' ? 'active' : ''}`}
            onClick={() => handleFilterChange('tag', '')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filters.tag === 'art' ? 'active' : ''}`}
            onClick={() => handleFilterChange('tag', 'art')}
          >
            Art
          </button>
          <button
            className={`filter-btn ${filters.tag === 'photography' ? 'active' : ''}`}
            onClick={() => handleFilterChange('tag', 'photography')}
          >
            Photography
          </button>
          <button
            className={`filter-btn ${filters.tag === 'design' ? 'active' : ''}`}
            onClick={() => handleFilterChange('tag', 'design')}
          >
            Design
          </button>
          {isAuthenticated && (
            <button
              className={`filter-btn ${filters.followingOnly ? 'active' : ''}`}
              onClick={() => handleFilterChange('followingOnly', !filters.followingOnly)}
            >
              Following
            </button>
          )}
        </div>
      </div>

      {/* Posts Feed */}
      {posts.length > 0 ? (
        <>
          <div className="posts-feed">
            {posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={currentUser}
                isAuthenticated={isAuthenticated}
                onPostUpdated={fetchPosts}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Previous
              </button>
              <span>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="no-posts">
          <h2>No posts yet</h2>
          <p>Be the first to share something amazing!</p>
          {isAuthenticated && (
            <button 
              className="create-post-button"
              onClick={() => setShowCreateModal(true)}
            >
              Create First Post
            </button>
          )}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default Explore;