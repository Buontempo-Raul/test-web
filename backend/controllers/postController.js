// backend/controllers/postController.js - Updated with artwork linking functionality
const Post = require('../models/Post');
const Artwork = require('../models/Artwork');
const User = require('../models/User');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public (pagination friendly)
const getPosts = async (req, res) => {
  try {
    const {
      page,
      limit = 10,
      tag,
      search,
      followingOnly,
      before, // cursor for pagination
      creator
    } = req.query;

    const pageSize = Math.min(parseInt(limit), 50); // Max 50 posts per request
    let query = {};

    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Filter by creator
    if (creator) {
      query.creator = creator;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { caption: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Following filter (requires authentication)
    if (followingOnly === 'true' && req.user) {
      const user = await User.findById(req.user._id);
      query.creator = { $in: [...user.following, req.user._id] };
    }

    let posts;
    let count = 0;
    let pages = 0;
    let currentPage = 1;
    let hasMore = false;

    // Cursor-based pagination for better performance
    if (before) {
      query.createdAt = { $lt: new Date(before) };
      
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
      .populate('linkedShopItem', 'title price images description category')
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

    const postObj = post.toObject();
    if (req.user) {
      postObj.isLikedByCurrentUser = post.likedBy.includes(req.user._id);
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

// @desc    Get posts by user
// @route   GET /api/posts/user/:userId
// @access  Public
const getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageSize = parseInt(limit);
    const skip = (parseInt(page) - 1) * pageSize;

    const userId = req.params.userId;

    const count = await Post.countDocuments({ creator: userId });
    const posts = await Post.find({ creator: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('creator', 'username profileImage')
      .populate('linkedShopItem', 'title price images');

    const pages = Math.ceil(count / pageSize);

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
      currentPage: parseInt(page),
      posts: postsWithLikeStatus
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
    console.log('Creating post with body:', req.body);
    console.log('Files received:', req.files?.length || 0);

    const { caption, tags, linkedShopItem } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one media file is required'
      });
    }

    // Validate linked shop item if provided
    if (linkedShopItem) {
      const artwork = await Artwork.findOne({
        _id: linkedShopItem,
        creator: req.user._id
      });

      if (!artwork) {
        return res.status(400).json({
          success: false,
          message: 'Selected artwork not found or does not belong to you'
        });
      }
    }

    // Process content based on number of files
    let content;
    if (files.length === 1) {
      const file = files[0];
      console.log('Single file:', file.originalname, file.mimetype);
      content = {
        type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        url: file.url || file.location || `/uploads/posts/${file.filename}`,
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

    // If linked to an artwork, add this post to the artwork's linkedPosts array
    if (linkedShopItem) {
      await Artwork.findByIdAndUpdate(
        linkedShopItem,
        { $addToSet: { linkedPosts: savedPost._id } }
      );
    }

    // Populate creator info for response
    await savedPost.populate('creator', 'username profileImage');
    await savedPost.populate('linkedShopItem', 'title price images');

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
    const { caption, tags, linkedShopItem } = req.body;
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

    // Validate linked shop item if provided
    if (linkedShopItem) {
      const artwork = await Artwork.findOne({
        _id: linkedShopItem,
        creator: req.user._id
      });

      if (!artwork) {
        return res.status(400).json({
          success: false,
          message: 'Selected artwork not found or does not belong to you'
        });
      }
    }

    // Handle linked shop item changes
    const oldLinkedShopItem = post.linkedShopItem;
    
    // Remove post from old linked artwork
    if (oldLinkedShopItem && oldLinkedShopItem.toString() !== linkedShopItem) {
      await Artwork.findByIdAndUpdate(
        oldLinkedShopItem,
        { $pull: { linkedPosts: post._id } }
      );
    }

    // Add post to new linked artwork
    if (linkedShopItem && linkedShopItem !== oldLinkedShopItem?.toString()) {
      await Artwork.findByIdAndUpdate(
        linkedShopItem,
        { $addToSet: { linkedPosts: post._id } }
      );
    }

    post.caption = caption || post.caption;
    post.linkedShopItem = linkedShopItem || null;
    
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

    // Remove post reference from linked artwork
    if (post.linkedShopItem) {
      await Artwork.findByIdAndUpdate(
        post.linkedShopItem,
        { $pull: { linkedPosts: post._id } }
      );
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

// @desc    Add comment to post
// @route   POST /api/posts/:id/comment
// @access  Private
const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate the new comment for response
    const updatedPost = await Post.findById(post._id)
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profileImage'
        }
      });

    const newComment = updatedPost.comments[updatedPost.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete comment from post
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

    // Check if user is comment author or post author
    if (comment.user.toString() !== req.user._id.toString() && 
        post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
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

// @desc    Get user's artworks (for linking to posts)
// @route   GET /api/posts/user/artworks
// @access  Private (Artists only)
const getUserArtworks = async (req, res) => {
  try {
    console.log('Getting artworks for user:', req.user._id);
    
    const artworks = await Artwork.find({ 
      creator: req.user._id,
      forSale: true 
    })
      .select('_id title price images linkedPosts')
      .sort({ createdAt: -1 });

    console.log('Found artworks:', artworks.length);

    res.json({
      success: true,
      artworks
    });
  } catch (error) {
    console.error('Error fetching user artworks:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getPosts,
  getPostById,
  getUserPosts,
  createPost,
  updatePost,
  deletePost,
  likePost,
  commentOnPost,
  deleteComment,
  getUserArtworks
};