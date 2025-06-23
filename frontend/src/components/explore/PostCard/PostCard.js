import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import './PostCard.css';

const PostCard = ({ post, currentUser, isAuthenticated, onPostUpdated, onPostDeleted }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (isAuthenticated && post.likedBy) {
      const userLiked = post.likedBy.includes(currentUser?._id || currentUser?.id);
      setLiked(userLiked);
    }
  }, [post.likedBy, currentUser, isAuthenticated]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like posts');
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    const previousLiked = liked;
    const previousLikes = likes;

    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);

    try {
      const response = await api.post(`/api/posts/${post._id}/like`);
      if (response.data.success) {
        setLiked(response.data.liked);
        setLikes(response.data.likes);
      }
    } catch (error) {
      setLiked(previousLiked);
      setLikes(previousLikes);
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await api.post(`/api/posts/${post._id}/comment`, {
        text: comment
      });

      if (response.data.success) {
        setComments(response.data.post.comments);
        setComment('');
        if (onPostUpdated) {
          onPostUpdated(response.data.post);
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete(`/api/posts/${post._id}`);
      if (response.data.success) {
        if (onPostDeleted) {
          onPostDeleted(post._id);
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isPostCreator = currentUser && post.creator && 
    (currentUser._id === post.creator._id || currentUser.id === post.creator._id);

  const handlePrevMedia = () => {
    if (post.content.type === 'carousel' && post.content.items) {
      setCurrentMediaIndex(prev => 
        prev > 0 ? prev - 1 : post.content.items.length - 1
      );
    }
  };

  const handleNextMedia = () => {
    if (post.content.type === 'carousel' && post.content.items) {
      setCurrentMediaIndex(prev => 
        prev < post.content.items.length - 1 ? prev + 1 : 0
      );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const renderMedia = () => {
    if (!post.content) return null;

    if (post.content.type === 'carousel' && post.content.items && post.content.items.length > 0) {
      const currentItem = post.content.items[currentMediaIndex];
      return (
        <div className="post-media carousel">
          {currentItem.type === 'video' ? (
            <video 
              src={currentItem.url} 
              controls 
              className="post-media-content"
            />
          ) : (
            <img 
              src={currentItem.url} 
              alt={`Post by ${post.creator.username}`}
              className="post-media-content"
            />
          )}
          
          {post.content.items.length > 1 && (
            <>
              <button className="carousel-nav prev" onClick={handlePrevMedia}>
                &#8249;
              </button>
              <button className="carousel-nav next" onClick={handleNextMedia}>
                &#8250;
              </button>
              <div className="carousel-indicators">
                {post.content.items.map((_, index) => (
                  <button
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
    
    if ((post.content.type === 'image' || post.content.type === 'video') && post.content.url) {
      return (
        <div className="post-media">
          {post.content.type === 'video' ? (
            <video 
              src={post.content.url} 
              controls 
              className="post-media-content"
              poster={post.content.thumbnailUrl}
            />
          ) : (
            <img 
              src={post.content.url} 
              alt={`Post by ${post.creator.username}`}
              className="post-media-content"
            />
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.creator.username}`} className="post-creator">
          <img 
            src={post.creator.profileImage || '/default-profile.jpg'} 
            alt={`${post.creator.username}'s profile`}
            className="creator-avatar"
          />
          <div className="creator-info">
            <span className="creator-name">{post.creator.username}</span>
            <span className="post-date">{formatDate(post.createdAt)}</span>
          </div>
        </Link>
        
        {isPostCreator && (
          <div className="post-actions-menu">
            <button
              className="delete-post-btn"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        )}
      </div>

      {renderMedia()}

      <div className="post-actions">
        <button 
          className={`action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
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

      <div className="post-content">
        {post.caption && (
          <p className="post-caption">
            <Link 
              to={`/profile/${post.creator.username}`} 
              className="creator-link"
            >
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

      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment._id} className="comment">
                <Link 
                  to={`/profile/${comment.user?.username || 'unknown'}`} 
                  className="comment-author"
                >
                  {comment.user?.username || 'Anonymous'}
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

      {showDeleteConfirm && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>Delete Post</h3>
            <p>Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button 
                className="cancel-delete-btn"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={handleDeletePost}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;