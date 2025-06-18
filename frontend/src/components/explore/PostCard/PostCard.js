// frontend/src/components/explore/PostCard/PostCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import './PostCard.css';

const PostCard = ({ post, currentUser, isAuthenticated, onPostUpdated }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Handle like functionality
  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like posts');
      return;
    }

    try {
      const response = await api.post(`/api/posts/${post._id}/like`);
      if (response.data.success) {
        setLiked(!liked);
        setLikes(response.data.likes);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await api.post(`/api/posts/${post._id}/comment`, {
        text: comment
      });
      
      if (response.data.success) {
        setComments([...comments, response.data.comment]);
        setComment('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    }
  };

  // Navigate carousel
  const handlePrevMedia = () => {
    setCurrentMediaIndex((prev) => 
      prev === 0 ? post.content.items.length - 1 : prev - 1
    );
  };

  const handleNextMedia = () => {
    setCurrentMediaIndex((prev) => 
      prev === post.content.items.length - 1 ? 0 : prev + 1
    );
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Render media content
  const renderMedia = () => {
    if (post.content.type === 'image') {
      return (
        <div className="post-media">
          <img src={post.content.url} alt={post.caption || 'Post'} />
        </div>
      );
    } else if (post.content.type === 'video') {
      return (
        <div className="post-media">
          <video controls>
            <source src={post.content.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else if (post.content.type === 'carousel') {
      const currentItem = post.content.items[currentMediaIndex];
      return (
        <div className="post-media carousel">
          {currentItem.type === 'image' ? (
            <img src={currentItem.url} alt={`Slide ${currentMediaIndex + 1}`} />
          ) : (
            <video controls>
              <source src={currentItem.url} type="video/mp4" />
            </video>
          )}
          {post.content.items.length > 1 && (
            <>
              <button className="carousel-nav prev" onClick={handlePrevMedia}>
                ‹
              </button>
              <button className="carousel-nav next" onClick={handleNextMedia}>
                ›
              </button>
              <div className="carousel-indicators">
                {post.content.items.map((_, index) => (
                  <span
                    key={index}
                    className={`indicator ${index === currentMediaIndex ? 'active' : ''}`}
                    onClick={() => setCurrentMediaIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      );
    }
  };

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <Link to={`/profile/${post.creator.username}`} className="post-creator">
          <img 
            src={post.creator.profileImage || '/default-profile.jpg'} 
            alt={post.creator.username}
            className="creator-avatar"
          />
          <div className="creator-info">
            <span className="creator-name">{post.creator.username}</span>
            <span className="post-date">{formatDate(post.createdAt)}</span>
          </div>
        </Link>
      </div>

      {/* Post Media */}
      {renderMedia()}

      {/* Post Actions */}
      <div className="post-actions">
        <button 
          className={`action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{likes}</span>
        </button>
        <button 
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{comments.length}</span>
        </button>
      </div>

      {/* Post Content */}
      <div className="post-content">
        {post.caption && (
          <p className="post-caption">
            <Link to={`/profile/${post.creator.username}`} className="creator-link">
              {post.creator.username}
            </Link>
            {' '}{post.caption}
          </p>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment._id} className="comment">
                <Link to={`/profile/${comment.user.username}`} className="comment-author">
                  {comment.user.username}
                </Link>
                <span className="comment-text">{comment.text}</span>
              </div>
            ))}
          </div>
          {isAuthenticated && (
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button type="submit" disabled={!comment.trim()}>
                Post
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;