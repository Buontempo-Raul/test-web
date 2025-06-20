// Updated Explore component with infinite scroll
// frontend/src/pages/Explore/Explore.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import PostCard from '../../components/explore/PostCard/PostCard';
import CreatePostModal from '../../components/explore/CreatePostModal/CreatePostModal';
import './Explore.css';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastPostDate, setLastPostDate] = useState(null);
  const [filters, setFilters] = useState({
    tag: '',
    followingOnly: false,
    search: ''
  });

  const observer = useRef();
  const lastPostElementRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  // Initial posts fetch
  const fetchPosts = async (reset = false) => {
    try {
      setLoading(reset);
      const params = {
        limit: 10,
        ...(filters.tag && { tag: filters.tag }),
        ...(filters.followingOnly && { followingOnly: 'true' }),
        ...(filters.search && { search: filters.search }),
        // Use cursor-based pagination instead of skip/limit
        ...(lastPostDate && !reset && { before: lastPostDate })
      };

      const response = await api.get('/api/posts', { params });

      if (response.data.success) {
        const newPosts = response.data.posts;
        
        if (reset) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }

        // Update cursor for next page
        if (newPosts.length > 0) {
          setLastPostDate(newPosts[newPosts.length - 1].createdAt);
        }

        // Check if there are more posts
        setHasMore(newPosts.length === 10); // If we got less than limit, no more posts
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more posts (infinite scroll)
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    await fetchPosts(false);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    
    // Reset everything when filters change
    setPosts([]);
    setLastPostDate(null);
    setHasMore(true);
  };

  // Initial load and filter changes
  useEffect(() => {
    fetchPosts(true);
  }, [filters]);

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

  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  };

  const currentUser = getCurrentUser();
  const isAuthenticated = !!(localStorage.getItem('token') && currentUser);

  if (loading && posts.length === 0) {
    return (
      <div className="explore-loading">
        <div className="spinner"></div>
        <p>Loading posts...</p>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="explore-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => fetchPosts(true)}>Try Again</button>
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
        <div className="posts-feed">
          {posts.map((post, index) => {
            // Add ref to last post for infinite scroll
            const isLast = index === posts.length - 1;
            return (
              <div
                key={post._id}
                ref={isLast ? lastPostElementRef : null}
              >
                <PostCard
                  post={post}
                  currentUser={currentUser}
                  isAuthenticated={isAuthenticated}
                  onPostUpdated={() => fetchPosts(true)}
                />
              </div>
            );
          })}
          
          {/* Loading indicator for infinite scroll */}
          {loadingMore && (
            <div className="loading-more">
              <div className="spinner"></div>
              <p>Loading more posts...</p>
            </div>
          )}
          
          {/* End of posts indicator */}
          {!hasMore && posts.length > 0 && (
            <div className="end-of-posts">
              <p>No more posts...</p>
            </div>
          )}
        </div>
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