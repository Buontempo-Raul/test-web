// frontend/src/pages/Shop/Shop.js - Enhanced with post linking functionality
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { artworkAPI } from '../../services/api';
import './Shop.css';

const Shop = () => {
  const navigate = useNavigate();
  
  // State management
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    search: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    count: 0
  });

  // Modal states
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [artworkToDelete, setArtworkToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states for adding artwork
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    category: 'painting',
    medium: '',
    tags: '',
    linkedPostIds: [] // NEW: Array of linked post IDs
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [userPosts, setUserPosts] = useState([]); // NEW: User's posts for linking
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Authentication
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

  // Fetch artworks
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

  // NEW: Fetch user's posts for linking
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

  // Handle opening add item modal
  const handleAddItemClick = () => {
    if (!isAuthenticated) {
      alert('Please log in to add artworks');
      return;
    }

    if (!isArtist) {
      alert('Only artists can add artworks.');
      return;
    }

    // Reset form
    setNewItem({
      title: '',
      description: '',
      price: '',
      category: 'painting',
      medium: '',
      tags: '',
      linkedPostIds: []
    });
    setImages([]);
    setImagePreviews([]);
    setSubmitError('');
    
    // Fetch user posts and open modal
    fetchUserPosts();
    setShowAddItemModal(true);
  };

  // Handle image upload
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter(file => {
      const isValidImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

      if (!isValidImage) {
        setSubmitError('Please select only image files');
        return false;
      }

      if (!isValidSize) {
        setSubmitError('Image size must be less than 10MB');
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setSubmitError('');

    try {
      // Upload images
      const uploadFormData = new FormData();
      validFiles.forEach(file => {
        uploadFormData.append('images', file);
      });

      setIsSubmitting(true);
      const response = await artworkAPI.uploadImages(uploadFormData);
      
      if (response.data.success) {
        const newImages = response.data.images;
        setImages(prev => [...prev, ...newImages]);
        
        // Create previews
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setSubmitError('Failed to upload images. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove image
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // NEW: Handle post selection
  const handlePostSelection = (postId) => {
    setNewItem(prev => ({
      ...prev,
      linkedPostIds: prev.linkedPostIds.includes(postId)
        ? prev.linkedPostIds.filter(id => id !== postId)
        : [...prev.linkedPostIds, postId]
    }));
  };

  // Handle adding new artwork
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    // Validate required fields
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
      // Process tags
      const tags = newItem.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Prepare artwork data
      const artworkData = {
        ...newItem,
        price: parseFloat(newItem.price),
        images,
        tags,
        linkedPostIds: newItem.linkedPostIds
      };

      const response = await artworkAPI.createArtwork(artworkData);

      if (response.data.success) {
        // Add new artwork to the list
        setArtworks(prev => [response.data.artwork, ...prev]);
        
        // Update pagination count
        setPagination(prev => ({
          ...prev,
          count: prev.count + 1
        }));
        
        // Close modal and reset form
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
    e.stopPropagation(); // Prevent navigation when clicking delete
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
      } else {
        throw new Error(response.data.message || 'Failed to delete artwork');
      }
    } catch (error) {
      console.error('Error deleting artwork:', error);
      alert(error.response?.data?.message || error.message || 'Failed to delete artwork');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setArtworkToDelete(null);
    }
  };

  // Render post option for selection
  const renderPostOption = (post) => {
    const isSelected = newItem.linkedPostIds.includes(post._id);
    const hasLinkedItem = post.linkedShopItem;

    return (
      <div 
        key={post._id} 
        style={{
          ...postOptionStyle,
          backgroundColor: isSelected ? '#f0f2ff' : 'white',
          borderColor: isSelected ? '#667eea' : hasLinkedItem ? '#fbbf24' : '#e5e7eb',
          opacity: hasLinkedItem ? 0.6 : 1,
          cursor: hasLinkedItem ? 'not-allowed' : 'pointer'
        }}
        onClick={() => !hasLinkedItem && handlePostSelection(post._id)}
      >
        <div style={postContentStyle}>
          {post.content?.url && (
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
            <span style={postDateStyle}>
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
            {hasLinkedItem && (
              <span style={linkedIndicatorStyle}>
                Already linked to: {hasLinkedItem.title}
              </span>
            )}
          </div>
        </div>
        {!hasLinkedItem && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handlePostSelection(post._id)}
            style={checkboxStyle}
          />
        )}
      </div>
    );
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
        {isArtist && (
          <button className="add-item-btn" onClick={handleAddItemClick}>
            Add New Artwork
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="shop-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search artworks..."
            value={filter.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
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

        <div className="filter-group">
          <input
            type="number"
            placeholder="Min Price"
            value={filter.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="price-input"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filter.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="price-input"
          />
        </div>
      </div>

      {/* Content */}
      <div className="shop-content">
        {error ? (
          <div className="shop-error">
            <h2>Error</h2>
            <p>{error}</p>
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
                  <div className="product-image">
                    <img
                      src={artwork.images?.[0] || '/placeholder-image.jpg'}
                      alt={artwork.title}
                    />
                    {isArtist && artwork.creator._id === currentUser._id && (
                      <button
                        className="delete-btn"
                        onClick={(e) => handleDeleteClick(artwork, e)}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-title">{artwork.title}</h3>
                    <p className="product-artist">by {artwork.creator.username}</p>
                    <div className="product-footer">
                      <span className="product-price">${artwork.price}</span>
                      <span className="product-category">{artwork.category}</span>
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

      {/* Enhanced Add Item Modal with Post Linking */}
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
                    placeholder="Describe your artwork"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price ($) *</label>
                    <input
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                      required
                    >
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
                  <label>Medium</label>
                  <input
                    type="text"
                    value={newItem.medium}
                    onChange={(e) => setNewItem({...newItem, medium: e.target.value})}
                    placeholder="e.g., Oil on canvas, Digital print, Bronze"
                  />
                </div>

                <div className="form-group">
                  <label>Tags</label>
                  <input
                    type="text"
                    value={newItem.tags}
                    onChange={(e) => setNewItem({...newItem, tags: e.target.value})}
                    placeholder="Enter tags separated by commas"
                  />
                </div>
              </div>

              {/* Images */}
              <div className="form-section">
                <h3>Images *</h3>
                <div className="form-group">
                  <label>Upload Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <div className="file-upload-hint">
                    Select multiple images (max 10MB each)
                  </div>
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
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* NEW: Link to Posts */}
              <div className="form-section">
                <h3>Link to Your Posts (Optional)</h3>
                <p style={sectionDescStyle}>
                  Select posts to link to this artwork. When users view these posts, they'll see a button to view this product.
                </p>
                
                {loadingPosts ? (
                  <div>Loading your posts...</div>
                ) : userPosts.length > 0 ? (
                  <div style={postsSelectionStyle}>
                    {userPosts.map(renderPostOption)}
                    {newItem.linkedPostIds.length > 0 && (
                      <div style={selectionSummaryStyle}>
                        {newItem.linkedPostIds.length} post{newItem.linkedPostIds.length > 1 ? 's' : ''} selected
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={noPostsStyle}>
                    You don't have any posts yet. Create some posts first to link them to your artworks.
                  </div>
                )}
              </div>

              <div className="modal-buttons">
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Artwork'}
                </button>
                <button type="button" onClick={() => setShowAddItemModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirm">
            <h3>Delete Artwork</h3>
            <p>Are you sure you want to delete "{artworkToDelete?.title}"?</p>
            <p>This action cannot be undone.</p>
            
            <div className="modal-buttons">
              <button 
                onClick={handleDeleteArtwork} 
                disabled={isDeleting}
                className="delete-btn"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Inline styles for new post linking components
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