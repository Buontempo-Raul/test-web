// frontend/src/components/explore/CreatePostModal/CreatePostModal.js
import React, { useState } from 'react';
import api from '../../../services/api';
import './CreatePostModal.css';

const CreatePostModal = ({ onClose, onPostCreated }) => {
  const [formData, setFormData] = useState({
    caption: '',
    tags: '',
    contentType: 'image'
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file count
    if (selectedFiles.length > 10) {
      setError('You can upload a maximum of 10 files');
      return;
    }

    // Validate file types and sizes
    const validFiles = selectedFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for videos, 10MB for images
      
      if (!isImage && !isVideo) {
        setError('Only image and video files are allowed');
        return false;
      }
      
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Max size: ${isVideo ? '50MB' : '10MB'}`);
        return false;
      }
      
      return true;
    });

    setFiles(validFiles);
    setError('');

    // Determine content type
    if (validFiles.length === 1) {
      setFormData(prev => ({
        ...prev,
        contentType: validFiles[0].type.startsWith('video/') ? 'video' : 'image'
      }));
    } else if (validFiles.length > 1) {
      setFormData(prev => ({
        ...prev,
        contentType: 'carousel'
      }));
    }

    // Create previews
    const newPreviews = [];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({
          url: reader.result,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          name: file.name
        });
        if (newPreviews.length === validFiles.length) {
          setPreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add files
      files.forEach(file => {
        formDataToSend.append('media', file);
      });

      // Add other form data
      formDataToSend.append('caption', formData.caption);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('contentType', formData.contentType);

      const response = await api.post('/api/posts', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        onPostCreated(response.data.post);
      } else {
        setError(response.data.message || 'Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.response?.data?.message || 'Failed to create post. Please try again.');
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
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setFiles(newFiles);
    setPreviews(newPreviews);

    // Update content type if needed
    if (newFiles.length === 1) {
      setFormData(prev => ({
        ...prev,
        contentType: newFiles[0].type.startsWith('video/') ? 'video' : 'image'
      }));
    } else if (newFiles.length === 0) {
      setFormData(prev => ({
        ...prev,
        contentType: 'image'
      }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Post</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* File Upload Section */}
          <div className="form-group">
            <label htmlFor="media">Upload Images or Videos</label>
            <input
              type="file"
              id="media"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              disabled={loading}
            />
            <p className="file-info">
              Max 10 files. Images: 10MB max, Videos: 50MB max
            </p>
          </div>

          {/* Preview Section */}
          {previews.length > 0 && (
            <div className="preview-section">
              <h3>Preview</h3>
              <div className="preview-grid">
                {previews.map((preview, index) => (
                  <div key={index} className="preview-item">
                    {preview.type === 'image' ? (
                      <img src={preview.url} alt={`Preview ${index + 1}`} />
                    ) : (
                      <video controls>
                        <source src={preview.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                    <button
                      type="button"
                      className="remove-preview"
                      onClick={() => removeFile(index)}
                      disabled={loading}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caption */}
          <div className="form-group">
            <label htmlFor="caption">Caption</label>
            <textarea
              id="caption"
              name="caption"
              value={formData.caption}
              onChange={handleInputChange}
              placeholder="Write a caption..."
              rows="3"
              disabled={loading}
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="art, photography, design..."
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="modal-footer">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading || files.length === 0}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;