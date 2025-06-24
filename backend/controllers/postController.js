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
      before,
      search
    } = req.query;

    const query = {};

    if (tag && tag !== 'all') {
      query.tags = tag;
    }

    if (user) {
      const userObj = await User.findOne({ username: user });
      if (userObj) {
        query.creator = userObj._id;
      }
    }

    if (followingOnly === 'true' && req.user) {
      const currentUser = await User.findById(req.user._id);
      if (currentUser && currentUser.following && currentUser.following.length > 0) {
        query.creator = { $in: currentUser.following };
      } else {
        return res.json({
          success: true,
          count: 0,
          posts: [],
          hasMore: false
        });
      }
    }

    if (search) {
      query.$or = [
        { caption: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const pageSize = parseInt(limit);

    let posts;
    let count = 0;
    let pages = 0;
    let currentPage = 1;
    let hasMore = true;

    if (before) {
      posts = await Post.find(query)
        .sort({ createdAt: -1 })
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

      hasMore = posts.length === pageSize;
    } else {
      currentPage = parseInt(page);
      const skip = (currentPage - 1) * pageSize;

      count = await Post.countDocuments(query);
      pages = Math.ceil(count / pageSize);

      posts = await Post.find(query)
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
    }

    const postsWithLikeStatus = posts.map(post => {
      const postObj = post.toObject();
      if (req.user) {
        postObj.isLikedByCurrentUser = post.likedBy.includes(req.user._id);
      }
      return postObj;
    });

    res.json({
      success: true,
      count,
      pages,
      currentPage,
      hasMore,
      posts: postsWithLikeStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get a single post
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

    // Add liked status for authenticated users
    const postObj = post.toObject();
    if (req.user) {
      postObj.isLikedByCurrentUser = post.isLikedByUser(req.user._id);
    }

    res.json({
      success: true,
      post: postObj
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
    console.log('Creating post...');
    console.log('Request files:', req.files);
    console.log('Request body:', req.body);

    const { caption, tags, linkedShopItem } = req.body;

    // Check for uploaded files (req.files is set by multer middleware)
    if (!req.files || req.files.length === 0) {
      console.log('No files found in request');
      return res.status(400).json({
        success: false,
        message: 'At least one media file is required'
      });
    }

    let content;
    const files = req.files;

    console.log(`Processing ${files.length} files`);

    // Create content based on number of files
    if (files.length === 1) {
      const file = files[0];
      console.log('Single file:', file.originalname, file.mimetype);
      
      content = {
        type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        url: file.url || file.location || `/uploads/posts/${file.filename}`, // Handle different URL sources
        aspectRatio: '1:1'
      };
    } else {
      console.log('Multiple files (carousel)');
      content = {
        type: 'carousel',
        items: files.map(file => {
          console.log('Processing file:', file.originalname, file.mimetype);
          return {
            type: file.mimetype.startsWith('video/') ? 'video' : 'image',
            url: file.url || file.location || `/uploads/posts/${file.filename}`
          };
        })
      };
    }

    console.log('Content created:', content);

    // Process tags
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags;
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }

    console.log('Processed tags:', processedTags);

    // Create the post
    const post = new Post({
      creator: req.user._id,
      content,
      caption: caption || '',
      tags: processedTags,
      linkedShopItem: linkedShopItem || null
    });

    const savedPost = await post.save();
    console.log('Post saved:', savedPost._id);

    // Populate creator info for response
    await savedPost.populate('creator', 'username profileImage');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: savedPost
    });

  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create post'
    });
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    const { caption, tags } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    post.caption = caption || post.caption;
    if (tags) {
      post.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('creator', 'username profileImage')
      .populate('linkedShopItem', 'title price images');

    res.json({
      success: true,
      post: updatedPost
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

// @desc    Like/Unlike a post
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

    const userId = req.user._id;
    const hasLiked = post.likedBy.includes(userId);

    if (hasLiked) {
      // Unlike the post
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId.toString());
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // Like the post
      post.likedBy.push(userId);
      post.likes = post.likes + 1;
    }

    await post.save();

    res.json({
      success: true,
      liked: !hasLiked,
      likes: post.likes,
      message: hasLiked ? 'Post unliked' : 'Post liked'
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

    if (!text || text.trim() === '') {
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
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('creator', 'username profileImage')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profileImage'
        }
      });

    res.json({
      success: true,
      post: updatedPost
    });
  } catch (error) {
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

    // Add liked status for authenticated users
    let processedPosts = posts;
    if (req.user) {
      processedPosts = posts.map(post => {
        const postObj = post.toObject();
        postObj.isLikedByCurrentUser = post.isLikedByUser(req.user._id);
        return postObj;
      });
    }

    res.json({
      success: true,
      count,
      pages: Math.ceil(count / pageSize),
      currentPage: pageNumber,
      posts: processedPosts
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