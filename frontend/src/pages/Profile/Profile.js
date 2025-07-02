// src/pages/Profile/Profile.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Profile.css';
import { useAuth } from '../../hooks/useAuth';
import { userAPI, postAPI } from '../../services/api';
import PostCard from '../../components/explore/PostCard/PostCard';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [posts, setPosts] = useState([]); // Add posts state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Posts'); // Change default tab to Posts
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
  const { currentUser, isAdmin, isAuthenticated } = useAuth();
  
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
        const response = await userAPI.getUserByUsername(username);
        
        if (response.data.success) {
          const userData = response.data.user;
          setUser(userData);
          
          // Update edit form data
          setEditFormData({
            username: userData.username,
            bio: userData.bio || '',
            website: userData.website || '',
            profileImage: userData.profileImage || ''
          });

          // Fetch user's posts
          try {
            const postsResponse = await postAPI.getUserPosts(userData._id);
            if (postsResponse.data.success) {
              setPosts(postsResponse.data.posts);
            }
          } catch (postsError) {
            console.error('Error fetching posts:', postsError);
            setPosts([]); // Set empty array if posts fetch fails
          }

          // If user is an artist, also fetch their artworks
          if (userData.isArtist) {
            try {
              // Fetch artworks using username (API expects username, not ID)
              const artworksResponse = await userAPI.getUserArtworks(username);
              if (artworksResponse.data.success) {
                setArtworks(artworksResponse.data.artworks);
              }
            } catch (artworkError) {
              console.error('Error fetching artworks:', artworkError);
              setArtworks([]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await userAPI.uploadProfileImage(formData);
      
      if (response.data.success) {
        setEditFormData(prev => ({
          ...prev,
          profileImage: response.data.imageUrl
        }));
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle form submission for profile edit
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    
    try {
      const response = await userAPI.updateProfile(editFormData);
      
      if (response.data.success) {
        setUser(response.data.user);
        setShowEditModal(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Update error:', error);
      setUploadError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format date function
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle post updates (for likes, comments, etc.)
  const handlePostUpdated = (updatedPost) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    );
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
        <h2>Profile Not Found</h2>
        <p>{error}</p>
        <Link to="/" className="profile-home-link">
          Go Home
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-error-container">
        <h2>User Not Found</h2>
        <p>The profile you're looking for doesn't exist.</p>
        <Link to="/" className="profile-home-link">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <motion.div 
        className="profile-header"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="profile-avatar-container">
          <img 
            src={user.profileImage || 'https://via.placeholder.com/180x180'} 
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
              <svg className="profile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Joined {formatDate(user.createdAt)}
            </span>
            
            {user.website && (
              <a 
                href={user.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="profile-website"
              >
                <svg className="profile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
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
          {/* Add Posts tab */}
          <button 
            className={`profile-tab ${activeTab === 'Posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('Posts')}
          >
            <span className="profile-tab-icon posts-icon"></span>
            Posts
            <span className="profile-tab-count">{posts.length}</span>
          </button>
          
          {user.isArtist && (
            <button 
              className={`profile-tab ${activeTab === 'Artworks' ? 'active' : ''}`}
              onClick={() => setActiveTab('Artworks')}
            >
              <span className="profile-tab-icon artworks-icon"></span>
              Artworks
              <span className="profile-tab-count">{artworks.length}</span>
            </button>
          )}
          
        </motion.div>
        
        <motion.div 
          className="profile-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          {/* Posts Tab Content */}
          {activeTab === 'Posts' && (
            <div className="profile-tab-content">
              {posts.length > 0 ? (
                <div className="profile-posts-feed">
                  {posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      currentUser={currentUser}
                      isAuthenticated={isAuthenticated}
                      onPostUpdated={handlePostUpdated}
                    />
                  ))}
                </div>
              ) : (
                <div className="profile-empty-state">
                  <div className="profile-empty-icon posts-empty-icon"></div>
                  <h3>No Posts Yet</h3>
                  <p>
                    {isOwnProfile 
                      ? "You haven't shared any posts yet. Start sharing your creative journey!" 
                      : "This user hasn't shared any posts yet."
                    }
                  </p>
                  
                  {isOwnProfile && (
                    <Link to="/explore" className="profile-create-button">
                      Create Your First Post
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Artworks Tab Content */}
          {activeTab === 'Artworks' && user.isArtist && (
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
          
          {/* Favorites Tab Content */}
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
          
          {/* Orders Tab Content */}
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
                    src={editFormData.profileImage || 'https://via.placeholder.com/150x150'} 
                    alt={editFormData.username} 
                    className="profile-preview-image"
                  />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <div className="upload-status uploading">Uploading...</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={editFormData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={editFormData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="website"
                  value={editFormData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              {uploadError && (
                <div className="upload-status error">{uploadError}</div>
              )}

              {uploadSuccess && (
                <div className="upload-status success">Profile updated successfully!</div>
              )}

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