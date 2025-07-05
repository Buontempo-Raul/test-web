// backend/controllers/adminController.js - Enhanced with proper ban/pause distinction
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Post = require('../models/Post');

try {
  User = require('../models/User');
  console.log('✅ User model loaded successfully');
} catch (error) {
  console.error('❌ Failed to load User model:', error.message);
}

try {
  Post = require('../models/Post');
  console.log('✅ Post model loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Post model:', error.message);
}

try {
  Artwork = require('../models/Artwork');
  console.log('✅ Artwork model loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Artwork model:', error.message);
}

// Get dashboard statistics with enhanced ban/pause tracking
const getDashboardStats = async (req, res) => {
  try {
    console.log('🔍 Getting dashboard stats...');
    
    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get active users (not banned, not paused)
    const activeUsers = await User.countDocuments({
      active: true,
      $and: [
        {
          $or: [
            { banUntil: { $exists: false } },
            { banUntil: { $lt: new Date() } }
          ]
        },
        {
          $or: [
            { pauseUntil: { $exists: false } },
            { pauseUntil: { $lt: new Date() } }
          ]
        }
      ]
    });

    // Get currently banned users (temporary bans)
    const currentlyBannedUsers = await User.countDocuments({
      banUntil: { $gt: new Date() }
    });

    // Get permanently banned users
    const permanentlyBannedUsers = await User.countDocuments({
      permanentlyBanned: true
    });

    // Get currently paused users
    const currentlyPausedUsers = await User.countDocuments({
      pauseUntil: { $gt: new Date() }
    });

    // Get artists
    const totalArtists = await User.countDocuments({ isArtist: true });

    // *** MISSING: Get total posts *** 
    const totalPosts = await Post.countDocuments();

    // Get artworks
    const totalArtworks = await Artwork.countDocuments();

    // Get active auctions
    const activeAuctions = await Artwork.countDocuments({
      'auction.isActive': true
    });

    console.log('📊 Dashboard stats calculated:', {
      totalUsers,
      activeUsers,
      currentlyBannedUsers,
      permanentlyBannedUsers,
      currentlyPausedUsers,
      totalArtists,
      totalPosts, // This was missing!
      totalArtworks,
      activeAuctions
    });

    // *** FIXED: Complete response object ***
    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers: currentlyBannedUsers + permanentlyBannedUsers, // Combined for frontend
        pausedUsers: currentlyPausedUsers,
        totalArtists,
        totalPosts, // *** THIS WAS MISSING ***
        totalArtworks,
        activeAuctions
      }
    });

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

// Get recent activity
const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent user registrations
    const recentUsers = await User.find()
      .select('username email createdAt isArtist banUntil pauseUntil permanentlyBanned')
      .sort({ createdAt: -1 })
      .limit(limit);

    const activities = recentUsers.map(user => {
      let description = `New ${user.isArtist ? 'artist' : 'user'} registered: ${user.username}`;
      let type = 'user_registration';
      
      // Add status if user has restrictions
      if (user.permanentlyBanned) {
        description += ' (Permanently Banned)';
        type = 'banned_user_registration';
      } else if (user.banUntil && user.banUntil > new Date()) {
        description += ' (Currently Banned)';
        type = 'banned_user_registration';
      } else if (user.pauseUntil && user.pauseUntil > new Date()) {
        description += ' (Currently Paused)';
        type = 'paused_user_registration';
      }
      
      return {
        type: type,
        description: description,
        timestamp: user.createdAt,
        user: {
          username: user.username,
          email: user.email
        }
      };
    });

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.json({
      success: false,
      message: error.message,
      activities: []
    });
  }
};

// Get all users with enhanced filtering
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    // Build filter object
    let filter = {};

    // Search filter
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Role filter
    if (role) {
      if (role === 'admin') {
        filter.role = 'admin';
      } else if (role === 'artist') {
        filter.isArtist = true;
        filter.role = { $ne: 'admin' };
      } else if (role === 'user') {
        filter.isArtist = false;
        filter.role = { $ne: 'admin' };
      }
    }

    // Enhanced status filter
    if (status) {
      const now = new Date();
      switch (status) {
        case 'active':
          filter.active = true;
          filter.$and = [
            {
              $or: [
                { banUntil: { $exists: false } },
                { banUntil: { $lt: now } }
              ]
            },
            {
              $or: [
                { pauseUntil: { $exists: false } },
                { pauseUntil: { $lt: now } }
              ]
            }
          ];
          break;
        case 'banned':
          filter.banUntil = { $gt: now };
          break;
        case 'permanently_banned':
          filter.permanentlyBanned = true;
          break;
        case 'paused':
          filter.pauseUntil = { $gt: now };
          break;
        case 'inactive':
          filter.active = false;
          break;
      }
    }

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .populate('followers', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.json({
      success: false,
      message: error.message,
      users: [],
      pagination: { current: 1, pages: 1, total: 0 }
    });
  }
};

// Enhanced ban user functionality
const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, duration, reason } = req.body;

    // Validate input
    if (!action || !['ban', 'unban'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "ban" or "unban"'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent banning admins
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot ban admin users'
      });
    }

    // Prevent self-banning
    if (userId === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot ban yourself'
      });
    }

    if (action === 'ban') {
      // Validate ban parameters
      if (!duration || duration < 1 || duration > 365) {
        return res.status(400).json({
          success: false,
          message: 'Duration must be between 1 and 365 days'
        });
      }

      if (!reason || reason.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Ban reason is required and must be at least 3 characters'
        });
      }

      // IMPORTANT: Ban the user (this marks email as permanently banned)
      await user.banUser(parseInt(duration), reason.trim());
      
      res.json({
        success: true,
        message: `User ${user.username} has been banned for ${duration} days. Email is now permanently banned from re-registration.`,
        action: 'banned',
        user: {
          _id: user._id,
          username: user.username,
          banUntil: user.banUntil,
          banReason: user.banReason,
          permanentlyBanned: user.permanentlyBanned,
          active: user.active
        }
      });
    } else {
      // Unban the user (removes current ban but keeps permanent ban flag)
      await user.unbanUser();
      
      res.json({
        success: true,
        message: `User ${user.username} has been unbanned. Note: Email remains permanently banned from re-registration.`,
        action: 'unbanned',
        user: {
          _id: user._id,
          username: user.username,
          banUntil: user.banUntil,
          banReason: user.banReason,
          permanentlyBanned: user.permanentlyBanned,
          active: user.active
        }
      });
    }
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing ban request'
    });
  }
};

// Enhanced pause user functionality (temporary restriction only)
const pauseUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, duration, reason } = req.body;

    // Validate input
    if (!action || !['pause', 'unpause'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "pause" or "unpause"'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent pausing admins
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot pause admin users'
      });
    }

    // Prevent self-pausing
    if (userId === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot pause yourself'
      });
    }

    if (action === 'pause') {
      // Validate pause parameters
      if (!duration || duration < 1 || duration > 90) {
        return res.status(400).json({
          success: false,
          message: 'Duration must be between 1 and 90 days'
        });
      }

      if (!reason || reason.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Pause reason is required and must be at least 3 characters'
        });
      }

      // IMPORTANT: Pause the user (temporary restriction, does NOT mark email as permanently banned)
      await user.pauseUser(parseInt(duration), reason.trim());
      
      res.json({
        success: true,
        message: `User ${user.username} has been paused for ${duration} days. This is a temporary restriction.`,
        action: 'paused',
        user: {
          _id: user._id,
          username: user.username,
          pauseUntil: user.pauseUntil,
          pauseReason: user.pauseReason,
          permanentlyBanned: user.permanentlyBanned
        }
      });
    } else {
      // Unpause the user
      await user.unpauseUser();
      
      res.json({
        success: true,
        message: `User ${user.username} has been unpaused and can now access their account normally.`,
        action: 'unpaused',
        user: {
          _id: user._id,
          username: user.username,
          pauseUntil: user.pauseUntil,
          pauseReason: user.pauseReason,
          permanentlyBanned: user.permanentlyBanned
        }
      });
    }
  } catch (error) {
    console.error('Pause user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing pause request'
    });
  }
};

// NEW: Fully restore user (removes permanent ban flag)
const fullyRestoreUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only allow if user is currently restricted
    if (!user.permanentlyBanned && !user.banUntil && !user.pauseUntil && user.active) {
      return res.status(400).json({
        success: false,
        message: 'User account is already fully active'
      });
    }

    // Fully restore the user
    await user.fullyRestoreUser();
    
    res.json({
      success: true,
      message: `User ${user.username} has been fully restored. Email is now eligible for re-registration if account is deleted.`,
      action: 'fully_restored',
      user: {
        _id: user._id,
        username: user.username,
        permanentlyBanned: user.permanentlyBanned,
        active: user.active
      }
    });
  } catch (error) {
    console.error('Fully restore user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while restoring user'
    });
  }
};

// Get all posts (unchanged)
// Complete fixed getAllPosts function for backend/controllers/adminController.js
const getAllPosts = async (req, res) => {
  try {
    console.log('🔍 Admin Get Posts - User:', req.user?.username);
    
    if (!Post) {
      return res.json({
        success: false,
        message: 'Post model not available',
        posts: []
      });
    }

    const { page = 1, limit = 10, search = '' } = req.query;
    
    // Build query for search functionality
    let query = {};
    if (search) {
      query = {
        $or: [
          { caption: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      };
    }

    // Get posts with pagination
    // 🔧 FIXED: Added 'email' to the populate fields and comments population
    const posts = await Post.find(query)
      .populate('creator', 'username profileImage email')  // ✅ Now includes email
      .populate('linkedShopItems', 'title price images')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profileImage email'
        }
      })  // ✅ Now populates comments with user details
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    console.log(`✅ Found ${posts.length} posts out of ${total} total`);

    res.json({
      success: true,
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('❌ Get posts error:', error);
    res.json({
      success: false,
      message: error.message,
      posts: [],
      pagination: {
        current: 1,
        pages: 0,
        total: 0
      }
    });
  }
};

// Get all artworks (unchanged)
const getAllArtworks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const status = req.query.status || '';

    let filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (status === 'auction') {
      filter['auction.isActive'] = true;
    } else if (status === 'sold') {
      filter.sold = true;
    }

    const artworks = await Artwork.find(filter)
      .populate('creator', 'username profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Artwork.countDocuments(filter);

    res.json({
      success: true,
      artworks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get artworks error:', error);
    res.json({
      success: false,
      message: error.message,
      artworks: [],
      pagination: { current: 1, pages: 1, total: 0 }
    });
  }
};

// Get all auctions (unchanged)
const getAllAuctions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || 'all';

    let filter = {
      auction: { $exists: true }
    };

    if (status === 'active') {
      filter['auction.isActive'] = true;
    } else if (status === 'ended') {
      filter['auction.isActive'] = false;
    }

    const auctions = await Artwork.find(filter)
      .populate('creator', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Artwork.countDocuments(filter);

    res.json({
      success: true,
      auctions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get auctions error:', error);
    res.json({
      success: false,
      message: error.message,
      auctions: [],
      pagination: { current: 1, pages: 1, total: 0 }
    });
  }
};

// Delete post (unchanged)
const deletePost = async (req, res) => {
  try {
    let Post;
    try {
      Post = require('../models/Post');
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Post model not available'
      });
    }

    const post = await Post.findByIdAndDelete(req.params.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({ 
      success: true, 
      message: 'Post deleted successfully' 
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Delete artwork (unchanged)
const deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findByIdAndDelete(req.params.artworkId);
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    res.json({ 
      success: true, 
      message: 'Artwork deleted successfully' 
    });
  } catch (error) {
    console.error('Delete artwork error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getAllUsers,
  getAllPosts,
  getAllArtworks,
  getAllAuctions,
  banUser,
  pauseUser,
  fullyRestoreUser,
  deletePost,
  deleteArtwork
};