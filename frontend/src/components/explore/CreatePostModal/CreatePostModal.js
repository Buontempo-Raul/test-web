// src/components/explore/CreatePostModal/CreatePostModal.js
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import './CreatePostModal.css';

const CreatePostModal = ({ onClose, onSubmit, currentUser }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [contentType, setContentType] = useState('image');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [shopItem, setShopItem] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Mock shop items that would come from the user's shop in a real app
  const userShopItems = [
    { id: '101', name: 'Abstract Harmony', price: 299.99 },
    { id: '102', name: 'Nature\'s Embrace - Bronze Sculpture', price: 1250.00 },
    { id: '103', name: 'Digital Dreams - Limited Print', price: 49.99 }
  ];

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Reset error if there was one
      setError('');
      
      // Check file types
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const allowedVideoTypes = ['video/mp4', 'video/quicktime'];
      
      const files = Array.from(e.target.files);
      let validFiles = [];
      
      // Validate files based on content type
      if (contentType === 'image') {
        validFiles = files.filter(file => allowedImageTypes.includes(file.type));
        if (validFiles.length !== files.length) {
          setError('Please select only image files (JPEG, PNG, GIF)');
        }
      } else if (contentType === 'video') {
        validFiles = files.filter(file => allowedVideoTypes.includes(file.type));
        if (validFiles.length !== files.length) {
          setError('Please select only video files (MP4, QuickTime)');
        }
        // For video, only allow one file
        if (validFiles.length > 1) {
          validFiles = [validFiles[0]];
        }
      }
      
      // Generate preview URLs
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      
      setSelectedFiles(validFiles);
      setPreviewUrls(newPreviewUrls);
      
      // If files are valid, proceed to next step
      if (validFiles.length > 0) {
        setActiveStep(2);
      }
    }
  };

  // Handle content type change
  const handleContentTypeChange = (type) => {
    setContentType(type);
    
    // Clear selected files if changing type
    if (selectedFiles.length > 0) {
      // Revoke object URLs to avoid memory leaks
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
    }
  };

  // Handle caption change
  const handleCaptionChange = (e) => {
    setCaption(e.target.value);
  };

  // Handle tags change
  const handleTagsChange = (e) => {
    setTags(e.target.value);
  };

  // Handle shop item change
  const handleShopItemChange = (e) => {
    setShopItem(e.target.value);
  };

  // Drag and drop functionality
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileInput = document.getElementById('file-input');
      fileInput.files = e.dataTransfer.files;
      
      // Trigger the onChange event manually
      const event = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(event);
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, upload files to server and get URLs
      // const formData = new FormData();
      // selectedFiles.forEach(file => {
      //   formData.append('files', file);
      // });
      
      // const response = await fetch('/api/upload', {
      //   method: 'POST',
      //   body: formData
      // });
      
      // const data = await response.json();
      // const uploadedUrls = data.urls;
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use local preview URLs for demo
      const uploadedUrls = previewUrls;
      
      // Prepare post data
      let content;
      if (contentType === 'image') {
        if (uploadedUrls.length === 1) {
          content = {
            type: 'image',
            url: uploadedUrls[0],
            aspectRatio: '1:1' // In a real app, calculate this
          };
        } else {
          content = {
            type: 'carousel',
            items: uploadedUrls.map(url => ({
              type: 'image',
              url
            }))
          };
        }
      } else if (contentType === 'video') {
        content = {
          type: 'video',
          url: uploadedUrls[0],
          thumbnailUrl: uploadedUrls[0], // In a real app, generate a thumbnail
          aspectRatio: '16:9' // In a real app, calculate this
        };
      }
      
      // Parse tags
      const parsedTags = tags.split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag);
      
      // Get linked shop item if selected
      const linkedShopItem = shopItem 
        ? userShopItems.find(item => item.id === shopItem) 
        : null;
      
      // Prepare post data
      const postData = {
        content,
        caption,
        tags: parsedTags,
        linkedShopItem
      };
      
      onSubmit(postData);
    } catch (error) {
      console.error('Error creating post:', error);
      setError('An error occurred while creating your post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="create-post-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="modal-header">
          <h2>Create New Post</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        
        <div className="modal-content">
          {activeStep === 1 && (
            <div className="upload-step">
              <div className="content-type-selector">
                <button 
                  className={`type-button ${contentType === 'image' ? 'active' : ''}`}
                  onClick={() => handleContentTypeChange('image')}
                >
                  <i className="image-icon"></i>
                  <span>Image{contentType === 'image' && 's'}</span>
                </button>
                <button 
                  className={`type-button ${contentType === 'video' ? 'active' : ''}`}
                  onClick={() => handleContentTypeChange('video')}
                >
                  <i className="video-icon"></i>
                  <span>Video</span>
                </button>
              </div>
              
              <div 
                className="upload-area"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-input"
                  multiple={contentType === 'image'}
                  accept={contentType === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleFileChange}
                  className="file-input"
                />
                <div className="upload-placeholder">
                  <i className="upload-icon"></i>
                  <p>Drag and drop {contentType === 'image' ? 'images' : 'a video'} here</p>
                  <span>or</span>
                  <label htmlFor="file-input" className="browse-button">
                    Browse
                  </label>
                </div>
              </div>
              
              {error && <div className="upload-error">{error}</div>}
            </div>
          )}
          
          {activeStep === 2 && (
            <form className="details-step" onSubmit={handleSubmit}>
              <div className="preview-section">
                <div className="file-previews">
                  {contentType === 'image' ? (
                    previewUrls.map((url, index) => (
                      <div key={index} className="preview-item">
                        <img src={url} alt={`Preview ${index + 1}`} className="preview-image" />
                      </div>
                    ))
                  ) : (
                    previewUrls.length > 0 && (
                      <div className="preview-item">
                        <video 
                          src={previewUrls[0]} 
                          controls 
                          className="preview-video"
                        />
                      </div>
                    )
                  )}
                </div>
                
                <div className="post-details">
                  <div className="creator-info">
                    <div className="creator-avatar">
                      <img 
                        src={currentUser?.profileImage || 'https://via.placeholder.com/40x40'} 
                        alt={currentUser?.username || 'User'} 
                      />
                    </div>
                    <div className="creator-name">{currentUser?.username || 'User'}</div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="caption">Caption</label>
                    <textarea
                      id="caption"
                      value={caption}
                      onChange={handleCaptionChange}
                      placeholder="Write a caption..."
                      rows="4"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="tags">Tags (comma-separated)</label>
                    <input
                      type="text"
                      id="tags"
                      value={tags}
                      onChange={handleTagsChange}
                      placeholder="art, painting, abstract..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="shop-item">Link to Shop Item (optional)</label>
                    <select
                      id="shop-item"
                      value={shopItem}
                      onChange={handleShopItemChange}
                    >
                      <option value="">None</option>
                      {userShopItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} - ${item.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {error && <div className="upload-error">{error}</div>}
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="back-button"
                      onClick={() => setActiveStep(1)}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="post-button"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Posting...' : 'Share Post'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CreatePostModal;