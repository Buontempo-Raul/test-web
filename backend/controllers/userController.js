// backend/controllers/userController.js - Updated getUserByUsername with follower counts
const userService = require('../services/userService');
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const { uploadToAzure, deleteFromAzure, generateBlobName } = require('../middleware/azureStorageMiddleware');

// @desc    Get user by username
// @route   GET /api/users/:username
// @access  Public
const getUserByUsername = async (req, res) => {
  try {
    const user = await userService.getUserByUsername(req.params.username);

    // Get follower and following counts
    const followersCount = user.followers ? user.followers.length : 0;
    const followingCount = user.following ? user.following.length : 0;

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        profileImage: user.profileImage,
        bio: user.bio,
        website: user.website,
        isArtist: user.isArtist,
        createdAt: user.createdAt,
        followers: user.followers, // Include full followers array for follow status checking
        following: user.following, // Include full following array
        followersCount: followersCount,
        followingCount: followingCount
      }
    });
  } catch (error) {
    res.status(error.message === 'User not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const result = await userService.getAllUsers(query, page, limit);
    
    res.json({
      success: true,
      users: result.users,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      totalUsers: result.totalUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/users/id/:userId
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(error.message === 'User not found' || error.message === 'Invalid user ID format' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await userService.updateUserProfile(req.user._id, req.body);

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        website: user.website,
        isArtist: user.isArtist
      }
    });
  } catch (error) {
    const status = 
      error.message === 'User not found' ? 404 :
      error.message === 'Email already in use' || error.message === 'Username already taken' ? 400 : 500;
    
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/users/:userId
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.userId, req.body);
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    const status = 
      error.message === 'User not found' || error.message === 'Invalid user ID format' ? 404 :
      error.message === 'Email already in use' || error.message === 'Username already taken' ? 400 : 500;
    
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:userId
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.userId);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    const status = 
      error.message === 'User not found' || error.message === 'Invalid user ID format' ? 404 : 500;
    
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Make user an artist (admin only)
// @route   PUT /api/users/:userId/artist
// @access  Private/Admin
const makeUserArtist = async (req, res) => {
  try {
    const user = await userService.makeUserArtist(req.params.userId);
    
    res.json({
      success: true,
      user,
      message: 'User is now an artist'
    });
  } catch (error) {
    const status = 
      error.message === 'User not found' || error.message === 'Invalid user ID format' ? 404 :
      error.message === 'User is already an artist' ? 400 : 500;
    
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's artworks
// @route   GET /api/users/:username/artworks
// @access  Public
const getUserArtworks = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const artworks = await Artwork.find({ creator: user._id })
      .populate('creator', 'username profileImage')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      artworks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add artwork to favorites
// @route   POST /api/users/favorites/:artworkId
// @access  Private
const addToFavorites = async (req, res) => {
  try {
    const user = await userService.addToFavorites(req.user._id, req.params.artworkId);
    
    res.json({
      success: true,
      message: 'Artwork added to favorites',
      user
    });
  } catch (error) {
    const status = 
      error.message === 'User not found' || error.message === 'Artwork not found' || error.message === 'Invalid ID format' ? 404 :
      error.message === 'Artwork already in favorites' ? 400 : 500;
    
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove artwork from favorites
// @route   DELETE /api/users/favorites/:artworkId
// @access  Private
const removeFromFavorites = async (req, res) => {
  try {
    const user = await userService.removeFromFavorites(req.user._id, req.params.artworkId);
    
    res.json({
      success: true,
      message: 'Artwork removed from favorites',
      user
    });
  } catch (error) {
    const status = 
      error.message === 'User not found' || error.message === 'Invalid ID format' ? 404 :
      error.message === 'Artwork not in favorites' ? 400 : 500;
    
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's favorites
// @route   GET /api/users/favorites
// @access  Private
const getUserFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'favorites',
        populate: {
          path: 'creator',
          select: 'username profileImage'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      favorites: user.favorites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Upload profile image
// @route   POST /api/users/profile/upload
// @access  Private
const uploadProfileImage = async (req, res) => {
  try {
    console.log('=== Profile Image Upload Debug ===');
    console.log('File received:', req.file ? req.file.originalname : 'No file');
    console.log('User ID:', req.user._id);
    console.log('User username:', req.user.username);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    // FIXED: Generate blob name with correct parameters
    // generateBlobName expects (prefix, userId, originalName)
    const blobName = generateBlobName('profile', req.user._id, req.file.originalname);
    console.log('Generated blob name:', blobName);

    // FIXED: Upload to Azure with correct container name for profile images
    // Note: uploadToAzure expects the full file object, not just file.buffer
    const imageUrl = await uploadToAzure(req.file, blobName, 'images');
    console.log('Image uploaded to:', imageUrl);

    // Update user's profile image in database
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('Profile image updated successfully for user:', user.username);

    res.json({
      success: true,
      profileImage: imageUrl,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        website: user.website,
        isArtist: user.isArtist
      }
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Follow a user
// @route   POST /api/users/follow/:userId
// @access  Private
const followUser = async (req, res) => {
  try {
    // Check if user is trying to follow themselves
    if (req.user._id.toString() === req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Find the user to follow
    const userToFollow = await User.findById(req.params.userId);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the current user
    const currentUser = await User.findById(req.user._id);

    // Check if already following
    if (currentUser.following.includes(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }

    // Add to current user's following list
    currentUser.following.push(req.params.userId);
    await currentUser.save();

    // Add to target user's followers list
    userToFollow.followers.push(req.user._id);
    await userToFollow.save();

    res.json({
      success: true,
      message: `You are now following ${userToFollow.username}`,
      followersCount: userToFollow.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Unfollow a user
// @route   POST /api/users/unfollow/:userId
// @access  Private
const unfollowUser = async (req, res) => {
  try {
    // Check if user is trying to unfollow themselves
    if (req.user._id.toString() === req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot unfollow yourself'
      });
    }

    // Find the user to unfollow
    const userToUnfollow = await User.findById(req.params.userId);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the current user
    const currentUser = await User.findById(req.user._id);

    // Check if actually following
    if (!currentUser.following.includes(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not following this user'
      });
    }

    // Remove from current user's following list
    currentUser.following = currentUser.following.filter(
      userId => userId.toString() !== req.params.userId
    );
    await currentUser.save();

    // Remove from target user's followers list
    userToUnfollow.followers = userToUnfollow.followers.filter(
      userId => userId.toString() !== req.user._id.toString()
    );
    await userToUnfollow.save();

    res.json({
      success: true,
      message: `You have unfollowed ${userToUnfollow.username}`,
      followersCount: userToUnfollow.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's following list
// @route   GET /api/users/following
// @access  Private
const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('following', 'username profileImage bio');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Format profile images
    const followingList = user.following.map(followedUser => {
      const userObj = followedUser.toObject();
      if (userObj.profileImage) {
        userObj.profileImage = `${req.protocol}://${req.get('host')}/${userObj.profileImage}`;
      }
      return userObj;
    });

    res.json({
      success: true,
      following: followingList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's followers list
// @route   GET /api/users/followers
// @access  Private
const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'username profileImage bio');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Format profile images
    const followersList = user.followers.map(follower => {
      const userObj = follower.toObject();
      if (userObj.profileImage) {
        userObj.profileImage = `${req.protocol}://${req.get('host')}/${userObj.profileImage}`;
      }
      return userObj;
    });

    res.json({
      success: true,
      followers: followersList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's followers list by username (public)
// @route   GET /api/users/:username/followers
// @access  Public
const getUserFollowers = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'username profileImage bio');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has private profile (if this feature exists)
    if (user.settings?.privateProfile && (!req.user || req.user._id.toString() !== user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'This user\'s followers list is private'
      });
    }

    // Format profile images
    const followersList = user.followers.map(follower => {
      const userObj = follower.toObject();
      if (userObj.profileImage) {
        userObj.profileImage = `${req.protocol}://${req.get('host')}/${userObj.profileImage}`;
      }
      return userObj;
    });

    res.json({
      success: true,
      followers: followersList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's following list by username (public)
// @route   GET /api/users/:username/following
// @access  Public
const getUserFollowing = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('following', 'username profileImage bio');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has private profile (if this feature exists)
    if (user.settings?.privateProfile && (!req.user || req.user._id.toString() !== user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'This user\'s following list is private'
      });
    }

    // Format profile images
    const followingList = user.following.map(followedUser => {
      const userObj = followedUser.toObject();
      if (userObj.profileImage) {
        userObj.profileImage = `${req.protocol}://${req.get('host')}/${userObj.profileImage}`;
      }
      return userObj;
    });

    res.json({
      success: true,
      following: followingList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = {
  getUserByUsername,
  getAllUsers,
  getUserById,
  updateUserProfile,
  updateUser,
  deleteUser,
  makeUserArtist,
  getUserArtworks,
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  uploadProfileImage,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getUserFollowers,  // NEW
  getUserFollowing   // NEW
};
