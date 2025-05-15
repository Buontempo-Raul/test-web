// backend/controllers/postController.js
const Post = require('../models/Post');
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const fs = require('fs');
const path = require('path');

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
      // Get user's following list (assuming it's stored in User model)
      const currentUser = await User.findById(req.user._id);
      if (currentUser && currentUser.following && currentUser.following.length > 0) {
        query.creator = { $in: currentUser.following };
      } else {
        // If user isn't following anyone, return empty array
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

    // Format response data
    const formattedPosts = posts.map(post => {
      const postObj = post.toObject();
      
      // Format content URLs
      if (postObj.content.type === 'image' && postObj.content.url) {
        postObj.content.url = `${req.protocol}://${req.get('host')}/${postObj.content.url}`;
      } else if (postObj.content.type === 'video') {
        if (postObj.content.url) {
          postObj.content.url = `${req.protocol}://${req.get('host')}/${postObj.content.url}`;
        }
        if (postObj.content.thumbnailUrl) {
          postObj.content.thumbnailUrl = `${req.protocol}://${req.get('host')}/${postObj.content.thumbnailUrl}`;
        }
      } else if (postObj.content.type === 'carousel' && postObj.content.items) {
        postObj.content.items = postObj.content.items.map(item => {
          if (item.url) {
            item.url = `${req.protocol}://${req.get('host')}/${item.url}`;
          }
          return item;
        });
      }

      // Format linked shop item image
      if (postObj.linkedShopItem && postObj.linkedShopItem.images && postObj.linkedShopItem.images.length > 0) {
        postObj.linkedShopItem.images = postObj.linkedShopItem.images.map(img => 
          `${req.protocol}://${req.get('host')}/${img}`
        );
      }

      // Format profile image
      if (postObj.creator && postObj.creator.profileImage) {
        postObj.creator.profileImage = `${req.protocol}://${req.get('host')}/${postObj.creator.profileImage}`;
      }

      return postObj;
    });

    res.json({
      success: true,
      count,
      pages: Math.ceil(count / pageSize),
      currentPage: pageNumber,
      posts: formattedPosts
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
    const userId = req.params.userId;
    
    // Find posts by user ID
    const posts = await Post.find({ creator: userId })
      .sort({ createdAt: -1 })
      .populate('creator', 'username profileImage')
      .populate('linkedShopItem', 'title price images');
    
    // Format response data (similar to getPosts)
    const formattedPosts = posts.map(post => {
      const postObj = post.toObject();
      
      // Format content URLs
      if (postObj.content.type === 'image' && postObj.content.url) {
        postObj.content.url = `${req.protocol}://${req.get('host')}/${postObj.content.url}`;
      } else if (postObj.content.type === 'video') {
        if (postObj.content.url) {
          postObj.content.url = `${req.protocol}://${req.get('host')}/${postObj.content.url}`;
        }
        if (postObj.content.thumbnailUrl) {
          postObj.content.thumbnailUrl = `${req.protocol}://${req.get('host')}/${postObj.content.thumbnailUrl}`;
        }
      } else if (postObj.content.type === 'carousel' && postObj.content.items) {
        postObj.content.items = postObj.content.items.map(item => {
          if (item.url) {
            item.url = `${req.protocol}://${req.get('host')}/${item.url}`;
          }
          return item;
        });
      }

      // Format linked shop item image
      if (postObj.linkedShopItem && postObj.linkedShopItem.images && postObj.linkedShopItem.images.length > 0) {
        postObj.linkedShopItem.images = postObj.linkedShopItem.images.map(img => 
          `${req.protocol}://${req.get('host')}/${img}`
        );
      }

      // Format profile image
      if (postObj.creator && postObj.creator.profileImage) {
        postObj.creator.profileImage = `${req.protocol}://${req.get('host')}/${postObj.creator.profileImage}`;
      }

      return postObj;
    });

    res.json({
      success: true,
      count: posts.length,
      posts: formattedPosts
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

    // Format response data (similar to getPosts)
    const postObj = post.toObject();
    
    // Format content URLs
    if (postObj.content.type === 'image' && postObj.content.url) {
      postObj.content.url = `${req.protocol}://${req.get('host')}/${postObj.content.url}`;
    } else if (postObj.content.type === 'video') {
      if (postObj.content.url) {
        postObj.content.url = `${req.protocol}://${req.get('host')}/${postObj.content.url}`;
      }
      if (postObj.content.thumbnailUrl) {
        postObj.content.thumbnailUrl = `${req.protocol}://${req.get('host')}/${postObj.content.thumbnailUrl}`;
      }
    } else if (postObj.content.type === 'carousel' && postObj.content.items) {
      postObj.content.items = postObj.content.items.map(item => {
        if (item.url) {
          item.url = `${req.protocol}://${req.get('host')}/${item.url}`;
        }
        return item;
      });
    }

    // Format linked shop item image
    if (postObj.linkedShopItem && postObj.linkedShopItem.images && postObj.linkedShopItem.images.length > 0) {
      postObj.linkedShopItem.images = postObj.linkedShopItem.images.map(img => 
        `${req.protocol}://${req.get('host')}/${img}`
      );
    }

    // Format profile images
    if (postObj.creator && postObj.creator.profileImage) {
      postObj.creator.profileImage = `${req.protocol}://${req.get('host')}/${postObj.creator.profileImage}`;
    }
    
    // Format comment user profile images
    if (postObj.comments && postObj.comments.length > 0) {
      postObj.comments = postObj.comments.map(comment => {
        if (comment.user && comment.user.profileImage) {
          comment.user.profileImage = `${req.protocol}://${req.get('host')}/${comment.user.profileImage}`;
        }
        return comment;
      });
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
    const { caption, tags, linkedShopItem, contentType } = req.body;
    
    // Check for required files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image or video'
      });
    }

    // Process files based on content type
    let content = {};
    
    if (contentType === 'image' && req.files.length === 1) {
      // Single image post
      content = {
        type: 'image',
        url: req.files[0].path,
        aspectRatio: '1:1' // Default, can be calculated from actual image
      };
    } else if (contentType === 'video' && req.files.length === 1) {
      // Single video post
      content = {
        type: 'video',
        url: req.files[0].path,
        thumbnailUrl: req.files[0].path, // In a real app, generate a thumbnail
        aspectRatio: '16:9' // Default
      };
    } else if (req.files.length > 1) {
      // Carousel post with multiple items
      const items = req.files.map(file => {
        return {
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          url: file.path
        };
      });
      
      content = {
        type: 'carousel',
        items
      };
    }

    // Parse tags
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

    // Create new post
    const post = new Post({
      creator: req.user._id,
      content,
      caption,
      tags: parsedTags,
      linkedShopItem: linkedShopItem || null
    });

    const createdPost = await post.save();

    // Populate creator and shop item
    await createdPost.populate('creator', 'username profileImage');
    if (linkedShopItem) {
      await createdPost.populate('linkedShopItem', 'title price images');
    }

    // Format response data
    const postObj = createdPost.toObject();
    
    // Format content URLs
    if (postObj.content.type === 'image' && postObj.content.url) {
      postObj.content.url = `${req.protocol}://${req.get('host')}/${postObj.content.url}`;
    } else if (postObj.content.type === 'video') {
      if (postObj.content.url) {
        postObj.content.url = `${req.protocol}://${req.get('host')}/${postObj.content.url}`;
      }
      if (postObj.content.thumbnailUrl) {
        postObj.content.thumbnailUrl = `${req.protocol}://${req.get('host')}/${postObj.content.thumbnailUrl}`;
      }
    } else if (postObj.content.type === 'carousel' && postObj.content.items) {
      postObj.content.items = postObj.content.items.map(item => {
        if (item.url) {
          item.url = `${req.protocol}://${req.get('host')}/${item.url}`;
        }
        return item;
      });
    }

    // Format linked shop item image
    if (postObj.linkedShopItem && postObj.linkedShopItem.images && postObj.linkedShopItem.images.length > 0) {
      postObj.linkedShopItem.images = postObj.linkedShopItem.images.map(img => 
        `${req.protocol}://${req.get('host')}/${img}`
      );
    }

    // Format profile image
    if (postObj.creator && postObj.creator.profileImage) {
      postObj.creator.profileImage = `${req.protocol}://${req.get('host')}/${postObj.creator.profileImage}`;
    }

    res.status(201).json({
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
    if (caption) post.caption = caption;
    if (tags) post.tags = tags.split(',').map(tag => tag.trim());
    if (linkedShopItem) post.linkedShopItem = linkedShopItem;

    // Update content if new files are uploaded
    if (req.files && req.files.length > 0) {
      const contentType = req.body.contentType || post.content.type;
      
      // Delete old media files
      if (post.content.type === 'image' && post.content.url) {
        const fullPath = path.join(__dirname, '..', '..', post.content.url);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } else if (post.content.type === 'video') {
        if (post.content.url) {
          const fullPath = path.join(__dirname, '..', '..', post.content.url);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
        if (post.content.thumbnailUrl && post.content.thumbnailUrl !== post.content.url) {
          const fullPath = path.join(__dirname, '..', '..', post.content.thumbnailUrl);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      } else if (post.content.type === 'carousel' && post.content.items) {
        post.content.items.forEach(item => {
          if (item.url) {
            const fullPath = path.join(__dirname, '..', '..', item.url);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          }
        });
      }

      // Process new files
      if (contentType === 'image' && req.files.length === 1) {
        post.content = {
          type: 'image',
          url: req.files[0].path,
          aspectRatio: '1:1' // Default
        };
      } else if (contentType === 'video' && req.files.length === 1) {
        post.content = {
          type: 'video',
          url: req.files[0].path,
          thumbnailUrl: req.files[0].path, // In a real app, generate a thumbnail
          aspectRatio: '16:9' // Default
        };
      } else if (req.files.length > 1) {
        const items = req.files.map(file => {
          return {
            type: file.mimetype.startsWith('image/') ? 'image' : 'video',
            url: file.path
          };
        });
        
        post.content = {
          type: 'carousel',
          items
        };
      }
    }

    // Save updated post
    const updatedPost = await post.save();

    // Populate creator and shop item
    await updatedPost.populate('creator', 'username profileImage');
    if (updatedPost.linkedShopItem) {
      await updatedPost.populate('linkedShopItem', 'title price images');
    }

    // Format response data
    const postObj = updatedPost.toObject();
    
    // Format content URLs
    if (postObj.content.type === 'image' && postObj.content.url) {
      postObj.content.url = `${req.protocol}://${req.get('host')}/${postObj.content.url}`;
    } else if (postObj.content.type === 'video') {
      if (postObj.content.url) {
        postObj.content.url = `${req.protocol}://${req.get('host')}/${postObj.content.url}`;
      }
      if (postObj.content.thumbnailUrl) {
        postObj.content.thumbnailUrl = `${req.protocol}://${req.get('host')}/${postObj.content.thumbnailUrl}`;
      }
    } else if (postObj.content.type === 'carousel' && postObj.content.items) {
      postObj.content.items = postObj.content.items.map(item => {
        if (item.url) {
          item.url = `${req.protocol}://${req.get('host')}/${item.url}`;
        }
        return item;
      });
    }

    // Format linked shop item image
    if (postObj.linkedShopItem && postObj.linkedShopItem.images && postObj.linkedShopItem.images.length > 0) {
      postObj.linkedShopItem.images = postObj.linkedShopItem.images.map(img => 
        `${req.protocol}://${req.get('host')}/${img}`
      );
    }

    // Format profile image
    if (postObj.creator && postObj.creator.profileImage) {
      postObj.creator.profileImage = `${req.protocol}://${req.get('host')}/${postObj.creator.profileImage}`;
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

    // Delete media files
    if (post.content.type === 'image' && post.content.url) {
      const fullPath = path.join(__dirname, '..', '..', post.content.url);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } else if (post.content.type === 'video') {
      if (post.content.url) {
        const fullPath = path.join(__dirname, '..', '..', post.content.url);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      if (post.content.thumbnailUrl && post.content.thumbnailUrl !== post.content.url) {
        const fullPath = path.join(__dirname, '..', '..', post.content.thumbnailUrl);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } else if (post.content.type === 'carousel' && post.content.items) {
      post.content.items.forEach(item => {
        if (item.url) {
          const fullPath = path.join(__dirname, '..', '..', item.url);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      });
    }

    // Delete post
    await Post.findByIdAndDelete(req.params.id);

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

    // In a real-world application, you'd track which users have liked the post
    // For simplicity, we're just incrementing the like count here
    post.likes += 1;
    await post.save();

    res.json({
      success: true,
      message: 'Post liked successfully',
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

    // Add comment to post
    const comment = {
      user: req.user._id,
      text
    };

    post.comments.push(comment);
    await post.save();

    // Get the new comment with populated user
    const updatedPost = await Post.findById(req.params.id)
      .populate('comments.user', 'username profileImage');
    
    const newComment = updatedPost.comments[updatedPost.comments.length - 1];
    
    // Format user profile image
    const formattedComment = newComment.toObject();
    if (formattedComment.user && formattedComment.user.profileImage) {
      formattedComment.user.profileImage = `${req.protocol}://${req.get('host')}/${formattedComment.user.profileImage}`;
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: formattedComment
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

    // Find comment
    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the creator of the comment or the post
    const isCommentCreator = comment.user.toString() === req.user._id.toString();
    const isPostCreator = post.creator.toString() === req.user._id.toString();

    if (!isCommentCreator && !isPostCreator) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    // Remove comment
    comment.remove();
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