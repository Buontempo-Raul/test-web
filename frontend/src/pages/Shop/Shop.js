// src/pages/Shop/Shop.js - Updated with proper artist authentication
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Shop.css';
import { useAuth } from '../../hooks/useAuth';
import { artworkAPI } from '../../services/api';

const Shop = () => {
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

  const { isAuthenticated, currentUser } = useAuth();
  
  // ✅ Check if current user is an artist (using isArtist field, not role)
  const isArtist = currentUser?.isArtist || false;
  
  console.log('Current user:', currentUser);
  console.log('Is authenticated:', isAuthenticated);
  console.log('Is artist:', isArtist);

  // Fetch artworks from database
  useEffect(() => {
    const fetchArtworks = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const queryParams = {
          page: pagination.currentPage,
          limit: 12,
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
            currentPage: response.data.currentPage,
            totalPages: response.data.pages,
            count: response.data.count
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

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Create artwork data object
      const artworkData = {
        title: newItem.title,
        description: newItem.description,
        price: parseFloat(newItem.price),
        category: newItem.category,
        forSale: true,
        images: []
      };

      // First upload the image if provided
      if (newItem.imageFile) {
        const formData = new FormData();
        formData.append('images', newItem.imageFile);

        try {
          const uploadResponse = await artworkAPI.uploadArtworkImages(formData);
          if (uploadResponse.data.success) {
            artworkData.images = uploadResponse.data.filePaths;
          } else {
            throw new Error('Failed to upload image');
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload image. Please try again.');
        }
      }

      // Then create the artwork
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
          
          {/* ✅ Artist-only Add Product Button */}
          {isAuthenticated && isArtist && (
            <button 
              className="add-item-btn artist-only-btn"
              onClick={() => setShowAddItemModal(true)}
            >
              Add Your Artwork +
            </button>
          )}
          
          {/* ✅ Message for authenticated non-artists */}
          {isAuthenticated && !isArtist && (
            <div className="artist-info">
              <p>Want to sell your artwork? <a href="/profile" className="become-artist-link">Become an artist</a> to start selling!</p>
            </div>
          )}
          
          {/* ✅ Message for non-authenticated users */}
          {!isAuthenticated && (
            <div className="artist-info">
              <p><a href="/login" className="become-artist-link">Login</a> or <a href="/register" className="become-artist-link">register</a> to start selling your artwork!</p>
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
          <label>Price Range:</label>
          <select 
            value={filter.price} 
            onChange={(e) => handleFilterChange('price', e.target.value)}
          >
            <option value="">All Prices</option>
            <option value="0-100">$0 - $100</option>
            <option value="100-300">$100 - $300</option>
            <option value="300-500">$300 - $500</option>
            <option value="500-1000">$500 - $1000</option>
            <option value="1000">$1000+</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select 
            value={filter.sortBy} 
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="latest">Latest</option>
            <option value="popular">Most Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      {!loading && !error && (
        <div className="results-summary">
          <p>Showing {artworks.length} of {pagination.count} artworks</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <h3>Unable to load artworks</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-btn"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading amazing artworks...</p>
        </div>
      )}

      {/* Artworks Grid */}
      {!loading && !error && (
        <>
          {artworks.length === 0 ? (
            <div className="empty-state">
              <h3>No artworks found</h3>
              <p>Try adjusting your filters or check back later for new additions.</p>
              {isAuthenticated && isArtist && (
                <button 
                  className="add-first-artwork-btn"
                  onClick={() => setShowAddItemModal(true)}
                >
                  Add the First Artwork
                </button>
              )}
            </div>
          ) : (
            <div className="artworks-grid">
              {artworks.map((artwork, index) => (
                <motion.div
                  key={artwork._id}
                  className="artwork-card"
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100 
                  }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Main product link - everything except artist section */}
                  <Link to={`/shop/product/${artwork._id}`} className="artwork-main-link">
                    <div className="artwork-image-container">
                      <motion.img 
                        src={artwork.images[0] || '/placeholder-image.jpg'} 
                        alt={artwork.title}
                        className="artwork-image"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                      {artwork.isSold && (
                        <motion.div 
                          className="sold-overlay"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          SOLD
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="artwork-info">
                      <motion.h3 
                        className="artwork-title"
                        whileHover={{ color: "#007bff", x: 2 }}
                        transition={{ duration: 0.2 }}
                      >
                        {artwork.title}
                      </motion.h3>
                      <motion.p 
                        className="artwork-description"
                        whileHover={{ color: "#333" }}
                        transition={{ duration: 0.2 }}
                      >
                        {artwork.description.length > 100 
                          ? `${artwork.description.substring(0, 100)}...` 
                          : artwork.description
                        }
                      </motion.p>
                      
                      <div className="artwork-meta">
                        <motion.span 
                          className="artwork-price"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          ${artwork.price}
                        </motion.span>
                        <motion.span 
                          className="artwork-category"
                          whileHover={{ scale: 1.05, backgroundColor: "#e3f2fd" }}
                          transition={{ duration: 0.2 }}
                        >
                          {artwork.category}
                        </motion.span>
                      </div>
                    </div>
                  </Link>

                  {/* Separate artist section - links to artist profile */}
                  <div className="artwork-info">
                    <Link 
                      to={`/profile/${artwork.creator?.username || 'unknown'}`} 
                      className="artwork-creator-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <motion.div 
                        className="artwork-creator"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.img 
                          src={artwork.creator?.profileImage || '/default-profile.jpg'} 
                          alt={artwork.creator?.username || 'Creator'}
                          className="creator-avatar"
                          whileHover={{ 
                            scale: 1.2, 
                            rotate: 5,
                            boxShadow: "0 4px 15px rgba(0,123,255,0.3)"
                          }}
                          transition={{ duration: 0.2 }}
                        />
                        <motion.span 
                          className="creator-name"
                          whileHover={{ 
                            color: "#007bff",
                            fontWeight: 600,
                            x: 2
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          @{artwork.creator?.username || 'Unknown'}
                        </motion.span>
                      </motion.div>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <motion.button 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="pagination-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Previous</span>
              </motion.button>
              
              {getPaginationNumbers().map(number => (
                <motion.button
                  key={number}
                  onClick={() => handlePageChange(number)}
                  className={`pagination-btn ${pagination.currentPage === number ? 'active' : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{number}</span>
                </motion.button>
              ))}
              
              <motion.button 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="pagination-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Next</span>
              </motion.button>
            </div>
          )}
        </>
      )}

      {/* ✅ Artist-Only Add Item Modal */}
      {showAddItemModal && isArtist && (
        <motion.div 
          className="modal-overlay" 
          onClick={() => setShowAddItemModal(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
          >
            <motion.h3
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Add New Artwork
            </motion.h3>
            <motion.p 
              className="modal-subtitle"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Share your creativity with the world
            </motion.p>
            
            {submitError && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {submitError}
              </motion.div>
            )}
            
            <form onSubmit={handleAddItem}>
              <motion.div 
                className="form-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label>Title:</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Enter artwork title"
                />
              </motion.div>
              
              <motion.div 
                className="form-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label>Description:</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows="3"
                  placeholder="Describe your artwork"
                />
              </motion.div>
              
              <motion.div 
                className="form-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label>Price ($):</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                  required
                  placeholder="0.00"
                />
              </motion.div>
              
              <motion.div 
                className="form-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label>Category:</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  <option value="painting">Painting</option>
                  <option value="sculpture">Sculpture</option>
                  <option value="photography">Photography</option>
                  <option value="digital">Digital Art</option>
                  <option value="mixed media">Mixed Media</option>
                  <option value="other">Other</option>
                </select>
              </motion.div>
              
              <motion.div 
                className="form-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label>Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
                {previewImage && (
                  <motion.div 
                    className="image-preview"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <img src={previewImage} alt="Preview" />
                  </motion.div>
                )}
              </motion.div>
              
              <motion.div 
                className="modal-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.button 
                  type="button" 
                  onClick={() => setShowAddItemModal(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="primary-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSubmitting ? 'Adding...' : 'Add Artwork'}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Shop;