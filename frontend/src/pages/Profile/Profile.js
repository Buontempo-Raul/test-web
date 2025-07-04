// src/pages/Profile/Profile.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Profile.css';
import { useAuth } from '../../hooks/useAuth';
import { userAPI, postAPI } from '../../services/api';
import PostCard from '../../components/explore/PostCard/PostCard';
import FollowersModal from '../../components/profile/FollowersModal/FollowersModal';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Posts');
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Add state for follow functionality
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  // Add state for followers/following modal
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState('followers'); // 'followers' or 'following'
  
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

  // Function to check if current user is following this profile user
  const checkFollowStatus = async (profileUserId) => {
    if (!currentUser || isOwnProfile) return;
    
    try {
      const response = await userAPI.getFollowing();
      if (response.data.success) {
        const isFollowingUser = response.data.following.some(
          followedUser => followedUser._id === profileUserId
        );
        setIsFollowing(isFollowingUser);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  // Function to handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!currentUser || isOwnProfile) return;
    
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await userAPI.unfollowUser(user._id);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await userAPI.followUser(user._id);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setError('Failed to update follow status. Please try again.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Function to handle opening followers/following modal
  const handleFollowersClick = (type) => {
    setFollowersModalType(type);
    setShowFollowersModal(true);
  };

  // Function to close the modal
  const handleCloseFollowersModal = () => {
    setShowFollowersModal(false);
  };

  useEffect(() => {
    // Function to fetch user profile
    const fetchUserProfile = async () => {
      setLoading(true);
      setError('');
      
      try {
        console.log('Fetching profile for username:', username);
        const response = await userAPI.getUserByUsername(username);
        
        if (response.data.success) {
          const userData = response.data.user;
          setUser(userData);
          
          // Set follower/following counts
          setFollowersCount(userData.followers?.length || 0);
          setFollowingCount(userData.following?.length || 0);
          
          // Set edit form data if it's own profile
          if (isOwnProfile) {
            setEditFormData({
              username: userData.username || '',
              bio: userData.bio || '',
              website: userData.website || '',
              profileImage: userData.profileImage || ''
            });
          }
          
          // Check follow status if viewing someone else's profile
          if (currentUser && !isOwnProfile) {
            await checkFollowStatus(userData._id);
          }
        } else {
          setError(response.data.message || 'Failed to load profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        if (error.response?.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    // Function to fetch user's posts
    const fetchUserPosts = async () => {
      try {
        const response = await postAPI.getPosts({ creator: username, limit: 50 });
        if (response.data.success) {
          setPosts(response.data.posts);
        }
      } catch (error) {
        console.error('Error fetching user posts:', error);
      }
    };

    // Function to fetch user's artworks (if artist)
    const fetchUserArtworks = async () => {
      try {
        const response = await userAPI.getUserArtworks(username);
        if (response.data.success) {
          setArtworks(response.data.artworks);
        }
      } catch (error) {
        console.error('Error fetching user artworks:', error);
      }
    };

    if (username) {
      fetchUserProfile();
      fetchUserPosts();
      fetchUserArtworks();
    }
  }, [username, currentUser, isOwnProfile]);

  // Handle profile image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await userAPI.uploadProfileImage(formData);
      
      if (response.data.success) {
        setEditFormData(prev => ({
          ...prev,
          profileImage: response.data.profileImage
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

  // Handle form input changes
  const handleInputChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setUploadError(null);

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

  // Format date helper
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

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
          
          {/* Add follower/following stats */}
          <motion.div 
            className="profile-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="profile-stat">
              <span className="profile-stat-number">{posts.length}</span>
              <span className="profile-stat-label">Posts</span>
            </div>
            <div 
              className="profile-stat clickable"
              onClick={() => handleFollowersClick('followers')}
              title="View followers"
            >
              <span className="profile-stat-number">{followersCount}</span>
              <span className="profile-stat-label">Followers</span>
            </div>
            <div 
              className="profile-stat clickable"
              onClick={() => handleFollowersClick('following')}
              title="View following"
            >
              <span className="profile-stat-number">{followingCount}</span>
              <span className="profile-stat-label">Following</span>
            </div>
            {user.isArtist && (
              <div className="profile-stat">
                <span className="profile-stat-number">{artworks.length}</span>
                <span className="profile-stat-label">Artworks</span>
              </div>
            )}
          </motion.div>
          
          <motion.div 
            className="profile-meta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
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
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {user.bio || 'No bio provided yet.'}
          </motion.p>
          
          {/* Add follow button or edit profile button */}
          <motion.div
            className="profile-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {isOwnProfile ? (
              <button 
                className="profile-edit-button"
                onClick={() => setShowEditModal(true)}
              >
                Edit Profile
              </button>
            ) : isAuthenticated ? (
              <button 
                className={`profile-follow-button ${isFollowing ? 'following' : ''}`}
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                  <span className="loading-spinner-small"></span>
                ) : isFollowing ? (
                  'Following'
                ) : (
                  'Follow'
                )}
              </button>
            ) : (
              <Link to="/login" className="profile-follow-button">
                Follow
              </Link>
            )}
          </motion.div>
        </div>
      </motion.div>
      
      <div className="profile-content-container">
        <motion.div 
          className="profile-tabs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
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
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {activeTab === 'Posts' && (
            <div className="profile-posts-feed">
              {posts.length > 0 ? (
                posts.map(post => (
                  <PostCard 
                    key={post._id} 
                    post={post} 
                    onUpdate={handlePostUpdated}
                  />
                ))
              ) : (
                <div className="profile-empty-state">
                  <p>No posts yet</p>
                  {isOwnProfile && (
                    <Link to="/create-post" className="create-post-link">
                      Create your first post
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'Artworks' && user.isArtist && (
            <div className="profile-artworks-grid">
              {artworks.length > 0 ? (
                artworks.map(artwork => (
                  <div key={artwork._id} className="artwork-card">
                    <img 
                      src={artwork.images[0]} 
                      alt={artwork.title}
                      className="artwork-image"
                    />
                    <div className="artwork-info">
                      <h3>{artwork.title}</h3>
                      <p className="artwork-price">${artwork.price}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="profile-empty-state">
                  <p>No artworks available</p>
                  {isOwnProfile && (
                    <Link to="/artist/create" className="create-artwork-link">
                      Create your first artwork
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label>Profile Image</label>
                <div className="image-upload-container">
                  <div className="current-image">
                    <img 
                      src={editFormData.profileImage || 'https://via.placeholder.com/100x100'} 
                      alt="Profile" 
                      className="edit-profile-image"
                    />
                  </div>
                  <input
                    type="file"
                    id="profileImageInput"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="upload-image-btn"
                    onClick={() => document.getElementById('profileImageInput').click()}
                    disabled={uploadingImage}
                  >
                    Change Image
                  </button>
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
      
      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={handleCloseFollowersModal}
        type={followersModalType}
        targetUser={user}
      />
    </div>
  );
};

export default Profile;