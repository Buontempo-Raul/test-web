// frontend/src/components/explore/PostCard/PostCard.js - FIXED: Use username for profile navigation
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

  // Navigate to artwork detail page
  const handleArtworkClick = (artworkId) => {
    navigate(`/shop/product/${artworkId}`);
  };

  // 🔧 FIXED: Use username instead of ID for profile navigation
  const handleProfileClick = () => {
    // Use username from post.creator.username, not post.creator._id
    if (post.creator && post.creator.username) {
      navigate(`/profile/${post.creator.username}`);
    } else {
      console.error('Post creator username not available:', post.creator);
    }
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
            src={post.creator?.profileImage || '/api/placeholder/40/40'} 
            alt={post.creator?.username || 'User'}
            className="user-avatar"
            onError={(e) => {
              e.target.src = '/api/placeholder/40/40';
            }}
          />
          <div className="user-details">
            <span className="username">{post.creator?.username || 'Unknown User'}</span>
            <span className="post-date">{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="post-content">
        {/* Media Content */}
        <div className="post-media">
          {post.content?.type === 'image' && (
            <img 
              src={post.content.url} 
              alt="Post content"
              onError={(e) => {
                e.target.src = '/api/placeholder/400/400';
              }}
            />
          )}
          
          {post.content?.type === 'video' && (
            <video controls>
              <source src={post.content.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          
          {post.content?.type === 'carousel' && post.content.items && (
            <div className="carousel">
              {post.content.items.map((item, index) => (
                <div key={index} className="carousel-item">
                  {item.type === 'image' ? 
                    <img src={item.url} alt={`Slide ${index + 1}`} /> :
                    <video controls><source src={item.url} type="video/mp4" /></video>
                  }
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="post-caption">
            <p>{post.caption}</p>
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
              Shop Items ({linkedArtworks.length})
            </span>
            {linkedArtworks.length > 1 && (
              <button 
                className="toggle-view-button"
                onClick={() => setShowAllArtworks(!showAllArtworks)}
              >
                {showAllArtworks ? 'Show Less' : 'Show All'}
              </button>
            )}
          </div>
          
          {linkedArtworks.length === 1 ? (
            <div className="single-artwork">
              {renderArtworkButton(linkedArtworks[0], 0)}
            </div>
          ) : (
            renderArtworkGrid()
          )}
        </div>
      )}

      {/* Post Actions */}
      <div className="post-actions">
        <button 
          className={`action-button ${post.likedBy?.includes(currentUser?._id) ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <span>❤️</span>
          <span>{post.likes || 0}</span>
        </button>
        
        <button className="action-button">
          <span>💬</span>
          <span>{post.comments?.length || 0}</span>
        </button>
        
        <button className="action-button">
          <span>📤</span>
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;