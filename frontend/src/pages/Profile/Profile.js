// src/pages/Profile/Profile.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Profile.css';
import { useAuth } from '../../hooks/useAuth';

// Temporary user data - Replace with API calls when ready
const tempUser = {
  _id: '1',
  username: 'artistic_soul',
  profileImage: 'https://via.placeholder.com/150x150',
  bio: 'Contemporary artist specializing in abstract expressionism. Exploring the boundaries between form and emotion through vibrant colors and dynamic compositions.',
  website: 'https://example.com',
  isArtist: true,
  createdAt: '2023-01-15T00:00:00.000Z'
};

// Temporary artwork data - Replace with API calls when ready
const tempArtworks = [
  {
    _id: '1',
    title: 'Abstract Harmony',
    description: 'A vibrant exploration of color and form.',
    images: ['https://via.placeholder.com/400x300?text=Abstract+Harmony'],
    price: 299.99,
    category: 'painting',
    forSale: true,
    createdAt: '2023-05-10T00:00:00.000Z'
  },
  {
    _id: '5',
    title: 'Emotional Expressions',
    description: 'A portrait series capturing human emotions.',
    images: ['https://via.placeholder.com/400x300?text=Emotional+Expressions'],
    price: 399.99,
    category: 'painting',
    forSale: true,
    createdAt: '2023-07-22T00:00:00.000Z'
  },
  {
    _id: '7',
    title: 'Cosmic Journey',
    description: 'Abstract representation of space and cosmos.',
    images: ['https://via.placeholder.com/400x300?text=Cosmic+Journey'],
    price: 449.99,
    category: 'painting',
    forSale: true,
    createdAt: '2023-09-05T00:00:00.000Z'
  },
  {
    _id: '9',
    title: 'Urban Symphony',
    description: 'A colorful interpretation of city life and movement.',
    images: ['https://via.placeholder.com/400x300?text=Urban+Symphony'],
    price: 329.99,
    category: 'painting',
    forSale: false,
    createdAt: '2023-11-18T00:00:00.000Z'
  }
];

const Profile = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Artworks');
  
  // Add state for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    username: '',
    bio: '',
    website: '',
    profileImage: ''
  });
  
  // Use auth hook
  const { currentUser } = useAuth();
  
  // Check if the profile belongs to the current user
  const isOwnProfile = currentUser && (currentUser.username === username);

  useEffect(() => {
    // Function to fetch user profile
    const fetchUserProfile = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Uncomment when ready to use API
        // const userResponse = await userAPI.getUserByUsername(username);
        // const artworksResponse = await userAPI.getUserArtworks(username);
        
        // if (userResponse.data.success && artworksResponse.data.success) {
        //   setUser(userResponse.data.user);
        //   setArtworks(artworksResponse.data.artworks);
        //   
        //   // Set initial form data for editing
        //   if (isOwnProfile) {
        //     setEditFormData({
        //       username: userResponse.data.user.username,
        //       bio: userResponse.data.user.bio || '',
        //       website: userResponse.data.user.website || '',
        //       profileImage: userResponse.data.user.profileImage || ''
        //     });
        //   }
        // } else {
        //   setError('Failed to load profile');
        // }

        // Temporary - using mock data
        setTimeout(() => {
          setUser(tempUser);
          setArtworks(tempArtworks);
          
          // Set initial form data for editing
          setEditFormData({
            username: tempUser.username,
            bio: tempUser.bio || '',
            website: tempUser.website || '',
            profileImage: tempUser.profileImage || ''
          });
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('User not found');
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

  // Handle profile image change
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you'd upload this file to your server and get a URL back
      // For now, we'll create a local URL for preview purposes
      const imageUrl = URL.createObjectURL(file);
      setEditFormData({
        ...editFormData,
        profileImage: imageUrl
      });
    }
  };

  // Handle form submission
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    try {
      // In a real app, you'd make an API call to update the profile
      // const response = await userAPI.updateProfile(editFormData);
      
      // Simulate successful update for now
      console.log('Updating profile with:', editFormData);
      
      // Update local user state with the edited data
      setUser({
        ...user,
        username: editFormData.username,
        bio: editFormData.bio,
        website: editFormData.website,
        profileImage: editFormData.profileImage
      });
      
      // Close the modal
      setShowEditModal(false);
      
      // Show a success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
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
            src={user.profileImage} 
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
            {user.bio}
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
                      <Link to={`/artwork/${artwork._id}`} className="profile-artwork-image-link">
                        <div className="profile-artwork-image-container">
                          <img 
                            src={artwork.images[0]} 
                            alt={artwork.title} 
                            className="profile-artwork-image"
                          />
                          <div className="profile-artwork-category">
                            {artwork.category}
                          </div>
                        </div>
                      </Link>
                      
                      <div className="profile-artwork-details">
                        <Link to={`/artwork/${artwork._id}`} className="profile-artwork-title-link">
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
                        
                        <Link to={`/artwork/${artwork._id}`} className="profile-artwork-view-button">
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
                    <Link to="/artwork/create" className="profile-create-button">
                      Create Your First Artwork
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
                    src={editFormData.profileImage} 
                    alt="Profile Preview" 
                    className="profile-image-preview" 
                  />
                  <input 
                    type="file" 
                    id="profile-image-input"
                    accept="image/*" 
                    onChange={handleProfileImageChange}
                    className="profile-image-input"
                  />
                  <button 
                    type="button" 
                    className="change-image-btn"
                    onClick={handleImageInputClick}
                  >
                    Choose Image
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
                  onChange={handleEditFormChange}
                  required
                />
                <small>Note: Username changes may not be allowed if already taken.</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={editFormData.bio}
                  onChange={handleEditFormChange}
                  rows="4"
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
                <button type="submit" className="save-profile-btn">Save Changes</button>
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