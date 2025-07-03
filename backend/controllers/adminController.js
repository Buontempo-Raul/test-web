const User = require('../models/User');
const Post = require('../models/Post');
const Artwork = require('../models/Artwork');

// Dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    console.log('🔍 Admin Dashboard Stats - User:', req.user?.username);
    
    const [totalUsers, totalPosts, totalArtworks, activeAuctions] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Artwork.countDocuments(),
      Artwork.countDocuments({ 'auction.isActive': true })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPosts,
        totalArtworks,
        totalOrders: 0, // Implement when Order model exists
        activeAuctions,
        pendingArtistRequests: 0, // Implement when ArtistRequest model exists
        revenue: 0 // Implement when Order model exists
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Recent activity
const getRecentActivity = async (req, res) => {
  try {
    console.log('🔍 Admin Recent Activity - User:', req.user?.username);
    
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username createdAt');

    const recentPosts = await Post.find({})
      .populate('creator', 'username')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('caption creator createdAt');

    const activities = [];

    recentUsers.forEach(user => {
      activities.push({
        type: 'user_registration',
        description: `New user registered: ${user.username}`,
        timestamp: user.createdAt
      });
    });

    recentPosts.forEach(post => {
      activities.push({
        type: 'post_created',
        description: `New post by ${post.creator?.username || 'Unknown'}`,
        timestamp: post.createdAt
      });
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      activities: activities.slice(0, 10)
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    console.log('🔍 Admin Get Users - User:', req.user?.username);
    
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role === 'artist') query.isArtist = true;
    else if (role === 'admin') query.role = 'admin';
    else if (role === 'user') query.role = { $ne: 'admin' }, query.isArtist = false;
    
    if (status === 'active') query.active = true;
    else if (status === 'inactive') query.active = false;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

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
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all posts
const getAllPosts = async (req, res) => {
  try {
    console.log('🔍 Admin Get Posts - User:', req.user?.username);
    
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = {};
    
    if (search) {
      query.caption = { $regex: search, $options: 'i' };
    }

    const posts = await Post.find(query)
      .populate('creator', 'username email profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

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
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all artworks
const getAllArtworks = async (req, res) => {
  try {
    console.log('🔍 Admin Get Artworks - User:', req.user?.username);
    
    const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) query.category = category;
    if (status === 'for-sale') query.forSale = true;
    else if (status === 'auction') query['auction.isActive'] = true;

    const artworks = await Artwork.find(query)
      .populate('creator', 'username email profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Artwork.countDocuments(query);

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
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all auctions
const getAllAuctions = async (req, res) => {
  try {
    console.log('🔍 Admin Get Auctions - User:', req.user?.username);
    
    const { page = 1, limit = 10, status = 'all' } = req.query;
    let query = { 'auction.startTime': { $exists: true } };
    
    if (status === 'active') {
      query['auction.isActive'] = true;
      query['auction.endTime'] = { $gt: new Date() };
    } else if (status === 'ended') {
      query = {
        $or: [
          { 'auction.isActive': false },
          { 'auction.endTime': { $lt: new Date() } }
        ]
      };
    }

    const auctions = await Artwork.find(query)
      .populate('creator', 'username email profileImage')
      .sort({ 'auction.startTime': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Artwork.countDocuments(query);

    // Add winner info
    const auctionsWithWinners = auctions.map(artwork => {
      let winner = null;
      if (artwork.auction?.bids?.length > 0) {
        const highestBid = artwork.auction.bids.reduce((max, bid) => 
          bid.amount > max.amount ? bid : max
        );
        if (!artwork.auction.isActive || artwork.auction.endTime < new Date()) {
          winner = {
            bidder: highestBid.bidder,
            amount: highestBid.amount,
            bidTime: highestBid.bidTime
          };
        }
      }
      return { ...artwork.toObject(), winner };
    });

    res.json({
      success: true,
      auctions: auctionsWithWinners,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Placeholder action functions
const banUser = (req, res) => {
  res.json({ success: true, message: 'Ban user functionality not implemented yet' });
};

const pauseUser = (req, res) => {
  res.json({ success: true, message: 'Pause user functionality not implemented yet' });
};

const deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.postId);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteArtwork = async (req, res) => {
  try {
    await Artwork.findByIdAndDelete(req.params.artworkId);
    res.json({ success: true, message: 'Artwork deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  deletePost,
  deleteArtwork
};