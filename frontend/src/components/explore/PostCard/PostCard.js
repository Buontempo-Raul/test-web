// frontend/src/components/explore/PostCard/PostCard.js - Updated with product link button
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI } from '../../../services/api';
import './PostCard.css';

const PostCard = ({ post, onPostUpdate, onPostDelete }) => {
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  const navigate = useNavigate();

  // Get current user
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
  const isOwner = currentUser && post.creator._id === currentUser._id;

  // Handle like/unlike
  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      const response = await postAPI.likePost(post._id);
      if (response.data.success) {
        setIsLiked(response.data.liked);
        setLikesCount(response.data.likes);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const response = await postAPI.commentOnPost(post._id, newComment.trim());
      if (response.data.success) {
        // Update post with new comment
        if (onPostUpdate) {
          onPostUpdate({
            ...post,
            comments: [...post.comments, response.data.comment]
          });
        }
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await postAPI.deleteComment(post._id, commentId);
      if (response.data.success) {
        // Update post with comment removed
        if (onPostUpdate) {
          onPostUpdate({
            ...post,
            comments: post.comments.filter(comment => comment._id !== commentId)
          });
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Handle post deletion
  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await postAPI.deletePost(post._id);
      if (response.data.success && onPostDelete) {
        onPostDelete(post._id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // NEW: Handle view product click
  const handleViewProduct = () => {
    if (post.linkedShopItem) {
      navigate(`/shop/product/${post.linkedShopItem._id}`);
    }
  };

  // Render media content
  const renderContent = () => {
    const { content } = post;

    if (content.type === 'carousel') {
      return (
        <div className="post-carousel">
          <div className="carousel-container">
            {content.items.map((item, index) => (
              <div key={index} className="carousel-item">
                {item.type === 'video' ? (
                  <video src={item.url} controls className="post-media" />
                ) : (
                  <img src={item.url} alt={`Post content ${index + 1}`} className="post-media" />
                )}
              </div>
            ))}
          </div>
          <div className="carousel-indicators">
            {content.items.map((_, index) => (
              <span key={index} className="indicator active"></span>
            ))}
          </div>
        </div>
      );
    }

    if (content.type === 'video') {
      return (
        <div className="post-video-container">
          <video src={content.url} controls className="post-media" />
        </div>
      );
    }

    return (
      <div className="post-image-container">
        <img src={content.url} alt="Post content" className="post-media" />
      </div>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-user-info">
          <img 
            src={post.creator.profileImage || '/default-profile.jpg'} 
            alt={post.creator.username}
            className="user-avatar"
            onClick={() => navigate(`/profile/${post.creator._id}`)}
          />
          <div className="user-details">
            <h4 
              className="username"
              onClick={() => navigate(`/profile/${post.creator._id}`)}
            >
              {post.creator.username}
            </h4>
            <span className="post-date">{formatDate(post.createdAt)}</span>
          </div>
        </div>

        {isOwner && (
          <div className="post-actions">
            <button 
              className="action-button delete-button"
              onClick={handleDeletePost}
              title="Delete post"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="post-content">
        {renderContent()}
      </div>

      {/* Post Caption */}
      {post.caption && (
        <div className="post-caption">
          <p>{post.caption}</p>
        </div>
      )}

      {/* NEW: Linked Product Section */}
      {post.linkedShopItem && (
        <div className="linked-product">
          <div className="linked-product-info">
            <img 
              src={post.linkedShopItem.images?.[0] || '/placeholder-image.jpg'} 
              alt={post.linkedShopItem.title}
              className="linked-product-image"
            />
            <div className="linked-product-details">
              <h5 className="linked-product-title">{post.linkedShopItem.title}</h5>
              <p className="linked-product-price">${post.linkedShopItem.price}</p>
            </div>
          </div>
          <button 
            className="view-product-button"
            onClick={handleViewProduct}
          >
            View Product
          </button>
        </div>
      )}

      {/* Post Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag, index) => (
            <span key={index} className="post-tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Post Interactions */}
      <div className="post-interactions">
        <div className="interaction-buttons">
          <button 
            className={`interaction-button ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={loading}
          >
            {isLiked ? '❤️' : '🤍'} {likesCount}
          </button>
          
          <button 
            className="interaction-button"
            onClick={() => setShowComments(!showComments)}
          >
            💬 {post.comments?.length || 0}
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          {/* Existing Comments */}
          {post.comments && post.comments.length > 0 && (
            <div className="comments-list">
              {post.comments.map((comment) => (
                <div key={comment._id} className="comment">
                  <img 
                    src={comment.user.profileImage || '/default-profile.jpg'} 
                    alt={comment.user.username}
                    className="comment-avatar"
                  />
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-username">{comment.user.username}</span>
                      <span className="comment-date">{formatDate(comment.createdAt)}</span>
                      {(currentUser && (comment.user._id === currentUser._id || isOwner)) && (
                        <button 
                          className="delete-comment-button"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          {isAuthenticated && (
            <form className="add-comment-form" onSubmit={handleCommentSubmit}>
              <img 
                src={currentUser.profileImage || '/default-profile.jpg'} 
                alt={currentUser.username}
                className="comment-avatar"
              />
              <div className="comment-input-container">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="comment-input"
                  disabled={submittingComment}
                />
                <button 
                  type="submit" 
                  className="submit-comment-button"
                  disabled={!newComment.trim() || submittingComment}
                >
                  {submittingComment ? '⏳' : '📤'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;