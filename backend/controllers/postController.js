// backend/controllers/postController.js
const Post = require('../models/Post');
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const { uploadToAzure, deleteFromAzure, generateBlobName } = require('../middleware/azureStorageMiddleware');

// @desc    Get all posts with filtering
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const {
      tag,
      user,
      followingOnly,
      limit = 10,
      page = 1,
      search
    } = req.query;

    // Build query
    const query = {};

    // Filter by tag
    if (tag && tag !== 'all') {
      query.tags = tag;
    }

    // Filter by user
    if (user) {
      const userObj = await User.findOne({ username: user });
      if (userObj) {
        query.creator = userObj._id;
      }
    }

    // Filter by following
    if (followingOnly === 'true' && req.user) {
      const currentUser = await User.findById(req.user._id);
      if (currentUser && currentUser.following && currentUser.following.length > 0) {
        query.creator = { $in: currentUser.following };
      } else {
        return res.json({
          success: true,
          count: 0,
          posts: []
        });
      }
    }

    // Search in caption or tags
    if (search) {
      query.$or = [
        { caption: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageSize = parseInt(limit);
    const pageNumber = parseInt(page);
    const skip = (pageNumber - 1) * pageSize;

    // Get total count for pagination
    const count = await Post.countDocuments(query);

    // Fetch posts with proper population
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('creator', 'username profileImage')
      .populate('linkedShopItem', 'title price images')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profileImage'
        }
      });

    res.json({
      success: true,
      count,
      pages: Math.ceil(count / pageSize),
      currentPage: pageNumber,
      posts
    });
  } catch (error) {
    console.error('Error in getPosts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get a single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('creator', 'username profileImage')
      .populate('linkedShopItem', 'title price images')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profileImage'
        }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { caption, tags, linkedShopItem } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one media file is required'
      });
    }

    // Create content object based on number of files
    let content;
    if (req.files.length === 1) {
      const file = req.files[0];
      const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
      content = {
        type: fileType,
        url: file.url
      };
    } else {
      // Carousel
      content = {
        type: 'carousel',
        items: req.files.map(file => ({
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          url: file.url
        }))
      };
    }

    const post = new Post({
      creator: req.user._id,
      content,
      caption,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      linkedShopItem: linkedShopItem || null
    });

    await post.save();

    // Populate creator info before sending response
    await post.populate('creator', 'username profileImage');

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the post creator
    if (post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    const { caption, tags } = req.body;

    // Update fields
    if (caption !== undefined) post.caption = caption;
    if (tags !== undefined) post.tags = tags.split(',').map(tag => tag.trim());

    await post.save();

    // Populate before sending response
    await post.populate('creator', 'username profileImage');
    await post.populate({
      path: 'comments',
      populate: {
        path: 'user',
        select: 'username profileImage'
      }
    });

    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the post creator
    if (post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // For simplicity, we'll just increment/decrement the likes count
    // In production, you'd track which users liked the post
    post.likes = post.likes + 1;
    await post.save();

    res.json({
      success: true,
      likes: post.likes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = {
      user: req.user._id,
      text,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate the new comment's user info properly
    await post.populate({
      path: 'comments',
      populate: {
        path: 'user',
        select: 'username profileImage'
      }
    });

    // Return the newly added comment (last one in array)
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: newComment
    });
  } catch (error) {
    console.error('Error in commentOnPost:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/posts/:id/comment/:commentId
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the comment author
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    comment.deleteOne();
    await post.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get posts by a specific user
// @route   GET /api/posts/user/:userId
// @access  Public
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 12, page = 1 } = req.query;

    const pageSize = parseInt(limit);
    const pageNumber = parseInt(page);
    const skip = (pageNumber - 1) * pageSize;

    const count = await Post.countDocuments({ creator: userId });

    const posts = await Post.find({ creator: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('creator', 'username profileImage')
      .populate('linkedShopItem', 'title price images')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profileImage'
        }
      });

    res.json({
      success: true,
      count,
      pages: Math.ceil(count / pageSize),
      currentPage: pageNumber,
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  commentOnPost,
  deleteComment,
  getUserPosts
};