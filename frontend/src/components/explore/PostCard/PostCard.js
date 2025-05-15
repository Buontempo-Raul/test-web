// src/components/explore/PostCard/PostCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './PostCard.css';

const PostCard = ({ post, currentUser, isAuthenticated }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Truncate caption if it's too long
  const truncateCaption = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '... ';
  };

  // Format the date relative to now
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      alert('Please log in to like posts');
      return;
    }
    
    // Toggle liked state
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    
    // In a real app, call API to update like status
    // fetch(`/api/posts/${post.id}/like`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   }
    // });
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      alert('Please log in to save posts');
      return;
    }
    
    // Toggle saved state
    setSaved(!saved);
    
    // In a real app, call API to update saved status
    // fetch(`/api/posts/${post.id}/save`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   }
    // });
  };

  const handleToggleComments = async () => {
    // If already showing comments, just hide them
    if (showComments) {
      setShowComments(false);
      return;
    }
    
    // If not authenticated, prompt to log in
    if (!isAuthenticated) {
      alert('Please log in to view comments');
      return;
    }
    
    // Fetch comments if we're showing them for the first time
    if (comments.length === 0) {
      setLoadingComments(true);
      
      try {
        // In a real app, fetch comments from API
        // const response = await fetch(`/api/posts/${post.id}/comments`);
        // const data = await response.json();
        // setComments(data.comments);
        
        // Simulate API call with mock data
        setTimeout(() => {
          const mockComments = [
            {
              id: '1',
              user: {
                username: 'art_enthusiast',
                profileImage: 'https://via.placeholder.com/32x32'
              },
              text: 'This is absolutely stunning work! Love the composition.',
              createdAt: '2025-04-11T15:45:00Z'
            },
            {
              id: '2',
              user: {
                username: 'creative_soul99',
                profileImage: 'https://via.placeholder.com/32x32'
              },
              text: 'The colors are so vibrant. What medium did you use?',
              createdAt: '2025-04-11T16:20:00Z'
            }
          ];
          
          setComments(mockComments);
          setLoadingComments(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setLoadingComments(false);
      }
    }
    
    setShowComments(true);
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    
    if (!comment.trim()) return;
    
    // In a real app, send comment to API
    // const response = await fetch(`/api/posts/${post.id}/comments`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   },
    //   body: JSON.stringify({ text: comment })
    // });
    
    // Optimistically add comment to UI
    const newComment = {
      id: Date.now().toString(),
      user: {
        username: currentUser?.username || 'current_user',
        profileImage: currentUser?.profileImage || 'https://via.placeholder.com/32x32'
      },
      text: comment,
      createdAt: new Date().toISOString()
    };
    
    setComments([...comments, newComment]);
    setComment('');
  };

  // Render media content based on type
  const renderContent = () => {
    if (!post.content) return null;
    
    switch (post.content.type) {
      case 'image':
        return (
          <div className="post-image-container">
            <img src={post.content.url} alt="Post" className="post-image" />
          </div>
        );
      case 'video':
        return (
          <div className="post-video-container">
            <video 
              src={post.content.url}
              poster={post.content.thumbnailUrl}
              controls
              className="post-video"
            />
          </div>
        );
      case 'carousel':
        // Simple carousel implementation - in a real app, use a carousel component
        return (
          <div className="post-carousel">
            <div className="carousel-inner">
              {post.content.items.map((item, index) => (
                <div key={index} className="carousel-item">
                  {item.type === 'image' ? (
                    <img src={item.url} alt={`Slide ${index + 1}`} />
                  ) : (
                    <video src={item.url} controls />
                  )}
                </div>
              ))}
            </div>
            <div className="carousel-indicators">
              {post.content.items.map((_, index) => (
                <span 
                  key={index} 
                  className="carousel-indicator"
                  data-active={index === 0}
                />
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <Link to={`/profile/${post.creator.username}`} className="creator-info">
          <div className="creator-avatar">
            <img src={post.creator.profileImage} alt={post.creator.username} />
          </div>
          <div className="creator-name">{post.creator.username}</div>
        </Link>
        <div className="post-time">{formatRelativeTime(post.createdAt)}</div>
      </div>
      
      {/* Post Content */}
      <div className="post-content">
        {renderContent()}
      </div>
      

        {/* Post Actions */}
        <div className="post-actions">
          <div className="action-buttons">
            <button 
              className={`action-button like-button ${liked ? 'liked' : ''}`}
              onClick={handleLike}
              aria-label="Like post"
            >
              <i className={`like-icon ${liked ? 'liked' : ''}`}></i>
              <span>{likesCount}</span>
            </button>
            
            <button 
              className="action-button comment-button"
              onClick={handleToggleComments}
              aria-label="Comment"
            >
              <i className="comment-icon"></i>
              <span>{post.comments}</span>
            </button>
            
            <button 
              className="action-button share-button"
              aria-label="Share post"
            >
              <i className="share-icon"></i>
            </button>
            
            <button 
              className={`action-button save-button ${saved ? 'saved' : ''}`}
              onClick={handleSave}
              aria-label="Save post"
            >
              <i className={`save-icon ${saved ? 'saved' : ''}`}></i>
            </button>
          </div>
        </div>
      
      {/* Shop Item Link (if applicable) */}
      {post.linkedShopItem && (
        <div className="shop-item-link">
          <Link to={`/shop/item/${post.linkedShopItem.id}`} className="shop-item">
            <div className="shop-icon"></div>
            <div className="shop-item-info">
              <span className="shop-item-label">Available in Shop</span>
              <span className="shop-item-name">{post.linkedShopItem.name}</span>
              <span className="shop-item-price">${post.linkedShopItem.price.toFixed(2)}</span>
            </div>
            <div className="shop-item-action">
              <button className="shop-button">View</button>
            </div>
          </Link>
        </div>
      )}
      
      {/* Post Caption */}
      <div className="post-caption">
        <Link to={`/profile/${post.creator.username}`} className="caption-username">
          {post.creator.username}
        </Link>{' '}
        <span>{truncateCaption(post.caption)}</span>
        {post.caption.length > 150 && (
          <button className="read-more-button">more</button>
        )}
      </div>
      
      {/* Post Tags */}
      <div className="post-tags">
        {post.tags.map((tag, index) => (
          <Link key={index} to={`/explore?tag=${tag}`} className="post-tag">
            #{tag}
          </Link>
        ))}
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          <h4 className="comments-heading">Comments</h4>
          
          {loadingComments ? (
            <div className="comments-loading">Loading comments...</div>
          ) : (
            <>
              <div className="comments-list">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment">
                      <Link to={`/profile/${comment.user.username}`} className="comment-avatar">
                        <img src={comment.user.profileImage} alt={comment.user.username} />
                      </Link>
                      <div className="comment-content">
                        <div className="comment-header">
                          <Link to={`/profile/${comment.user.username}`} className="comment-username">
                            {comment.user.username}
                          </Link>
                          <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
                        </div>
                        <div className="comment-text">{comment.text}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-comments">Be the first to comment!</div>
                )}
              </div>
              
              {isAuthenticated && (
                <form className="comment-form" onSubmit={handleAddComment}>
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={handleCommentChange}
                    className="comment-input"
                  />
                  <button 
                    type="submit" 
                    className="comment-submit"
                    disabled={!comment.trim()}
                  >
                    Post
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;