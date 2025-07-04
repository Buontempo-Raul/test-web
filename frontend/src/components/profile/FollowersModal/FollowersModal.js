// src/components/profile/FollowersModal/FollowersModal.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './FollowersModal.css';
import { userAPI } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

const FollowersModal = ({ isOpen, onClose, type, targetUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [followStates, setFollowStates] = useState({});
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  // Reset state when modal opens/closes or type changes
  useEffect(() => {
    if (isOpen) {
      setUsers([]);
      setError('');
      setFollowStates({});
      fetchUsers();
    }
  }, [isOpen, type, targetUser]);

  const fetchUsers = async () => {
    if (!targetUser) return;
    
    setLoading(true);
    setError('');

    try {
      let response;
      
      // If viewing own profile, use authenticated endpoints
      if (currentUser && currentUser.username === targetUser.username) {
        if (type === 'followers') {
          response = await userAPI.getFollowers();
        } else {
          response = await userAPI.getFollowing();
        }
      } else {
        // For other users' profiles, use public endpoints
        if (type === 'followers') {
          response = await userAPI.getUserFollowers(targetUser.username);
        } else {
          response = await userAPI.getUserFollowing(targetUser.username);
        }
      }

      if (response.data.success) {
        const userList = type === 'followers' ? response.data.followers : response.data.following;
        setUsers(userList);
        
        // Initialize follow states if authenticated
        if (isAuthenticated && currentUser) {
          const initialStates = {};
          userList.forEach(user => {
            // Can't follow yourself
            if (user._id !== currentUser._id) {
              initialStates[user._id] = false; // We'll check this properly below
            }
          });
          setFollowStates(initialStates);
          
          // Check follow status for each user
          checkFollowStates(userList);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.response?.status === 403) {
        setError('This user\'s followers/following list is private');
      } else {
        setError(err.message || `Failed to load ${type}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStates = async (userList) => {
    if (!isAuthenticated || !currentUser) return;

    try {
      const response = await userAPI.getFollowing();
      if (response.data.success) {
        const followingIds = response.data.following.map(user => user._id);
        const newStates = {};
        
        userList.forEach(user => {
          if (user._id !== currentUser._id) {
            newStates[user._id] = followingIds.includes(user._id);
          }
        });
        
        setFollowStates(newStates);
      }
    } catch (error) {
      console.error('Error checking follow states:', error);
    }
  };

  const handleFollowToggle = async (userId) => {
    if (!isAuthenticated) {
      alert('Please log in to follow users');
      return;
    }

    const isFollowing = followStates[userId];
    
    try {
      if (isFollowing) {
        await userAPI.unfollowUser(userId);
      } else {
        await userAPI.followUser(userId);
      }
      
      setFollowStates(prev => ({
        ...prev,
        [userId]: !isFollowing
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status. Please try again.');
    }
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="followers-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
      >
        <motion.div 
          className="followers-modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="followers-modal-header">
            <h2>{type === 'followers' ? 'Followers' : 'Following'}</h2>
            <button 
              className="close-button"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="followers-modal-body">
            {loading ? (
              <div className="followers-loading">
                <div className="spinner"></div>
                <p>Loading {type}...</p>
              </div>
            ) : error ? (
              <div className="followers-error">
                <p>{error}</p>
                <button onClick={fetchUsers} className="retry-button">
                  Try Again
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="followers-empty">
                <p>No {type} yet</p>
                {type === 'following' && (
                  <p className="followers-empty-subtitle">
                    Start following people to build your network!
                  </p>
                )}
              </div>
            ) : (
              <div className="followers-list">
                {users.map(user => (
                  <motion.div 
                    key={user._id} 
                    className="follower-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div 
                      className="follower-info"
                      onClick={() => handleUserClick(user.username)}
                    >
                      <img 
                        src={user.profileImage || 'https://via.placeholder.com/50x50'} 
                        alt={user.username}
                        className="follower-avatar"
                      />
                      <div className="follower-details">
                        <h4 className="follower-username">{user.username}</h4>
                        {user.bio && (
                          <p className="follower-bio">{user.bio}</p>
                        )}
                      </div>
                    </div>
                    
                    {isAuthenticated && currentUser && user._id !== currentUser._id && (
                      <button 
                        className={`follow-button ${followStates[user._id] ? 'following' : ''}`}
                        onClick={() => handleFollowToggle(user._id)}
                      >
                        {followStates[user._id] ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FollowersModal;