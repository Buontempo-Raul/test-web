// src/pages/Shop/Shop.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Shop.css';
import Cart from '../../components/shop/Cart/Cart';
import AddToCartButton from '../../components/shop/AddToCartButton/AddToCartButton';
import api from '../../services/api';
import { artworkAPI } from '../../services/api';

// Temporary artwork data - Replace with API calls when ready
const tempArtworks = [
  {
    _id: '1',
    title: 'Abstract Harmony',
    description: 'A vibrant exploration of color and form.',
    images: ['https://via.placeholder.com/400x300?text=Abstract+Harmony'],
    price: 299.99,
    category: 'painting',
    creator: {
      username: 'artistic_soul',
      profileImage: 'https://via.placeholder.com/50x50'
    }
  },
  {
    _id: '2',
    title: 'Urban Landscape',
    description: 'Cityscape captured through a unique perspective.',
    images: ['https://via.placeholder.com/400x300?text=Urban+Landscape'],
    price: 349.99,
    category: 'photography',
    creator: {
      username: 'city_explorer',
      profileImage: 'https://via.placeholder.com/50x50'
    }
  },
  {
    _id: '3',
    title: 'Serenity',
    description: 'A peaceful nature-inspired sculpture.',
    images: ['https://via.placeholder.com/400x300?text=Serenity'],
    price: 499.99,
    category: 'sculpture',
    creator: {
      username: 'nature_artist',
      profileImage: 'https://via.placeholder.com/50x50'
    }
  },
  {
    _id: '4',
    title: 'Digital Dreams',
    description: 'A futuristic digital artwork exploring imagination.',
    images: ['https://via.placeholder.com/400x300?text=Digital+Dreams'],
    price: 199.99,
    category: 'digital',
    creator: {
      username: 'future_creative',
      profileImage: 'https://via.placeholder.com/50x50'
    }
  },
  {
    _id: '5',
    title: 'Emotional Expressions',
    description: 'A portrait series capturing human emotions.',
    images: ['https://via.placeholder.com/400x300?text=Emotional+Expressions'],
    price: 399.99,
    category: 'painting',
    creator: {
      username: 'emotion_artist',
      profileImage: 'https://via.placeholder.com/50x50'
    }
  },
  {
    _id: '6',
    title: 'Textured Patterns',
    description: 'Mixed media artwork with unique textures and patterns.',
    images: ['https://via.placeholder.com/400x300?text=Textured+Patterns'],
    price: 279.99,
    category: 'mixed media',
    creator: {
      username: 'texture_master',
      profileImage: 'https://via.placeholder.com/50x50'
    }
  }
];

const Shop = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: '',
    priceRange: '',
    sortBy: 'latest'
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

  useEffect(() => {
    // Function to fetch artworks
    const fetchArtworks = async () => {
      setLoading(true);
      try {
        // Use the artworkAPI service
        const response = await artworkAPI.getArtworks(filter);
        // If backend is ready, uncomment this
        // if (response.data.success) {
        //   setArtworks(response.data.artworks);
        // }

        // Temporary - using mock data
        // Simulate API delay
        setTimeout(() => {
          setArtworks(tempArtworks);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching artworks:', error);
        setLoading(false);
      }
    };

    fetchArtworks();
  }, [filter]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value
    });
  };

  const handleAddItemClick = () => {
    setShowAddItemModal(true);
  };

  const handleCloseModal = () => {
    setShowAddItemModal(false);
    setNewItem({
      title: '',
      description: '',
      price: '',
      category: 'painting',
      imageFile: null
    });
    setPreviewImage(null);
    setSubmitError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Update the state with the file
      setNewItem({
        ...newItem,
        imageFile: file
      });
      
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
    }
  };

  const handleSubmitNewItem = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // In a real implementation, we would send the file to the server
      // Create a FormData object to send the file and other data
      const formData = new FormData();
      formData.append('title', newItem.title);
      formData.append('description', newItem.description);
      formData.append('price', newItem.price);
      formData.append('category', newItem.category);
      formData.append('image', newItem.imageFile);
      
      // Uncomment when backend is ready
      // const response = await artworkAPI.createArtworkWithImage(formData);
      // if (response.data.success) {
      //   // Add the new artwork to the existing artworks
      //   setArtworks([response.data.artwork, ...artworks]);
      //   setIsSubmitting(false);
      //   handleCloseModal();
      //   return;
      // }
      
      // For now, simulate the API call with the local preview
      setTimeout(() => {
        // Add the new artwork to the existing artworks
        const newArtwork = {
          _id: `temp-${Date.now()}`,
          title: newItem.title,
          description: newItem.description,
          price: parseFloat(newItem.price),
          category: newItem.category,
          images: [previewImage], // Use the local preview URL
          creator: {
            username: localStorage.getItem('username') || 'current_user',
            profileImage: 'https://via.placeholder.com/50x50'
          }
        };
        
        setArtworks([newArtwork, ...artworks]);
        setIsSubmitting(false);
        handleCloseModal();
      }, 1000);
    } catch (error) {
      console.error('Error adding new item:', error);
      setSubmitError('Failed to add new item. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="shop-container">
      <div className="shop-header">
        <h1 className="shop-title">Explore Artworks</h1>
        <div className="shop-actions">
          <button className="add-item-button" onClick={handleAddItemClick}>
            Add New Item
          </button>
          <Cart />
        </div>
      </div>
      
      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="modal-overlay">
          <div className="add-item-modal">
            <h2>Add New Artwork</h2>
            <form onSubmit={handleSubmitNewItem}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newItem.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newItem.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="price">Price ($)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  min="0.01"
                  step="0.01"
                  value={newItem.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={newItem.category}
                  onChange={handleInputChange}
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
              
              <div className="form-group">
                <label htmlFor="imageFile">Artwork Image</label>
                <input
                  type="file"
                  id="imageFile"
                  name="imageFile"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                {previewImage && (
                  <div className="image-preview">
                    <img src={previewImage} alt="Preview" />
                  </div>
                )}
              </div>
              
              {submitError && <p className="error-message">{submitError}</p>}
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isSubmitting || !newItem.imageFile}
                >
                  {isSubmitting ? 'Adding...' : 'Add Artwork'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="shop-filters">
        <div className="filter-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={filter.category}
            onChange={handleFilterChange}
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
          <label htmlFor="priceRange">Price Range</label>
          <select
            id="priceRange"
            name="priceRange"
            value={filter.priceRange}
            onChange={handleFilterChange}
          >
            <option value="">All Prices</option>
            <option value="0-100">Under $100</option>
            <option value="100-300">$100 - $300</option>
            <option value="300-500">$300 - $500</option>
            <option value="500-1000">$500 - $1000</option>
            <option value="1000-">Over $1000</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="sortBy">Sort By</label>
          <select
            id="sortBy"
            name="sortBy"
            value={filter.sortBy}
            onChange={handleFilterChange}
          >
            <option value="latest">Latest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading artworks...</div>
      ) : (
        <div className="artworks-grid">
          {artworks.length > 0 ? (
            artworks.map((artwork) => (
              <div key={artwork._id} className="artwork-card">
                <div className="artwork-image">
                  <img src={artwork.images[0]} alt={artwork.title} />
                </div>
                <div className="artwork-details">
                  <h3 className="artwork-title">{artwork.title}</h3>
                  <p className="artwork-creator">
                    by <Link to={`/profile/${artwork.creator.username}`}>{artwork.creator.username}</Link>
                  </p>
                  <p className="artwork-category">{artwork.category}</p>
                  <p className="artwork-price">${artwork.price.toFixed(2)}</p>
                  <Link to={`/shop/product/${artwork._id}`} className="view-button">
                    View Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">No artworks found matching your criteria.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Shop;