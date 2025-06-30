// frontend/src/components/explore/PostCard/PostCard.js - Updated for multiple artwork display
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PostCard.css';

const PostCard = ({ post, onLike, onComment, currentUser }) => {
  const navigate = useNavigate();
  const [showAllArtworks, setShowAllArtworks] = useState(false);

  // Handle backward compatibility - merge old and new format
  const getLinkedArtworks = () => {
    const artworks = [];
    
    // Add new format (multiple artworks)
    if (post.linkedShopItems && post.linkedShopItems.length > 0) {
      artworks.push(...post.linkedShopItems);
    }
    
    // Add old format (single artwork) for backward compatibility
    if (post.linkedShopItem && !artworks.some(artwork => artwork._id === post.linkedShopItem._id)) {
      artworks.push(post.linkedShopItem);
    }
    
    return artworks;
  };

  const linkedArtworks = getLinkedArtworks();
  const hasLinkedArtworks = linkedArtworks.length > 0;

  // Display configuration
  const maxArtworksToShow = 3;
  const displayedArtworks = showAllArtworks 
    ? linkedArtworks 
    : linkedArtworks.slice(0, maxArtworksToShow);
  const hasMoreArtworks = linkedArtworks.length > maxArtworksToShow;

  const handleArtworkClick = (artworkId) => {
    navigate(`/shop/${artworkId}`);
  };

  const handleProfileClick = () => {
    navigate(`/profile/${post.creator._id}`);
  };

  const handleLike = () => {
    if (onLike) {
      onLike(post._id);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Render single artwork button (compact)
  const renderArtworkButton = (artwork, index) => (
    <button
      key={artwork._id}
      className="artwork-link-button compact"
      onClick={() => handleArtworkClick(artwork._id)}
      title={`View ${artwork.title} - $${artwork.price}`}
    >
      <div className="artwork-image">
        {artwork.images && artwork.images[0] && (
          <img 
            src={artwork.images[0]} 
            alt={artwork.title}
            onError={(e) => {
              e.target.src = '/api/placeholder/60/60';
            }}
          />
        )}
      </div>
      <div className="artwork-info">
        <span className="artwork-title">{artwork.title}</span>
        <span className="artwork-price">${artwork.price}</span>
      </div>
    </button>
  );

  // Render artwork grid (when showing multiple)
  const renderArtworkGrid = () => (
    <div className="linked-artworks-grid">
      {displayedArtworks.map((artwork, index) => (
        <div
          key={artwork._id}
          className="artwork-grid-item"
          onClick={() => handleArtworkClick(artwork._id)}
        >
          <div className="artwork-grid-image">
            {artwork.images && artwork.images[0] && (
              <img 
                src={artwork.images[0]} 
                alt={artwork.title}
                onError={(e) => {
                  e.target.src = '/api/placeholder/100/100';
                }}
              />
            )}
          </div>
          <div className="artwork-grid-info">
            <div className="artwork-grid-title">{artwork.title}</div>
            <div className="artwork-grid-price">${artwork.price}</div>
          </div>
        </div>
      ))}
      
      {hasMoreArtworks && !showAllArtworks && (
        <button 
          className="show-more-artworks"
          onClick={(e) => {
            e.stopPropagation();
            setShowAllArtworks(true);
          }}
        >
          +{linkedArtworks.length - maxArtworksToShow} more
        </button>
      )}
    </div>
  );

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="user-info" onClick={handleProfileClick}>
          <img 
            src={post.creator.profileImage || '/api/placeholder/40/40'} 
            alt={post.creator.username}
            className="user-avatar"
            onError={(e) => {
              e.target.src = '/api/placeholder/40/40';
            }}
          />
          <div className="user-details">
            <span className="username">{post.creator.username}</span>
            <span className="post-date">{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="post-content">
        {/* Media Content */}
        <div className="post-media">
          {post.content.type === 'image' && (
            <img 
              src={post.content.url} 
              alt="Post content"
              onError={(e) => {
                e.target.src = '/api/placeholder/400/400';
              }}
            />
          )}
          
          {post.content.type === 'video' && (
            <video controls>
              <source src={post.content.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          
          {post.content.type === 'carousel' && post.content.items && (
            <div className="carousel">
              {post.content.items.map((item, index) => (
                <div key={index} className="carousel-item">
                  {item.type === 'image' ? (
                    <img 
                      src={item.url} 
                      alt={`Carousel item ${index + 1}`}
                      onError={(e) => {
                        e.target.src = '/api/placeholder/400/400';
                      }}
                    />
                  ) : (
                    <video controls>
                      <source src={item.url} type="video/mp4" />
                    </video>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="post-caption">
            <span className="username">{post.creator.username}</span>
            <span className="caption-text">{post.caption}</span>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Linked Artworks Section */}
      {hasLinkedArtworks && (
        <div className="linked-artworks-section">
          <div className="section-header">
            <span className="section-title">
              {linkedArtworks.length === 1 ? 'Featured Artwork' : `Featured Artworks (${linkedArtworks.length})`}
            </span>
            {linkedArtworks.length > 1 && !showAllArtworks && (
              <button 
                className="toggle-view-button"
                onClick={() => setShowAllArtworks(!showAllArtworks)}
              >
                {showAllArtworks ? 'Show Less' : 'Show All'}
              </button>
            )}
          </div>

          {linkedArtworks.length === 1 ? (
            // Single artwork - show as button
            <div className="single-artwork">
              {renderArtworkButton(linkedArtworks[0], 0)}
            </div>
          ) : (
            // Multiple artworks - show as grid
            renderArtworkGrid()
          )}
        </div>
      )}

      {/* Post Actions */}
      <div className="post-actions">
        <button 
          className={`action-button like-button ${post.isLikedByCurrentUser ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <span className="icon">❤️</span>
          <span className="count">{post.likes || 0}</span>
        </button>

        <button className="action-button comment-button">
          <span className="icon">💬</span>
          <span className="count">{post.comments?.length || 0}</span>
        </button>

        <button className="action-button share-button">
          <span className="icon">📤</span>
        </button>
      </div>

      {/* Comments Preview */}
      {post.comments && post.comments.length > 0 && (
        <div className="comments-preview">
          {post.comments.slice(0, 2).map((comment, index) => (
            <div key={index} className="comment">
              <span className="comment-username">{comment.user.username}</span>
              <span className="comment-text">{comment.text}</span>
            </div>
          ))}
          {post.comments.length > 2 && (
            <button className="view-all-comments">
              View all {post.comments.length} comments
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;