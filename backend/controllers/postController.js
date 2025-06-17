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

    // Fetch posts with populated creator
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('creator', 'username profileImage')
      .populate('linkedShopItem', 'title price images');

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

// @desc    Get a single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('creator', 'username profileImage')
      .populate('linkedShopItem', 'title price images')
      .populate('comments.user', 'username profileImage');

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
    const { caption, tags, linkedShopItem, contentType } = req.body;
    
    // Check for required files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image or video'
      });
    }

    // Process files and upload to Azure
    let content = {};
    
    if (contentType === 'image' && req.files.length === 1) {
      // Single image post
      const file = req.files[0];
      const blobName = generateBlobName('post', req.user._id, file.originalname);
      const url = await uploadToAzure(file, blobName, 'posts');
      
      content = {
        type: 'image',
        url,
        aspectRatio: '1:1'
      };
    } else if (contentType === 'video' && req.files.length === 1) {
      // Single video post
      const file = req.files[0];
      const blobName = generateBlobName('post', req.user._id, file.originalname);
      const url = await uploadToAzure(file, blobName, 'posts');
      
      content = {
        type: 'video',
        url,
        thumbnailUrl: url, // In production, generate a proper thumbnail
        aspectRatio: '16:9'
      };
    } else if (req.files.length > 1) {
      // Carousel post with multiple items
      const items = await Promise.all(req.files.map(async (file) => {
        const blobName = generateBlobName('post', req.user._id, file.originalname);
        const url = await uploadToAzure(file, blobName, 'posts');
        
        return {
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          url
        };
      }));
      
      content = {
        type: 'carousel',
        items
      };
    }

    // Parse tags
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

    // Create the post
    const post = new Post({
      creator: req.user._id,
      content,
      caption,
      tags: parsedTags,
      linkedShopItem
    });

    await post.save();

    // Populate creator info
    await post.populate('creator', 'username profileImage');
    if (linkedShopItem) {
      await post.populate('linkedShopItem', 'title price images');
    }

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update an existing post
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

    // Check if user is the creator of the post
    if (post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own posts'
      });
    }

    const { caption, tags, linkedShopItem } = req.body;

    // Update fields
    if (caption !== undefined) post.caption = caption;
    if (tags) post.tags = tags.split(',').map(tag => tag.trim());
    if (linkedShopItem !== undefined) post.linkedShopItem = linkedShopItem;

    // Update content if new files are uploaded
    if (req.files && req.files.length > 0) {
      // Delete old media files from Azure
      if (post.content.type === 'image' && post.content.url) {
        await deleteFromAzure(post.content.url);
      } else if (post.content.type === 'video' && post.content.url) {
        await deleteFromAzure(post.content.url);
      } else if (post.content.type === 'carousel' && post.content.items) {
        await Promise.all(post.content.items.map(item => deleteFromAzure(item.url)));
      }

      // Upload new files
      const contentType = req.body.contentType || post.content.type;
      
      if (contentType === 'image' && req.files.length === 1) {
        const file = req.files[0];
        const blobName = generateBlobName('post', req.user._id, file.originalname);
        const url = await uploadToAzure(file, blobName, 'posts');
        
        post.content = {
          type: 'image',
          url,
          aspectRatio: '1:1'
        };
      } else if (contentType === 'video' && req.files.length === 1) {
        const file = req.files[0];
        const blobName = generateBlobName('post', req.user._id, file.originalname);
        const url = await uploadToAzure(file, blobName, 'posts');
        
        post.content = {
          type: 'video',
          url,
          thumbnailUrl: url,
          aspectRatio: '16:9'
        };
      } else if (req.files.length > 1) {
        const items = await Promise.all(req.files.map(async (file) => {
          const blobName = generateBlobName('post', req.user._id, file.originalname);
          const url = await uploadToAzure(file, blobName, 'posts');
          
          return {
            type: file.mimetype.startsWith('image/') ? 'image' : 'video',
            url
          };
        }));
        
        post.content = {
          type: 'carousel',
          items
        };
      }
    }

    await post.save();

    // Populate creator info
    await post.populate('creator', 'username profileImage');
    if (post.linkedShopItem) {
      await post.populate('linkedShopItem', 'title price images');
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Error updating post:', error);
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

    // Check if user is the creator of the post
    if (post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    // Delete media files from Azure
    if (post.content.type === 'image' && post.content.url) {
      await deleteFromAzure(post.content.url);
    } else if (post.content.type === 'video' && post.content.url) {
      await deleteFromAzure(post.content.url);
    } else if (post.content.type === 'carousel' && post.content.items) {
      await Promise.all(post.content.items.map(item => deleteFromAzure(item.url)));
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

    // Populate the comment user info
    await post.populate('comments.user', 'username profileImage');

    res.status(201).json({
      success: true,
      comment: post.comments[post.comments.length - 1]
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
      .populate('linkedShopItem', 'title price images');

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