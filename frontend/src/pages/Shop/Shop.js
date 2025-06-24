// src/pages/Shop/Shop.js - Updated with product navigation
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Shop.css';
import { useAuth } from '../../hooks/useAuth';
import { artworkAPI } from '../../services/api';

const Shop = () => {
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    category: '',
    price: '',
    sortBy: 'latest'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    count: 0
  });
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    category: 'painting',
    imageFile: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Delete functionality states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [artworkToDelete, setArtworkToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isAuthenticated, currentUser } = useAuth();
  
  // Check if current user is an artist
  const isArtist = currentUser?.isArtist || false;

  // Fetch artworks from database
  useEffect(() => {
    const fetchArtworks = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const queryParams = {
          page: pagination.currentPage,
          limit: 12,
          forSale: true, // Only show artworks that are for sale
          ...filter
        };

        // Remove empty filters
        Object.keys(queryParams).forEach(key => {
          if (queryParams[key] === '' || queryParams[key] === null) {
            delete queryParams[key];
          }
        });

        console.log('Fetching artworks with params:', queryParams);
        
        const response = await artworkAPI.getArtworks(queryParams);
        
        if (response.data.success) {
          setArtworks(response.data.artworks);
          setPagination({
            currentPage: response.data.pagination.currentPage,
            totalPages: response.data.pagination.totalPages,
            count: response.data.pagination.count
          });
        } else {
          throw new Error(response.data.message || 'Failed to fetch artworks');
        }
      } catch (error) {
        console.error('Error fetching artworks:', error);
        setError(error.response?.data?.message || error.message || 'Failed to load artworks');
        setArtworks([]);
        setPagination({ currentPage: 1, totalPages: 1, count: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, [filter, pagination.currentPage]);

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

  // Handle adding new artwork (Artist-only)
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please log in to add artworks');
      return;
    }

    if (!isArtist) {
      alert('Only artists can add artworks. You need to become an artist first.');
      return;
    }

    if (!newItem.imageFile) {
      setSubmitError('Please select an image for your artwork');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // First upload the image
      const formData = new FormData();
      formData.append('images', newItem.imageFile); // Changed from 'image' to 'images'

      const uploadResponse = await artworkAPI.uploadArtworkImages(formData);
      
      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.message || 'Failed to upload image');
      }

      // Then create the artwork with the uploaded image URL
      const artworkData = {
        title: newItem.title,
        description: newItem.description,
        price: parseFloat(newItem.price),
        category: newItem.category,
        images: uploadResponse.data.filePaths // Changed from 'images' to 'filePaths'
      };

      const response = await artworkAPI.createArtwork(artworkData);
      
      if (response.data.success) {
        // Reset form
        setNewItem({
          title: '',
          description: '',
          price: '',
          category: 'painting',
          imageFile: null
        });
        setPreviewImage(null);
        setShowAddItemModal(false);
        
        // Refresh artworks list
        setFilter(prev => ({ ...prev }));
        
        alert('Artwork added successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to add artwork');
      }
    } catch (error) {
      console.error('Error adding artwork:', error);
      setSubmitError(error.response?.data?.message || error.message || 'Failed to add artwork');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewItem(prev => ({ ...prev, imageFile: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const numbers = [];
    const maxVisible = 5;
    let start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(pagination.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      numbers.push(i);
    }
    
    return numbers;
  };

  return (
    <div className="shop-container">
      <header className="shop-header">
        <div className="shop-header-content">
          <h1 className="shop-title">Uncreated Shop</h1>
          <p className="shop-subtitle">Discover and collect unique artworks from talented creators</p>
          
          {/* Artist-only Add Product Button */}
          {isAuthenticated && isArtist && (
            <button 
              className="add-item-btn artist-only-btn"
              onClick={() => setShowAddItemModal(true)}
            >
              Add Your Artwork +
            </button>
          )}
          
          {/* Message for authenticated non-artists */}
          {isAuthenticated && !isArtist && (
            <div className="artist-info">
              <p>Want to sell your artwork? <Link to="/profile">Become an artist</Link></p>
            </div>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="shop-filters">
        <div className="filter-group">
          <label>Category:</label>
          <select 
            value={filter.category} 
            onChange={(e) => handleFilterChange('category', e.target.value)}
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
          <label>Sort By:</label>
          <select 
            value={filter.sortBy} 
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="shop-loading">
          <div className="loading-spinner"></div>
          <p>Loading artworks...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="shop-error">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <div className="shop-content">
          <div className="products-grid">
            {artworks.length > 0 ? (
              artworks.map((artwork) => (
                <motion.div
                  key={artwork._id}
                  className="product-card"
                  onClick={() => handleProductClick(artwork)}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="product-image">
                    <img 
                      src={artwork.images && artwork.images[0] ? artwork.images[0] : '/api/placeholder/300/300'} 
                      alt={artwork.title}
                      onError={(e) => {
                        e.target.src = '/api/placeholder/300/300';
                      }}
                    />
                    {artwork.isSold && (
                      <div className="sold-overlay">
                        <span>SOLD</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-title">{artwork.title}</h3>
                    <p className="product-artist">by {artwork.creator?.username || 'Unknown Artist'}</p>
                    <p className="product-description">
                      {artwork.description.length > 100 
                        ? `${artwork.description.substring(0, 100)}...` 
                        : artwork.description
                      }
                    </p>
                    
                    <div className="product-footer">
                      <div className="product-price">
                        <span className="price">Starting at ${artwork.price.toFixed(2)}</span>
                        <span className="auction-label">Auction</span>
                      </div>
                      
                      <div className="product-stats">
                        <span className="likes">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          {artwork.likes || 0}
                        </span>
                        <span className="views">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          {artwork.views || 0}
                        </span>
                      </div>
                    </div>

                    {/* Delete button for artwork owner */}
                    {isAuthenticated && currentUser && artwork.creator._id === currentUser._id && (
                      <button 
                        className="delete-artwork-btn"
                        onClick={(e) => handleDeleteClick(artwork, e)}
                        title="Delete Artwork"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="M19,6V20a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6M8,6V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2V6"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="no-products">
                <p>No artworks found matching your criteria.</p>
                {isAuthenticated && isArtist && (
                  <button 
                    className="add-first-artwork-btn"
                    onClick={() => setShowAddItemModal(true)}
                  >
                    Add Your First Artwork
                  </button>
                )}
              </div>
            )}
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
              
              {getPaginationNumbers().map(number => (
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
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="modal-overlay" onClick={() => setShowAddItemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Artwork</h2>
            
            {submitError && (
              <div className="error-message">{submitError}</div>
            )}
            
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Starting Price ($):</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category:</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                >
                  <option value="painting">Painting</option>
                  <option value="sculpture">Sculpture</option>
                  <option value="photography">Photography</option>
                  <option value="digital">Digital Art</option>
                  <option value="mixed media">Mixed Media</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
                {previewImage && (
                  <div className="image-preview">
                    <img src={previewImage} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="modal-buttons">
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Artwork'}
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

export default Shop;