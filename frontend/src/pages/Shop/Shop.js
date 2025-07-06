// frontend/src/pages/Shop/Shop.js - MINIMAL FIX - Only changing button visibility
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { artworkAPI } from '../../services/api';
import './Shop.css';
import { Link } from 'react-router-dom';
import ArtistRequestForm from '../../components/ArtistRequestForm/ArtistRequestForm';


const Shop = () => {
  const navigate = useNavigate();

  // Get current user info from localStorage (original method)
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
  const isArtist = currentUser?.isArtist;

  // State management
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter and pagination state
  const [filter, setFilter] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: ''
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 12,
    count: 0
  });

  // Modal states
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [artworkToDelete, setArtworkToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showArtistRequestForm, setShowArtistRequestForm] = useState(false);

  // Add item form state
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    tags: '',
    dimensions: {
      width: '',
      height: '',
      depth: '',
      unit: 'cm'
    },
    medium: '',
    yearCreated: '',
    linkedPostIds: []
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // User posts for linking
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // ORIGINAL FETCH ARTWORKS - RESTORED
  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: pagination.currentPage,
          limit: 12,
          ...(filter.category && { category: filter.category }),
          ...(filter.minPrice && { minPrice: filter.minPrice }),
          ...(filter.maxPrice && { maxPrice: filter.maxPrice }),
          ...(filter.search && { search: filter.search })
        };

        const response = await artworkAPI.getArtworks(params);

        if (response.data.success) {
          setArtworks(response.data.artworks || []);
          setPagination(response.data.pagination || { currentPage: 1, totalPages: 1, count: 0 });
        } else {
          throw new Error(response.data.message || 'Failed to fetch artworks');
        }
      } catch (err) {
        console.error('Error fetching artworks:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load artworks');
        setArtworks([]);
        setPagination({ currentPage: 1, totalPages: 1, count: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, [filter, pagination.currentPage]);

  // ORIGINAL FETCH USER POSTS - RESTORED
  const fetchUserPosts = async () => {
    if (!isArtist) {
      console.log('User is not an artist, skipping post fetch');
      return;
    }
    
    setLoadingPosts(true);
    try {
      console.log('=== Testing artwork API endpoints ===');
      console.log('User:', currentUser);
      console.log('Is Artist:', isArtist);
      
      // First, test the simple test endpoint
      try {
        console.log('Testing simple endpoint...');
        const testResponse = await artworkAPI.testGetPosts();
        console.log('Test endpoint response:', testResponse.data);
      } catch (testError) {
        console.error('Test endpoint failed:', testError);
        console.error('Test error response:', testError.response?.data);
      }
      
      // Then try the actual endpoint
      console.log('Testing actual getUserPosts endpoint...');
      const response = await artworkAPI.getUserPosts();
      console.log('getUserPosts response:', response.data);
      
      if (response.data.success) {
        setUserPosts(response.data.posts);
        console.log('Posts loaded successfully:', response.data.posts.length);
      } else {
        console.error('getUserPosts failed:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (showAddItemModal && isAuthenticated && isArtist) {
      fetchUserPosts();
    }
  }, [showAddItemModal, isAuthenticated, isArtist]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilter(prev => ({
      ...prev,
      [filterType]: value
    }));
    
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  // Handle product click - navigate to product detail page
  const handleProductClick = (artwork) => {
    navigate(`/shop/product/${artwork._id}`);
  };

  // ONLY CHANGE: Remove isArtist check for button visibility
  const handleAddItemClick = () => {
    if (!isAuthenticated) {
      alert('Please log in to add artworks');
      return;
    }

    if (!isArtist) {
      // Show artist request form instead of alert
      setShowArtistRequestForm(true);
      return;
    }

    setShowAddItemModal(true);
  };

  const handleArtistRequestSuccess = (requestData) => {
    setShowArtistRequestForm(false);
    alert('Your artist application has been submitted successfully! We will review it and get back to you soon.');
    
    // Optionally refresh user data to check if they were immediately approved
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  // ORIGINAL IMAGE UPLOAD - RESTORED
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    if (images.length + files.length > 5) {
      setSubmitError('Maximum 5 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024;
      
      if (!isValidType) {
        setSubmitError('Please upload only image files');
        return false;
      }
      
      if (!isValidSize) {
        setSubmitError('Image size must be less than 10MB');
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      setSubmitError('');
      
      const processedFiles = await Promise.all(
        validFiles.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      setImages(prev => [...prev, ...processedFiles]);
      setImagePreviews(prev => [...prev, ...processedFiles]);
    } catch (error) {
      console.error('Error processing images:', error);
      setSubmitError('Failed to process images. Please try again.');
    }
  };

  // Remove image
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ORIGINAL POST SELECTION - RESTORED
  const handlePostSelection = (postId) => {
    setNewItem(prev => ({
      ...prev,
      linkedPostIds: prev.linkedPostIds.includes(postId)
        ? prev.linkedPostIds.filter(id => id !== postId)
        : [...prev.linkedPostIds, postId]
    }));
  };

  // ORIGINAL ADD ITEM - RESTORED
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!newItem.title || !newItem.description || !newItem.price) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      setSubmitError('Please upload at least one image');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const tags = newItem.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const artworkData = {
        ...newItem,
        price: parseFloat(newItem.price),
        images,
        tags,
        linkedPostIds: newItem.linkedPostIds
      };

      const response = await artworkAPI.createArtwork(artworkData);

      if (response.data.success) {
        setArtworks(prev => [response.data.artwork, ...prev]);
        
        setPagination(prev => ({
          ...prev,
          count: prev.count + 1
        }));
        
        setShowAddItemModal(false);
        alert('Artwork added successfully!');
      } else {
        setSubmitError(response.data.message || 'Failed to add artwork');
      }
    } catch (error) {
      console.error('Error adding artwork:', error);
      setSubmitError(error.response?.data?.message || 'Failed to add artwork. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete artwork
  const handleDeleteClick = (artwork, e) => {
    e.stopPropagation();
    setArtworkToDelete(artwork);
    setShowDeleteConfirm(true);
  };

  const handleDeleteArtwork = async () => {
    if (!artworkToDelete) return;

    setIsDeleting(true);
    try {
      const response = await artworkAPI.deleteArtwork(artworkToDelete._id);
      
      if (response.data.success) {
        setArtworks(prevArtworks => 
          prevArtworks.filter(artwork => artwork._id !== artworkToDelete._id)
        );
        
        setPagination(prev => ({
          ...prev,
          count: prev.count - 1
        }));
        
        alert('Artwork deleted successfully!');
        setShowDeleteConfirm(false);
        setArtworkToDelete(null);
      } else {
        alert('Failed to delete artwork');
      }
    } catch (error) {
      console.error('Error deleting artwork:', error);
      alert('Failed to delete artwork. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if user owns the artwork
  const canDeleteArtwork = (artwork) => {
    return isAuthenticated && currentUser && artwork.artist === currentUser.id;
  };

  if (loading) {
    return (
      <div className="shop-loading">
        <div className="spinner"></div>
        <p>Loading artworks...</p>
      </div>
    );
  }

  return (
    <div className="shop-container">
      <div className="shop-header">
        <h1 className="shop-title">Art Shop</h1>
        {/* ONLY CHANGE: Show button for all authenticated users instead of just artists */}
        {isAuthenticated && (
          <button className="add-item-btn" onClick={handleAddItemClick}>
            {isArtist ? 'ADD NEW ARTWORK' : 'BECOME AN ARTIST'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="shop-filters">
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search artworks..."
            value={filter.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <label>Category</label>
          <select
            value={filter.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="painting">Painting</option>
            <option value="sculpture">Sculpture</option>
            <option value="photography">Photography</option>
            <option value="digital">Digital Art</option>
            <option value="mixed media">Mixed Media</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Grouped price filters */}
        <div className="price-filters">
          <div className="filter-group">
            <label>Min Price</label>
            <input
              type="number"
              placeholder="Min Price"
              value={filter.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="price-input"
            />
          </div>
          <div className="filter-group">
            <label>Max Price</label>
            <input
              type="number"
              placeholder="Max Price"
              value={filter.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="price-input"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="shop-content">
        {error ? (
          <div className="shop-error">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : artworks.length === 0 ? (
          <div className="no-artworks">
            <h3>No artworks found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {artworks.map((artwork) => (
                <div
                  key={artwork._id}
                  className="product-card"
                  onClick={() => handleProductClick(artwork)}
                >
                  {canDeleteArtwork(artwork) && (
                    <button
                      className="delete-artwork-btn"
                      onClick={(e) => handleDeleteClick(artwork, e)}
                      title="Delete artwork"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  )}

                  <div className="product-image">
                    <img
                      src={artwork.images?.[0] || '/api/placeholder/300/200'}
                      alt={artwork.title}
                      onError={(e) => {
                        e.target.src = '/api/placeholder/300/200';
                      }}
                    />
                    {artwork.sold && (
                      <div className="sold-overlay">SOLD</div>
                    )}
                  </div>

                  <div className="product-info">
                    <h3 className="product-title">{artwork.title}</h3>
                    <p className="product-artist">
                      by{' '}
                      {artwork.creator?.username ? (
                        <Link to={`/profile/${artwork.creator.username}`} className="artist-link">
                          {artwork.creator.username}
                        </Link>
                      ) : (
                        artwork.artistName || 'Unknown Artist'
                      )}
                    </p>
                    <p className="product-description">
                      {artwork.description?.length > 100 
                        ? artwork.description.substring(0, 100) + '...'
                        : artwork.description
                      }
                    </p>
                    
                    <div className="product-footer">
                      <div className="product-price">
                        <span className="price">${artwork.price}</span>
                        {artwork.auctionEndDate && (
                          <span className="auction-label">Auction</span>
                        )}
                      </div>
                      
                      <div className="product-stats">
                        <span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          {artwork.likes || 0}
                        </span>
                        <span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                          </svg>
                          {artwork.views || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="shop-pagination">
                <button 
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => handlePageChange(number)}
                    className={`pagination-btn ${pagination.currentPage === number ? 'active' : ''}`}
                  >
                    {number}
                  </button>
                ))}
                
                <button 
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ORIGINAL MODAL - RESTORED */}
      {showAddItemModal && (
        <div className="modal-overlay" onClick={() => setShowAddItemModal(false)}>
          <div className="modal-content enhanced-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Artwork</h2>
            
            {submitError && (
              <div className="error-message">{submitError}</div>
            )}
            
            <form onSubmit={handleAddItem}>
              {/* Basic Information */}
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    required
                    placeholder="Enter artwork title"
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    required
                    rows="4"
                    placeholder="Describe your artwork..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    >
                      <option value="">Select category</option>
                      <option value="painting">Painting</option>
                      <option value="sculpture">Sculpture</option>
                      <option value="photography">Photography</option>
                      <option value="digital">Digital Art</option>
                      <option value="mixed media">Mixed Media</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Tags</label>
                  <input
                    type="text"
                    value={newItem.tags}
                    onChange={(e) => setNewItem({...newItem, tags: e.target.value})}
                    placeholder="Abstract, Modern, Colorful (comma separated)"
                  />
                </div>
              </div>

              {/* Images */}
              <div className="form-section">
                <h3>Images</h3>
                <div className="form-group">
                  <label>Upload Images *</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                  <p className="file-upload-hint">
                    Upload up to 5 images. Supported formats: JPG, PNG, WebP (max 10MB each)
                  </p>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="image-previews">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="image-preview">
                        <img src={preview} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image-button"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ORIGINAL POST LINKING - RESTORED */}
              {userPosts.length > 0 && (
                <div className="form-section">
                  <h3>Link to Your Posts</h3>
                  <p style={sectionDescStyle}>
                    Optional: Link this artwork to your existing posts to cross-promote your content.
                  </p>
                  
                  <div style={postsSelectionStyle}>
                    {userPosts.map(post => {
                      const isSelected = newItem.linkedPostIds.includes(post._id);
                      const hasLinkedItem = post.linkedShopItem;
                      
                      return (
                        <div 
                          key={post._id} 
                          style={{
                            ...postOptionStyle,
                            backgroundColor: isSelected ? '#f0f2ff' : 'white',
                            borderColor: isSelected ? '#667eea' : (hasLinkedItem ? '#f59e0b' : '#e5e7eb')
                          }}
                          onClick={() => handlePostSelection(post._id)}
                        >
                          <div style={postContentStyle}>
                            {post.content && post.content.type === 'image' && post.content.url && (
                              <img 
                                src={post.content.url} 
                                alt="Post preview" 
                                style={postImageStyle}
                              />
                            )}
                            <div style={postDetailsStyle}>
                              <p style={postCaptionStyle}>
                                {post.caption || 'No caption'}
                              </p>
                              <div style={postDateStyle}>
                                {new Date(post.createdAt).toLocaleDateString()}
                              </div>
                              {hasLinkedItem && (
                                <span style={linkedIndicatorStyle}>
                                  Already linked to: {post.linkedShopItem.title}
                                </span>
                              )}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handlePostSelection(post._id)}
                            style={checkboxStyle}
                          />
                        </div>
                      );
                    })}
                  </div>
                  
                  {newItem.linkedPostIds.length > 0 && (
                    <div style={selectionSummaryStyle}>
                      {newItem.linkedPostIds.length} post(s) selected
                    </div>
                  )}
                </div>
              )}

              {loadingPosts && (
                <div style={noPostsStyle}>
                  Loading your posts...
                </div>
              )}

              {/* Form Actions */}
              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Artwork'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Artwork</h3>
            <p>Are you sure you want to delete "{artworkToDelete?.title}"? This action cannot be undone.</p>
            <div className="modal-buttons">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteArtwork}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showArtistRequestForm && (
        <ArtistRequestForm
          onClose={() => setShowArtistRequestForm(false)}
          onSuccess={handleArtistRequestSuccess}
        />
      )}
    </div>
  );
};

// ORIGINAL INLINE STYLES - RESTORED
const postOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  border: '2px solid',
  borderRadius: '8px',
  marginBottom: '0.75rem',
  transition: 'all 0.2s ease'
};

const postContentStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const postImageStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '6px',
  objectFit: 'cover',
  border: '1px solid #e5e7eb'
};

const postDetailsStyle = {
  flex: 1,
  minWidth: 0
};

const postCaptionStyle = {
  margin: '0 0 0.25rem 0',
  fontWeight: '500',
  color: '#374151',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const postDateStyle = {
  fontSize: '0.8rem',
  color: '#6b7280'
};

const linkedIndicatorStyle = {
  fontSize: '0.8rem',
  color: '#f59e0b',
  fontWeight: '500',
  display: 'block',
  marginTop: '0.25rem'
};

const checkboxStyle = {
  width: '18px',
  height: '18px'
};

const sectionDescStyle = {
  margin: '0 0 1rem 0',
  color: '#6b7280',
  fontSize: '0.9rem',
  lineHeight: '1.5'
};

const postsSelectionStyle = {
  maxHeight: '400px',
  overflowY: 'auto',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '1rem'
};

const selectionSummaryStyle = {
  textAlign: 'center',
  padding: '1rem',
  backgroundColor: '#f0f2ff',
  borderRadius: '6px',
  color: '#667eea',
  fontWeight: '500',
  marginTop: '1rem'
};

const noPostsStyle = {
  textAlign: 'center',
  padding: '2rem',
  color: '#6b7280',
  fontStyle: 'italic',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px dashed #d1d5db'
};

export default Shop;