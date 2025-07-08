// frontend/src/pages/Profile/Profile.js - FIXED with complete profile picture upload
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Profile.css';
import { useAuth } from '../../hooks/useAuth';
import { userAPI, postAPI } from '../../services/api';
import PostCard from '../../components/explore/PostCard/PostCard';
import FollowersModal from '../../components/profile/FollowersModal/FollowersModal';
import UserAvatar from '../../components/common/UserAvatar/UserAvatar';

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
  const [followersModalType, setFollowersModalType] = useState('followers');
  
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

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!currentUser || isOwnProfile) return;
    
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        const response = await userAPI.unfollowUser(user._id);
        if (response.data.success) {
          setIsFollowing(false);
          setFollowersCount(prev => prev - 1);
        }
      } else {
        const response = await userAPI.followUser(user._id);
        if (response.data.success) {
          setIsFollowing(true);
          setFollowersCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Handle followers modal
  const handleShowFollowersModal = (type) => {
    setFollowersModalType(type);
    setShowFollowersModal(true);
  };

  const handleCloseFollowersModal = () => {
    setShowFollowersModal(false);
  };

  // Function to fetch user's posts
  const fetchUserPosts = async (userId) => {
    try {
      const response = await postAPI.getUserPosts(userId);
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  // Handle post interactions
  const handleLike = async (postId) => {
    try {
      const response = await postAPI.likePost(postId);
      if (response.data.success) {
        setPosts(prev => prev.map(post => 
          post._id === postId 
            ? { ...post, ...response.data.post }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId, commentData) => {
    try {
      const response = await postAPI.commentOnPost(postId, commentData);
      if (response.data.success) {
        setPosts(prev => prev.map(post => 
          post._id === postId 
            ? { ...post, comments: response.data.comments }
            : post
        ));
      }
    } catch (error) {
      console.error('Error commenting on post:', error);
    }
  };

  // Load user profile and posts
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await userAPI.getUserByUsername(username);
        
        if (response.data.success) {
          const userData = response.data.user;
          setUser(userData);
          
          // Check follow status
          if (currentUser && !isOwnProfile) {
            const isFollowingUser = userData.followers?.some(follower => 
              typeof follower === 'object' ? 
                follower._id === currentUser._id : follower === currentUser._id
            );
            setIsFollowing(isFollowingUser);
          }
          
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

          // Fetch posts using the user's ID after profile is loaded
          if (userData._id) {
            await fetchUserPosts(userData._id);
          }
          
          // Fetch artworks if user is an artist
          if (userData.isArtist) {
            fetchUserArtworks();
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
        setUser(prev => ({
          ...prev,
          profileImage: response.data.profileImage
        }));
        setEditFormData(prev => ({
          ...prev,
          profileImage: response.data.profileImage
        }));
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    setUpdatingProfile(true);
    
    try {
      // FIXED: Use the correct API method name
      const response = await userAPI.updateProfile(editFormData);
      
      if (response.data.success) {
        setUser(response.data.user);
        setShowEditModal(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setUploadError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle edit form changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Posts':
        return (
          <div className="profile-posts">
            {!posts || posts.length === 0 ? (
              <div className="profile-empty-state">
                <p>{isOwnProfile ? "You haven't posted anything yet" : `${user?.username} hasn't posted anything yet`}</p>
                {isOwnProfile && (
                  <p className="profile-empty-subtitle">
                    <Link to="/explore">Share your first post</Link> to start connecting with the community!
                  </p>
                )}
              </div>
            ) : (
              <div className="profile-posts-feed">
                {posts.map(post => (
                  <PostCard 
                    key={post._id} 
                    post={post} 
                    onLike={handleLike}
                    onComment={handleComment}
                    currentUser={currentUser}
                    showUserInfo={false}
                  />
                ))}
              </div>
            )}
          </div>
        );
        
      case 'Artworks':
        return (
          <div className="profile-artworks">
            {!artworks || artworks.length === 0 ? (
              <div className="profile-empty-state">
                <p>{isOwnProfile ? "You haven't added any artworks yet" : `${user?.username} hasn't added any artworks yet`}</p>
                {isOwnProfile && (
                  <p className="profile-empty-subtitle">
                    <Link to="/shop">Add your first artwork</Link> to start showcasing your work!
                  </p>
                )}
              </div>
            ) : (
              <div className="profile-artworks-grid">
                {artworks.map(artwork => (
                  <Link 
                    key={artwork._id} 
                    to={`/shop/product/${artwork._id}`}  // FIXED: Changed from /shop/artwork/ to /shop/product/
                    className="artwork-card"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="artwork-image">
                      <img 
                        src={artwork.images?.[0] || '/api/placeholder/300/240'} 
                        alt={artwork.title}
                        onError={(e) => {
                          e.target.src = '/api/placeholder/300/240';
                        }}
                      />
                      {artwork.isSold && (
                        <div className="sold-overlay">
                          <span>SOLD</span>
                        </div>
                      )}
                    </div>
                    <div className="artwork-info">
                      <h3>{artwork.title}</h3>
                      <p className="artwork-price">${artwork.price}</p>
                      {artwork.category && (
                        <p className="artwork-category">{artwork.category}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
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
          Go to Home
        </Link>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <motion.div 
        className="profile-header"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="profile-avatar-container">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <UserAvatar 
              user={user} 
              size="large" 
              className="profile-avatar"
            />
          </motion.div>
        </div>
        
        <div className="profile-info">
          <motion.h1 
            className="profile-username"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {user.username}
          </motion.h1>
          
          <motion.div 
            className="profile-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="profile-stat">
              <span className="profile-stat-number">{posts.length}</span>
              <span className="profile-stat-label">Posts</span>
            </div>
            
            <button 
              className="profile-stat profile-stat-button"
              onClick={() => handleShowFollowersModal('followers')}
            >
              <span className="profile-stat-number">{followersCount}</span>
              <span className="profile-stat-label">Followers</span>
            </button>
            
            <button 
              className="profile-stat profile-stat-button"
              onClick={() => handleShowFollowersModal('following')}
            >
              <span className="profile-stat-number">{followingCount}</span>
              <span className="profile-stat-label">Following</span>
            </button>
            
            {user.isArtist && (
              <div className="profile-stat">
                <span className="profile-stat-number">{artworks.length}</span>
                <span className="profile-stat-label">Artworks</span>
              </div>
            )}
          </motion.div>
          
          <motion.div 
            className="profile-details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <span className="profile-join-date">
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
              <Link to="/login" className="profile-login-prompt">
                Log in to follow
              </Link>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Upload success/error messages */}
      {uploadSuccess && (
        <div className="profile-message profile-success">
          Profile updated successfully!
        </div>
      )}
      
      {uploadError && (
        <div className="profile-message profile-error">
          {uploadError}
        </div>
      )}

      {/* Tabs */}
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <rect x="9" y="9" width="6" height="6"/>
          </svg>
          Posts
        </button>
        
        {user.isArtist && (
          <button 
            className={`profile-tab ${activeTab === 'Artworks' ? 'active' : ''}`}
            onClick={() => setActiveTab('Artworks')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Artworks
          </button>
        )}
      </motion.div>

      {/* Tab Content */}
      <motion.div 
        className="profile-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        {renderTabContent()}
      </motion.div>

      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={handleCloseFollowersModal}
        type={followersModalType}
        targetUser={user}
      />

      {/* Edit Profile Modal - FIXED: Complete modal with profile picture upload */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              {/* Profile Picture Upload Section */}
              <div className="form-group">
                <label>Profile Picture</label>
                <div className="image-upload-container">
                  <div className="current-image">
                    <img 
                      src={editFormData.profileImage || user.profileImage || '/default-avatar.png'} 
                      alt="Profile" 
                      className="edit-profile-image"
                    />
                  </div>
                  <div className="upload-controls">
                    <input
                      type="file"
                      id="profile-image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="upload-image-btn"
                      onClick={() => document.getElementById('profile-image-upload').click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? 'Uploading...' : 'Change Picture'}
                    </button>
                  </div>
                </div>
                
                {/* Upload Status Messages */}
                {uploadingImage && (
                  <div className="upload-status uploading">
                    Uploading image...
                  </div>
                )}
                
                {uploadError && (
                  <div className="upload-status error">
                    {uploadError}
                  </div>
                )}
                
                {uploadSuccess && (
                  <div className="upload-status success">
                    Image uploaded successfully!
                  </div>
                )}
              </div>

              {/* Username Field */}
              <div className="form-group">
                <label htmlFor="edit-username">Username</label>
                <input
                  type="text"
                  id="edit-username"
                  name="username"
                  value={editFormData.username}
                  onChange={handleEditFormChange}
                />
              </div>
              
              {/* Bio Field */}
              <div className="form-group">
                <label htmlFor="edit-bio">Bio</label>
                <textarea
                  id="edit-bio"
                  name="bio"
                  value={editFormData.bio}
                  onChange={handleEditFormChange}
                  rows="3"
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              {/* Website Field */}
              <div className="form-group">
                <label htmlFor="edit-website">Website</label>
                <input
                  type="url"
                  id="edit-website"
                  name="website"
                  value={editFormData.website}
                  onChange={handleEditFormChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
            
            {/* Modal Footer with Action Buttons */}
            <div className="form-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className="save-profile-btn" 
                onClick={handleProfileUpdate}
                disabled={updatingProfile}
              >
                {updatingProfile ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;