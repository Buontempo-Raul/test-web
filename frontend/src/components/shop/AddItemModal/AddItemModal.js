// frontend/src/components/shop/AddItemModal/AddItemModal.js - Updated with post linking
import React, { useState, useEffect } from 'react';
import { artworkAPI } from '../../../services/api';
import './AddItemModal.css';

const AddItemModal = ({ isOpen, onClose, onItemAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'painting',
    medium: '',
    dimensions: {
      width: '',
      height: '',
      depth: '',
      unit: 'cm'
    },
    tags: '',
    forSale: true,
    linkedPostIds: [] // NEW: Array of linked post IDs
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userPosts, setUserPosts] = useState([]); // NEW: User's posts for linking
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Fetch user's posts for linking
  useEffect(() => {
    if (isOpen) {
      fetchUserPosts();
    }
  }, [isOpen]);

  const fetchUserPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await artworkAPI.getUserPosts();
      if (response.data.success) {
        setUserPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        price: '',
        category: 'painting',
        medium: '',
        dimensions: {
          width: '',
          height: '',
          depth: '',
          unit: 'cm'
        },
        tags: '',
        forSale: true,
        linkedPostIds: []
      });
      setImages([]);
      setImagePreviews([]);
      setError('');
      setUserPosts([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('dimensions.')) {
      const dimensionKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
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
        setError('Please select only image files');
        return false;
      }

      if (!isValidSize) {
        setError('Image size must be less than 10MB');
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setError('');

    try {
      // Upload images
      const uploadFormData = new FormData();
      validFiles.forEach(file => {
        uploadFormData.append('images', file);
      });

      setLoading(true);
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
      setError('Failed to upload images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Remove image
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // NEW: Handle post selection
  const handlePostSelection = (postId) => {
    setFormData(prev => ({
      ...prev,
      linkedPostIds: prev.linkedPostIds.includes(postId)
        ? prev.linkedPostIds.filter(id => id !== postId)
        : [...prev.linkedPostIds, postId]
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title || !formData.description || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Process tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Prepare artwork data
      const artworkData = {
        ...formData,
        price: parseFloat(formData.price),
        images,
        tags,
        linkedPostIds: formData.linkedPostIds
      };

      // Remove empty dimensions
      Object.keys(artworkData.dimensions).forEach(key => {
        if (key !== 'unit' && !artworkData.dimensions[key]) {
          delete artworkData.dimensions[key];
        }
      });

      const response = await artworkAPI.createArtwork(artworkData);

      if (response.data.success) {
        onItemAdded(response.data.artwork);
        onClose();
      } else {
        setError(response.data.message || 'Failed to create artwork');
      }
    } catch (error) {
      console.error('Error creating artwork:', error);
      setError(error.response?.data?.message || 'Failed to create artwork. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render post for selection
  const renderPostOption = (post) => {
    const isSelected = formData.linkedPostIds.includes(post._id);
    const hasLinkedItem = post.linkedShopItem;

    return (
      <div 
        key={post._id} 
        className={`post-option ${isSelected ? 'selected' : ''} ${hasLinkedItem ? 'has-linked-item' : ''}`}
        onClick={() => !hasLinkedItem && handlePostSelection(post._id)}
      >
        <div className="post-option-content">
          {post.content?.url && (
            <img 
              src={post.content.url} 
              alt="Post preview" 
              className="post-option-image"
            />
          )}
          <div className="post-option-details">
            <p className="post-option-caption">
              {post.caption || 'No caption'}
            </p>
            <span className="post-option-date">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
            {hasLinkedItem && (
              <span className="already-linked-indicator">
                Already linked to: {hasLinkedItem.title}
              </span>
            )}
          </div>
        </div>
        {!hasLinkedItem && (
          <div className="post-option-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handlePostSelection(post._id)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-item-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Artwork</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form className="add-item-form" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter artwork title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="4"
                placeholder="Describe your artwork"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price ($) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
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
            </div>

            <div className="form-group">
              <label htmlFor="medium">Medium</label>
              <input
                type="text"
                id="medium"
                name="medium"
                value={formData.medium}
                onChange={handleInputChange}
                placeholder="e.g., Oil on canvas, Digital print, Bronze"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="Enter tags separated by commas"
              />
            </div>
          </div>

          {/* Dimensions */}
          <div className="form-section">
            <h3>Dimensions (Optional)</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dimensions.width">Width</label>
                <input
                  type="number"
                  id="dimensions.width"
                  name="dimensions.width"
                  value={formData.dimensions.width}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dimensions.height">Height</label>
                <input
                  type="number"
                  id="dimensions.height"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dimensions.depth">Depth</label>
                <input
                  type="number"
                  id="dimensions.depth"
                  name="dimensions.depth"
                  value={formData.dimensions.depth}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dimensions.unit">Unit</label>
                <select
                  id="dimensions.unit"
                  name="dimensions.unit"
                  value={formData.dimensions.unit}
                  onChange={handleInputChange}
                >
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="form-section">
            <h3>Images *</h3>
            <div className="form-group">
              <label htmlFor="images">Upload Images</label>
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
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
            <p className="section-description">
              Select posts to link to this artwork. When users view these posts, they'll see a button to view this product.
            </p>
            
            {loadingPosts ? (
              <div className="loading-posts">Loading your posts...</div>
            ) : userPosts.length > 0 ? (
              <div className="posts-selection">
                {userPosts.map(renderPostOption)}
                {formData.linkedPostIds.length > 0 && (
                  <div className="selection-summary">
                    {formData.linkedPostIds.length} post{formData.linkedPostIds.length > 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            ) : (
              <div className="no-posts-message">
                You don't have any posts yet. Create some posts first to link them to your artworks.
              </div>
            )}
          </div>

          {/* Sales Options */}
          <div className="form-section">
            <h3>Sales Options</h3>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="forSale"
                  checked={formData.forSale}
                  onChange={handleInputChange}
                />
                <span>Available for sale</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button" 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Artwork'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;