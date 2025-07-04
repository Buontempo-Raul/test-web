// frontend/src/pages/Explore/Explore.js - Updated with Following Filter
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Explore.css';
import { useAuth } from '../../hooks/useAuth';
import { postAPI } from '../../services/api';
import PostCard from '../../components/explore/PostCard/PostCard';
import CreatePostModal from '../../components/explore/CreatePostModal/CreatePostModal';

const Explore = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isAdmin } = useAuth();
  
  // Posts state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [lastPostDate, setLastPostDate] = useState(null);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Updated filters to include followingOnly
  const [filters, setFilters] = useState({
    tag: '',
    search: '',
    followingOnly: false // NEW: Add following filter
  });

  // Infinite scroll ref
  const lastPostElementRef = useRef();

  // Redirect admins to dashboard
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [isAdmin, navigate]);

  // Intersection Observer for infinite scroll
  const lastPostCallback = useCallback(
    (node) => {
      if (loadingMore) return;
      if (lastPostElementRef.current) lastPostElementRef.current.disconnect();
      lastPostElementRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMorePosts();
        }
      });
      if (node) lastPostElementRef.current.observe(node);
    },
    [loadingMore, hasMore]
  );

  // Handle like functionality
  const handleLike = async (postId) => {
    if (!isAuthenticated) {
      alert('Please log in to like posts');
      return;
    }

    try {
      const response = await postAPI.likePost(postId);
      
      if (response.data.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              const isCurrentlyLiked = post.likes.includes(currentUser._id);
              const newLikes = isCurrentlyLiked
                ? post.likes.filter(id => id !== currentUser._id)
                : [...post.likes, currentUser._id];
              
              return {
                ...post,
                likes: newLikes,
                likesCount: newLikes.length
              };
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
        ...(filters.followingOnly && { followingOnly: 'true' }), // Include following filter
        ...(filters.search && { search: filters.search }),
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

        if (newPosts.length > 0) {
          setLastPostDate(newPosts[newPosts.length - 1].createdAt);
        }

        setHasMore(newPosts.length === 10);
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

  // Handle following toggle - NEW
  const handleFollowingToggle = () => {
    if (!isAuthenticated) {
      alert('Please log in to see posts from people you follow');
      return;
    }
    
    handleFilterChange('followingOnly', !filters.followingOnly);
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
          {/* Following Filter - NEW */}
          {isAuthenticated && (
            <button
              className={`filter-btn following-filter ${filters.followingOnly ? 'active' : ''}`}
              onClick={handleFollowingToggle}
              title="Show posts only from people you follow"
            >
              <svg 
                className="following-icon" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Following Only
            </button>
          )}
          
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
            <h3>
              {filters.followingOnly 
                ? "No posts from people you follow yet" 
                : "No posts found"
              }
            </h3>
            <p>
              {filters.followingOnly 
                ? "Follow some users to see their posts here!" 
                : "Be the first to share something!"
              }
            </p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post, index) => (
              <div
                key={post._id}
                ref={index === posts.length - 1 ? lastPostCallback : null}
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
            <p>
              {filters.followingOnly 
                ? "You've seen all posts from people you follow!" 
                : "You've seen all posts!"
              }
            </p>
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