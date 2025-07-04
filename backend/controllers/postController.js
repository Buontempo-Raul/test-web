// backend/controllers/postController.js - FIXED: Following Only Filter
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

    // FIXED: Following filter - only show posts from people the user follows, NOT their own posts
    if (followingOnly === 'true' && req.user) {
      const user = await User.findById(req.user._id);
      
      // If user follows nobody, return empty results
      if (!user.following || user.following.length === 0) {
        return res.json({
          success: true,
          count: 0,
          pages: 0,
          currentPage: 1,
          hasMore: false,
          posts: []
        });
      }
      
      // Only include posts from people the user follows (exclude own posts)
      query.creator = { $in: user.following };
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
        .populate('linkedShopItems', 'title price images') // UPDATED: Multiple artworks
        .populate({
          path: 'comments',
          populate: {
            path: 'user',
            select: 'username profileImage'
          }
        });

      hasMore = posts.length === pageSize;
    } else {
      currentPage = parseInt(page) || 1;
      const skip = (currentPage - 1) * pageSize;

      count = await Post.countDocuments(query);
      pages = Math.ceil(count / pageSize);

      posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('creator', 'username profileImage')
        .populate('linkedShopItems', 'title price images') // UPDATED: Multiple artworks
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

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    console.log('Creating post with data:', req.body);
    console.log('Files uploaded:', req.files?.length || 0);
    console.log('Azure URLs:', req.azureUrls);

    const { caption, tags, linkedShopItems } = req.body;

    // Validate required fields
    if (!caption) {
      return res.status(400).json({
        success: false,
        message: 'Caption is required'
      });
    }

    // Parse tags if they're provided as a string
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = Array.isArray(tags) ? tags : [tags];
      }
    }

    // Parse linked shop items if provided
    let parsedLinkedItems = [];
    if (linkedShopItems) {
      try {
        parsedLinkedItems = typeof linkedShopItems === 'string' 
          ? JSON.parse(linkedShopItems) 
          : linkedShopItems;
      } catch (e) {
        console.error('Error parsing linkedShopItems:', e);
        parsedLinkedItems = [];
      }
    }

    // Use Azure URLs if available, otherwise use local paths
    const mediaUrls = req.azureUrls || (req.files ? req.files.map(file => file.path) : []);

    const postData = {
      creator: req.user._id,
      caption,
      images: mediaUrls,
      tags: parsedTags,
      linkedShopItems: parsedLinkedItems.length > 0 ? parsedLinkedItems : undefined
    };

    console.log('Final post data:', postData);

    const post = await Post.create(postData);

    // Update linked artworks with this post reference
    if (parsedLinkedItems.length > 0) {
      await Artwork.updateMany(
        { _id: { $in: parsedLinkedItems } },
        { $push: { linkedPosts: post._id } }
      );
    }

    // Populate the post before returning
    const populatedPost = await Post.findById(post._id)
      .populate('creator', 'username profileImage')
      .populate('linkedShopItems', 'title price images description category');

    res.status(201).json({
      success: true,
      post: populatedPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
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

    // Check if user owns the post
    if (post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    const { caption, tags, linkedShopItems } = req.body;

    // Parse tags if they're provided as a string
    let parsedTags = post.tags;
    if (tags !== undefined) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = Array.isArray(tags) ? tags : [tags];
      }
    }

    // Parse linked shop items if provided
    let parsedLinkedItems = post.linkedShopItems || [];
    if (linkedShopItems !== undefined) {
      try {
        parsedLinkedItems = typeof linkedShopItems === 'string' 
          ? JSON.parse(linkedShopItems) 
          : linkedShopItems;
      } catch (e) {
        console.error('Error parsing linkedShopItems:', e);
        parsedLinkedItems = [];
      }
    }

    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        caption: caption || post.caption,
        tags: parsedTags,
        linkedShopItems: parsedLinkedItems.length > 0 ? parsedLinkedItems : undefined
      },
      { new: true }
    )
      .populate('creator', 'username profileImage')
      .populate('linkedShopItems', 'title price images description category')
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

    // Check if user owns the post
    if (post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

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

// @desc    Get a single post
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('creator', 'username profileImage')
      .populate('linkedShopItems', 'title price images description category') // UPDATED: Multiple artworks
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
      .populate('linkedShopItems', 'title price images') // UPDATED: Multiple artworks
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profileImage'
        }
      });

    const pages = Math.ceil(count / pageSize);

    res.json({
      success: true,
      count,
      pages,
      currentPage: parseInt(page),
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like/unlike a post
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

    const userIndex = post.likedBy.indexOf(req.user._id);

    if (userIndex === -1) {
      // User hasn't liked the post, so add like
      post.likedBy.push(req.user._id);
      post.likes = post.likedBy.length;
      await post.save();

      res.json({
        success: true,
        message: 'Post liked',
        likes: post.likes,
        isLiked: true
      });
    } else {
      // User has already liked the post, so remove like
      post.likedBy.splice(userIndex, 1);
      post.likes = post.likedBy.length;
      await post.save();

      res.json({
        success: true,
        message: 'Post unliked',
        likes: post.likes,
        isLiked: false
      });
    }
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

    if (!text || text.trim().length === 0) {
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

    const newComment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Populate the new comment
    await post.populate({
      path: 'comments.user',
      select: 'username profileImage'
    });

    const addedComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: addedComment
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

    // Check if user owns the comment or the post
    if (comment.user.toString() !== req.user._id.toString() && 
        post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments or comments on your posts'
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