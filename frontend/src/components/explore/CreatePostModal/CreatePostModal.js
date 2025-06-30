// frontend/src/components/explore/CreatePostModal/CreatePostModal.js
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { postAPI } from '../../../services/api';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [formData, setFormData] = useState({
    caption: '',
    tags: '',
    linkedShopItem: '' // For linking to artwork
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
      console.log('Fetching user artworks...');
      const response = await postAPI.getUserArtworks();
      console.log('User artworks response:', response.data);
      
      if (response.data.success) {
        setUserArtworks(response.data.artworks);
        console.log('User artworks loaded:', response.data.artworks.length);
      } else {
        console.error('Failed to fetch artworks:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching user artworks:', error);
      console.error('Error response:', error.response?.data);
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
        linkedShopItem: ''
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
          type: file.type.startsWith('video/') ? 'video' : 'image',
          name: file.name
        };
        loadedCount++;
        
        if (loadedCount === validFiles.length) {
          setPreviews(newPreviews);
          console.log('Previews created:', newPreviews.length);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Form submission started');
    console.log('Files:', files.length);
    console.log('Form data:', formData);

    // Validate files
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add files to FormData
      files.forEach((file, index) => {
        console.log(`Adding file ${index}:`, file.name, file.type);
        formDataToSend.append('media', file);
      });

      // Add other form data
      formDataToSend.append('caption', formData.caption);
      formDataToSend.append('tags', formData.tags);
      
      // Add linked shop item if selected
      if (formData.linkedShopItem) {
        formDataToSend.append('linkedShopItem', formData.linkedShopItem);
      }

      console.log('Sending request to create post...');

      const response = await api.post('/api/posts', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Post creation response:', response.data);

      if (response.data.success) {
        console.log('Post created successfully');
        onPostCreated(response.data.post);
        onClose();
      } else {
        throw new Error(response.data.message || 'Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create post. Please try again.';
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

  // Remove a file from selection
  const removeFile = (index) => {
    console.log('Removing file at index:', index);
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
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

          {/* Link to Artwork (only for artists) */}
          {isArtist && (
            <div style={formGroupStyle}>
              <label htmlFor="linkedShopItem">Link to Your Artwork (Optional)</label>
              {loadingArtworks ? (
                <div>Loading your artworks...</div>
              ) : (
                <select
                  id="linkedShopItem"
                  name="linkedShopItem"
                  value={formData.linkedShopItem}
                  onChange={handleInputChange}
                  style={selectStyle}
                >
                  <option value="">No artwork linked</option>
                  {userArtworks.map(artwork => (
                    <option key={artwork._id} value={artwork._id}>
                      {artwork.title} - ${artwork.price}
                      {artwork.linkedPosts?.length > 0 && ` (${artwork.linkedPosts.length} post${artwork.linkedPosts.length > 1 ? 's' : ''})`}
                    </option>
                  ))}
                </select>
              )}
              <div style={hintStyle}>
                Link this post to one of your artworks so users can easily find and purchase it
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div style={actionsStyle}>
            <button type="button" onClick={onClose} style={cancelButtonStyle}>
              Cancel
            </button>
            <button 
              type="submit" 
              style={{...submitButtonStyle, opacity: loading || files.length === 0 ? 0.6 : 1}}
              disabled={loading || files.length === 0}
            >
              {loading ? 'Creating Post...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Inline styles for compatibility
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '0'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.5rem',
  borderBottom: '1px solid #e5e7eb'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer'
};

const errorStyle = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#dc2626',
  padding: '1rem',
  margin: '1rem 1.5rem',
  borderRadius: '8px'
};

const formGroupStyle = {
  marginBottom: '1rem',
  padding: '0 1.5rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '0.9rem'
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '80px'
};

const selectStyle = {
  ...inputStyle
};

const fileInputStyle = {
  ...inputStyle,
  padding: '0.5rem'
};

const hintStyle = {
  fontSize: '0.8rem',
  color: '#6b7280',
  marginTop: '0.25rem'
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