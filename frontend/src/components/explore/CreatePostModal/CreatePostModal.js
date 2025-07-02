// frontend/src/components/explore/CreatePostModal/CreatePostModal.js - FIXED with artwork linking
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { postAPI } from '../../../services/api';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [formData, setFormData] = useState({
    caption: '',
    tags: '',
    linkedShopItems: [] // UPDATED: Changed from single to multiple
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userArtworks, setUserArtworks] = useState([]);
  const [loadingArtworks, setLoadingArtworks] = useState(false);

  // Get current user info
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
  const isArtist = currentUser?.isArtist;

  // Fetch user's artworks for linking (only for artists)
  useEffect(() => {
    if (isOpen && isArtist) {
      fetchUserArtworks();
    }
  }, [isOpen, isArtist]);

  const fetchUserArtworks = async () => {
    setLoadingArtworks(true);
    try {
      console.log('Fetching user artworks for linking...');
      const response = await postAPI.getUserArtworks();
      console.log('User artworks response:', response.data);
      
      if (response.data.success) {
        setUserArtworks(response.data.artworks);
        console.log('User artworks loaded for linking:', response.data.artworks.length);
      } else {
        console.error('Failed to fetch artworks:', response.data.message);
        setUserArtworks([]);
      }
    } catch (error) {
      console.error('Error fetching user artworks:', error);
      console.error('Error response:', error.response?.data);
      setUserArtworks([]);
    } finally {
      setLoadingArtworks(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setPreviews([]);
      setFormData({
        caption: '',
        tags: '',
        linkedShopItems: []
      });
      setError('');
      setUserArtworks([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    console.log('Files selected:', selectedFiles.length);

    if (selectedFiles.length === 0) return;

    // Validate files
    const validFiles = selectedFiles.filter(file => {
      const isValidImage = file.type.startsWith('image/');
      const isValidVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit

      if (!isValidImage && !isValidVideo) {
        setError('Please select only image or video files');
        return false;
      }

      if (!isValidSize) {
        setError('File size must be less than 50MB');
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setFiles(validFiles);
    setError('');

    // Create previews
    createPreviews(validFiles);
  };

  // Create file previews
  const createPreviews = (validFiles) => {
    console.log('Creating previews for', validFiles.length, 'files');
    
    const newPreviews = [];
    let loadedCount = 0;

    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews[index] = {
          url: e.target.result,
          type: file.type.startsWith('video/') ? 'video' : 'image'
        };
        
        loadedCount++;
        if (loadedCount === validFiles.length) {
          setPreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Creating post with data:', formData);
      console.log('Files:', files.length);
      console.log('Linked shop items:', formData.linkedShopItems);

      const submitFormData = new FormData();
      
      // Add files
      files.forEach((file, index) => {
        submitFormData.append('media', file);
      });

      // Add form data
      submitFormData.append('caption', formData.caption);
      submitFormData.append('tags', formData.tags);
      
      // Add linked shop items as JSON string
      if (formData.linkedShopItems.length > 0) {
        submitFormData.append('linkedShopItems', JSON.stringify(formData.linkedShopItems));
      }

      const response = await postAPI.createPost(submitFormData);

      if (response.data.success) {
        console.log('Post created successfully');
        onPostCreated(response.data.post);
        onClose();
      } else {
        throw new Error(response.data.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create post. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // UPDATED: Handle artwork selection (multiple)
  const handleArtworkSelection = (artworkId) => {
    setFormData(prev => ({
      ...prev,
      linkedShopItems: prev.linkedShopItems.includes(artworkId)
        ? prev.linkedShopItems.filter(id => id !== artworkId)
        : [...prev.linkedShopItems, artworkId]
    }));
  };

  // Remove a file from selection
  const removeFile = (index) => {
    console.log('Removing file at index:', index);
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  // UPDATED: Render artwork option for selection
  const renderArtworkOption = (artwork) => {
    const isSelected = formData.linkedShopItems.includes(artwork._id);
    const linkedPostsCount = artwork.linkedPosts?.length || 0;

    return (
      <div 
        key={artwork._id} 
        style={{
          ...artworkOptionStyle,
          backgroundColor: isSelected ? '#f0f2ff' : 'white',
          borderColor: isSelected ? '#667eea' : '#e5e7eb'
        }}
        onClick={() => handleArtworkSelection(artwork._id)}
      >
        <div style={artworkContentStyle}>
          {artwork.images?.[0] && (
            <img 
              src={artwork.images[0]} 
              alt={artwork.title} 
              style={artworkImageStyle}
            />
          )}
          <div style={artworkDetailsStyle}>
            <p style={artworkTitleStyle}>
              {artwork.title}
            </p>
            <p style={artworkPriceStyle}>
              ${artwork.price}
            </p>
            {linkedPostsCount > 0 && (
              <span style={linkedPostsIndicatorStyle}>
                {linkedPostsCount} post{linkedPostsCount > 1 ? 's' : ''} linked
              </span>
            )}
          </div>
        </div>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => handleArtworkSelection(artwork._id)}
          style={checkboxStyle}
        />
      </div>
    );
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2>Create New Post</h2>
          <button style={closeButtonStyle} onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* File Upload Section */}
          <div style={formGroupStyle}>
            <label>Select Media</label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              style={fileInputStyle}
            />
            <div style={hintStyle}>
              Select images or videos (max 50MB each)
            </div>
          </div>

          {/* File Previews */}
          {previews.length > 0 && (
            <div style={previewSectionStyle}>
              <h4>Preview ({previews.length} file{previews.length > 1 ? 's' : ''})</h4>
              <div style={previewGridStyle}>
                {previews.map((preview, index) => (
                  <div key={index} style={previewItemStyle}>
                    {preview.type === 'video' ? (
                      <video src={preview.url} controls style={previewMediaStyle} />
                    ) : (
                      <img src={preview.url} alt={`Preview ${index + 1}`} style={previewMediaStyle} />
                    )}
                    <button
                      type="button"
                      style={removeButtonStyle}
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caption */}
          <div style={formGroupStyle}>
            <label htmlFor="caption">Caption</label>
            <textarea
              id="caption"
              name="caption"
              value={formData.caption}
              onChange={handleInputChange}
              placeholder="Write a caption for your post..."
              rows="3"
              style={textareaStyle}
            />
          </div>

          {/* Tags */}
          <div style={formGroupStyle}>
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="Enter tags separated by commas (e.g., art, painting, portrait)"
              style={inputStyle}
            />
          </div>

          {/* FIXED: Link to Multiple Artworks (only for artists) */}
          {isArtist && (
            <div style={formGroupStyle}>
              <label>Link to Your Artworks (Optional)</label>
              <p style={hintStyle}>
                Select artworks to link to this post. Viewers will see buttons to view these products.
              </p>
              
              {loadingArtworks ? (
                <div style={loadingStyle}>Loading your artworks...</div>
              ) : userArtworks.length > 0 ? (
                <div style={artworksSelectionStyle}>
                  {userArtworks.map(renderArtworkOption)}
                  {formData.linkedShopItems.length > 0 && (
                    <div style={selectionSummaryStyle}>
                      {formData.linkedShopItems.length} artwork{formData.linkedShopItems.length > 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>
              ) : (
                <div style={noArtworksStyle}>
                  You don't have any artworks for sale. Create some artworks first to link them to your posts.
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div style={actionsStyle}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={cancelButtonStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || files.length === 0}
              style={{
                ...submitButtonStyle,
                opacity: loading || files.length === 0 ? 0.6 : 1
              }}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Inline styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)'
};

const modalContentStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.5rem',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: '#6b7280',
  padding: '0.25rem'
};

const errorStyle = {
  backgroundColor: '#fef2f2',
  color: '#dc2626',
  padding: '1rem',
  margin: '1rem 1.5rem',
  borderRadius: '6px',
  border: '1px solid #fecaca'
};

const formGroupStyle = {
  margin: '1rem 1.5rem'
};

const fileInputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '2px dashed #d1d5db',
  borderRadius: '8px',
  backgroundColor: '#f9fafb',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease'
};

const textareaStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  resize: 'vertical',
  fontFamily: 'inherit'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontFamily: 'inherit'
};

const hintStyle = {
  fontSize: '0.875rem',
  color: '#6b7280',
  marginTop: '0.25rem'
};

const loadingStyle = {
  textAlign: 'center',
  padding: '2rem',
  color: '#6b7280',
  fontStyle: 'italic'
};

const previewSectionStyle = {
  margin: '1rem 1.5rem'
};

const previewGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: '1rem',
  marginTop: '1rem'
};

const previewItemStyle = {
  position: 'relative',
  borderRadius: '8px',
  overflow: 'hidden',
  border: '2px solid #e5e7eb'
};

const previewMediaStyle = {
  width: '100%',
  height: '120px',
  objectFit: 'cover',
  display: 'block'
};

const removeButtonStyle = {
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  background: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  padding: '0.25rem 0.5rem',
  cursor: 'pointer',
  fontSize: '0.8rem'
};

// Artwork selection styles
const artworksSelectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  maxHeight: '300px',
  overflowY: 'auto',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '1rem'
};

const artworkOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem',
  border: '2px solid',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const artworkContentStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flex: 1
};

const artworkImageStyle = {
  width: '50px',
  height: '50px',
  objectFit: 'cover',
  borderRadius: '4px',
  border: '1px solid #e5e7eb'
};

const artworkDetailsStyle = {
  flex: 1
};

const artworkTitleStyle = {
  margin: '0 0 0.25rem 0',
  fontWeight: '500',
  color: '#374151'
};

const artworkPriceStyle = {
  margin: '0 0 0.25rem 0',
  color: '#059669',
  fontWeight: '600'
};

const linkedPostsIndicatorStyle = {
  fontSize: '0.8rem',
  color: '#6b7280',
  fontStyle: 'italic'
};

const checkboxStyle = {
  width: '16px',
  height: '16px',
  margin: '0'
};

const selectionSummaryStyle = {
  textAlign: 'center',
  padding: '0.75rem',
  backgroundColor: 'rgba(102, 126, 234, 0.1)',
  border: '1px solid rgba(102, 126, 234, 0.2)',
  borderRadius: '6px',
  color: '#667eea',
  fontWeight: '500',
  fontSize: '0.9rem'
};

const noArtworksStyle = {
  textAlign: 'center',
  padding: '2rem',
  color: '#6b7280',
  fontStyle: 'italic',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px'
};

const actionsStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end',
  padding: '1.5rem',
  borderTop: '1px solid #e5e7eb'
};

const cancelButtonStyle = {
  padding: '0.75rem 1.5rem',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  background: 'white',
  cursor: 'pointer'
};

const submitButtonStyle = {
  padding: '0.75rem 1.5rem',
  borderRadius: '6px',
  border: 'none',
  background: '#667eea',
  color: 'white',
  cursor: 'pointer'
};

export default CreatePostModal;