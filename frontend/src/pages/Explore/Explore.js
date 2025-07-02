// frontend/src/pages/Explore/Explore.js - Fixed with working like and comment functionality
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { postAPI } from '../../services/api';
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

  // Handle like functionality
  const handleLike = async (postId) => {
    if (!isAuthenticated) {
      alert('Please log in to like posts');
      return;
    }

    try {
      const response = await postAPI.likePost(postId);
      
      if (response.data.success) {
        // Update the post in the posts array
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              const updatedPost = { ...post };
              updatedPost.likes = response.data.likes;
              
              // Update likedBy array
              if (response.data.liked) {
                // Add current user to likedBy if not already there
                if (!updatedPost.likedBy.includes(currentUser._id)) {
                  updatedPost.likedBy = [...updatedPost.likedBy, currentUser._id];
                }
              } else {
                // Remove current user from likedBy
                updatedPost.likedBy = updatedPost.likedBy.filter(id => id !== currentUser._id);
              }
              
              return updatedPost;
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Failed to like post. Please try again.');
    }
  };

  // Handle comment functionality
  const handleComment = async (postId, commentText) => {
    if (!isAuthenticated) {
      alert('Please log in to comment on posts');
      return;
    }

    if (!commentText || commentText.trim().length === 0) {
      alert('Please enter a comment');
      return;
    }

    try {
      const response = await postAPI.commentOnPost(postId, commentText.trim());
      
      if (response.data.success) {
        // Update the post with the new comment
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              const updatedPost = { ...post };
              updatedPost.comments = [...updatedPost.comments, response.data.comment];
              return updatedPost;
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error commenting on post:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

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

      const response = await postAPI.getPosts(params);

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
    console.log('New post created:', newPost);
    setPosts(prev => [newPost, ...prev]);
    setShowCreateModal(false);
  };

  // Handle opening create modal
  const handleCreatePostClick = () => {
    console.log('Create post button clicked');
    setShowCreateModal(true);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    console.log('Closing modal');
    setShowCreateModal(false);
  };

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
              onClick={handleCreatePostClick}
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
            className={`filter-btn ${filters.tag === 'digital' ? 'active' : ''}`}
            onClick={() => handleFilterChange('tag', 'digital')}
          >
            Digital
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="posts-container">
        {posts.length === 0 && !loading ? (
          <div className="no-posts">
            <h3>No posts found</h3>
            <p>Be the first to share something!</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post, index) => (
              <div
                key={post._id}
                ref={index === posts.length - 1 ? lastPostElementRef : null}
              >
                <PostCard 
                  post={post} 
                  currentUser={currentUser}
                  onLike={handleLike}
                  onComment={handleComment}
                  onPostUpdate={(updatedPost) => {
                    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
                  }}
                  onPostDelete={(postId) => {
                    setPosts(prev => prev.filter(p => p._id !== postId));
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {loadingMore && (
          <div className="loading-more">
            <div className="spinner"></div>
            <p>Loading more posts...</p>
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="end-of-posts">
            <p>You've seen all posts!</p>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default Explore;