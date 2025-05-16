// src/pages/Profile/Profile.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Profile.css';
import { useAuth } from '../../hooks/useAuth';
import { userAPI } from '../../services/api';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Artworks');
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Add state for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    username: '',
    bio: '',
    website: '',
    profileImage: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  // Use auth hook
  const { currentUser, isAdmin } = useAuth();
  
  // Redirect admins to dashboard
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [isAdmin, navigate]);
  
  // Check if the profile belongs to the current user
  const isOwnProfile = currentUser && (currentUser.username === username);

  useEffect(() => {
    // Function to fetch user profile
    const fetchUserProfile = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch user data and artworks from API
        const userResponse = await userAPI.getUserByUsername(username);
        const artworksResponse = await userAPI.getUserArtworks(username);
        
        if (userResponse.data.success && artworksResponse.data.success) {
          setUser(userResponse.data.user);
          setArtworks(artworksResponse.data.artworks);
          
          // Set initial form data for editing
          if (isOwnProfile) {
            setEditFormData({
              username: userResponse.data.user.username,
              bio: userResponse.data.user.bio || '',
              website: userResponse.data.user.website || '',
              profileImage: userResponse.data.user.profileImage || ''
            });
          }
        } else {
          setError('Failed to load profile');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('User not found');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, isOwnProfile]);

  // Handle change in edit form fields
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleProfileImageChange = async (e) => {
  const file = e.target.files[0];
  if (!file) {
    return; // Silently return if no file selected
  }
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    // Instead of alert, you could show an error message in the UI
    setUploadError('File size must be less than 5MB');
    return;
  }
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    setUploadError('Please select an image file');
    return;
  }
  
  setUploadingImage(true);
  setUploadError(null); // Clear any previous errors
  
  try {
    // Create FormData object for image upload
    const formData = new FormData();
    formData.append('profileImage', file);
    
    // Upload image to server
    const response = await userAPI.uploadProfileImage(formData);
    
    if (response.data.success) {
      // Update form data with new image URL
      setEditFormData({
        ...editFormData,
        profileImage: response.data.profileImage
      });
      
      // Update user state
      setUser({
        ...user,
        profileImage: response.data.profileImage
      });
      
      // Instead of alert, show success feedback in the UI
      setUploadSuccess(true);
      
      // Automatically hide success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } else {
      setUploadError(response.data.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    setUploadError('Failed to upload image. Please try again.');
  } finally {
    setUploadingImage(false);
  }
};

  // Handle form submission
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    
    try {
      // Make API call to update the profile
      const response = await userAPI.updateProfile({
        bio: editFormData.bio,
        website: editFormData.website
      });
      
      if (response.data.success) {
        // Update local user state with the edited data
        setUser({
          ...user,
          ...response.data.user
        });
        
        // Close the modal
        setShowEditModal(false);
        
        // Show a success message
        alert('Profile updated successfully!');
      } else {
        alert(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleImageInputClick = () => {
    // Trigger click on the hidden file input
    document.getElementById('profile-image-input').click();
  };

  if (loading) {
    return (
      <div className="profile-loading-container">
        <div className="profile-loader"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/" className="profile-home-link">Return to Home</Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-error-container">
        <h2>User Not Found</h2>
        <p>The user you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="profile-home-link">Return to Home</Link>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="profile-container">
      <motion.div 
        className="profile-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="profile-avatar-container">
          <img 
            src={user.profileImage || 'https://via.placeholder.com/150x150'} 
            alt={user.username} 
            className="profile-avatar"
          />
          {user.isArtist && (
            <span className="profile-artist-badge">Artist</span>
          )}
        </div>
        
        <div className="profile-info">
          <motion.h1 
            className="profile-username"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {user.username}
          </motion.h1>
          
          <motion.div 
            className="profile-meta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <span className="profile-joined-date">
              <i className="profile-icon calendar-icon"></i>
              Joined {formatDate(user.createdAt)}
            </span>
            
            {user.website && (
              <a 
                href={user.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="profile-website"
              >
                <i className="profile-icon website-icon"></i>
                {user.website.replace(/(^\w+:|^)\/\//, '')}
              </a>
            )}
          </motion.div>
          
          <motion.p 
            className="profile-bio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {user.bio || 'No bio provided yet.'}
          </motion.p>
          
          {isOwnProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <button 
                className="profile-edit-button"
                onClick={() => setShowEditModal(true)}
              >
                Edit Profile
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <div className="profile-content-container">
        <motion.div 
          className="profile-tabs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <button 
            className={`profile-tab ${activeTab === 'Artworks' ? 'active' : ''}`}
            onClick={() => setActiveTab('Artworks')}
          >
            <span className="profile-tab-icon artworks-icon"></span>
            Artworks
            <span className="profile-tab-count">{artworks.length}</span>
          </button>
          
          <button 
            className={`profile-tab ${activeTab === 'Favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('Favorites')}
          >
            <span className="profile-tab-icon favorites-icon"></span>
            Favorites
          </button>
          
          {isOwnProfile && (
            <button 
              className={`profile-tab ${activeTab === 'Orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('Orders')}
            >
              <span className="profile-tab-icon orders-icon"></span>
              Orders
            </button>
          )}
        </motion.div>
        
        <motion.div 
          className="profile-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          {activeTab === 'Artworks' && (
            <div className="profile-tab-content">
              {artworks.length > 0 ? (
                <div className="profile-artworks-grid">
                  {artworks.map((artwork) => (
                    <motion.div 
                      key={artwork._id} 
                      className="profile-artwork-card"
                      whileHover={{ 
                        y: -10,
                        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)'
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Link to={`/shop/product/${artwork._id}`} className="profile-artwork-image-link">
                        <div className="profile-artwork-image-container">
                          <img 
                            src={artwork.images[0] || 'https://via.placeholder.com/400x300'} 
                            alt={artwork.title} 
                            className="profile-artwork-image"
                          />
                          <div className="profile-artwork-category">
                            {artwork.category}
                          </div>
                        </div>
                      </Link>
                      
                      <div className="profile-artwork-details">
                        <Link to={`/shop/product/${artwork._id}`} className="profile-artwork-title-link">
                          <h3 className="profile-artwork-title">{artwork.title}</h3>
                        </Link>
                        
                        <p className="profile-artwork-description">{artwork.description}</p>
                        
                        <div className="profile-artwork-footer">
                          <span className="profile-artwork-price">
                            ${artwork.price.toFixed(2)}
                          </span>
                          
                          <span className={`profile-artwork-status ${artwork.forSale ? 'for-sale' : 'not-for-sale'}`}>
                            {artwork.forSale ? 'For Sale' : 'Not For Sale'}
                          </span>
                        </div>
                        
                        <Link to={`/shop/product/${artwork._id}`} className="profile-artwork-view-button">
                          View Details
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-state">
                  <div className="profile-empty-icon artworks-empty-icon"></div>
                  <h3>No Artworks Yet</h3>
                  <p>There are no artworks to display at this time.</p>
                  
                  {isOwnProfile && (
                    <Link to="/shop" className="profile-create-button">
                      Add Your First Artwork
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'Favorites' && (
            <div className="profile-tab-content">
              <div className="profile-empty-state">
                <div className="profile-empty-icon favorites-empty-icon"></div>
                <h3>No Favorites Yet</h3>
                <p>When you find artworks you love, you can save them here.</p>
                
                <Link to="/shop" className="profile-browse-button">
                  Browse Artworks
                </Link>
              </div>
            </div>
          )}
          
          {isOwnProfile && activeTab === 'Orders' && (
            <div className="profile-tab-content">
              <div className="profile-empty-state">
                <div className="profile-empty-icon orders-empty-icon"></div>
                <h3>No Orders Yet</h3>
                <p>Your purchase history will appear here once you've made an order.</p>
                
                <Link to="/shop" className="profile-browse-button">
                  Shop Now
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            <button className="close-modal" onClick={() => setShowEditModal(false)}>×</button>
            
            <form onSubmit={handleSubmitEdit} className="edit-profile-form">
              <div className="form-group">
                <label>Profile Picture</label>
                <div className="profile-image-upload">
                  <img 
                    src={user.profileImage || 'https://via.placeholder.com/150x150'} 
                    alt={user.username} 
                    className="profile-avatar"
                  />
                  
                  {uploadingImage && (
                    <div className="upload-status uploading">
                      <span>Uploading...</span>
                    </div>
                  )}
                  
                  {uploadSuccess && (
                    <div className="upload-status success">
                      <span>Profile image updated successfully!</span>
                    </div>
                  )}
                  
                  {uploadError && (
                    <div className="upload-status error">
                      <span>{uploadError}</span>
                    </div>
                  )}
                  
                  <input 
                    type="file" 
                    id="profile-image-input"
                    accept="image/*" 
                    onChange={handleProfileImageChange}
                    className="profile-image-input"
                    disabled={uploadingImage}
                  />
                  <button 
                    type="button" 
                    className="change-image-btn"
                    onClick={() => document.getElementById('profile-image-input').click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? 'Uploading...' : 'Choose Image'}
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={editFormData.username}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <small>Username cannot be changed.</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={editFormData.bio}
                  onChange={handleEditFormChange}
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="website">Website</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={editFormData.website}
                  onChange={handleEditFormChange}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="save-profile-btn"
                  disabled={updatingProfile}
                >
                  {updatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setShowEditModal(false)}
                  disabled={updatingProfile}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;