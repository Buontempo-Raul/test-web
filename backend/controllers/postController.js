// backend/controllers/postController.js - Updated with multiple artwork linking
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
    console.log('Creating post with body:', req.body);
    console.log('Files received:', req.files?.length || 0);

    const { caption, tags, linkedShopItems } = req.body; // UPDATED: Multiple artworks
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one media file is required'
      });
    }

    // UPDATED: Validate multiple linked artworks if provided
    let artworkIds = [];
    if (linkedShopItems) {
      // Handle both string and array formats
      if (typeof linkedShopItems === 'string') {
        try {
          artworkIds = JSON.parse(linkedShopItems);
        } catch {
          artworkIds = [linkedShopItems]; // Single ID as string
        }
      } else if (Array.isArray(linkedShopItems)) {
        artworkIds = linkedShopItems;
      }

      // Validate that all artworks exist and belong to the user
      if (artworkIds.length > 0) {
        const artworks = await Artwork.find({
          _id: { $in: artworkIds },
          creator: req.user._id
        });

        if (artworks.length !== artworkIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Some selected artworks not found or do not belong to you'
          });
        }
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
      linkedShopItems: artworkIds || [] // UPDATED: Multiple artworks
    });

    const savedPost = await post.save();
    console.log('Post saved:', savedPost._id);

    // UPDATED: Add this post to all linked artworks' linkedPosts arrays
    if (artworkIds.length > 0) {
      await Artwork.updateMany(
        { _id: { $in: artworkIds } },
        { $addToSet: { linkedPosts: savedPost._id } }
      );
    }

    // Populate creator info and linked artworks for response
    await savedPost.populate('creator', 'username profileImage');
    await savedPost.populate('linkedShopItems', 'title price images'); // UPDATED: Multiple artworks

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
    const { caption, tags, linkedShopItems } = req.body; // UPDATED: Multiple artworks
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

    // UPDATED: Validate multiple linked artworks if provided
    let artworkIds = [];
    if (linkedShopItems !== undefined) {
      if (Array.isArray(linkedShopItems)) {
        artworkIds = linkedShopItems;
      } else if (typeof linkedShopItems === 'string' && linkedShopItems) {
        artworkIds = [linkedShopItems];
      }

      // Validate that all artworks exist and belong to the user
      if (artworkIds.length > 0) {
        const artworks = await Artwork.find({
          _id: { $in: artworkIds },
          creator: req.user._id
        });

        if (artworks.length !== artworkIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Some selected artworks not found or do not belong to you'
          });
        }
      }

      // UPDATED: Handle linked artworks changes
      const oldLinkedArtworks = post.linkedShopItems || [];
      
      // Remove post from previously linked artworks
      if (oldLinkedArtworks.length > 0) {
        await Artwork.updateMany(
          { _id: { $in: oldLinkedArtworks } },
          { $pull: { linkedPosts: post._id } }
        );
      }

      // Add post to newly linked artworks
      if (artworkIds.length > 0) {
        await Artwork.updateMany(
          { _id: { $in: artworkIds } },
          { $addToSet: { linkedPosts: post._id } }
        );
      }

      post.linkedShopItems = artworkIds;
    }

    // Update other fields
    post.caption = caption || post.caption;
    
    if (tags) {
      post.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('creator', 'username profileImage')
      .populate('linkedShopItems', 'title price images'); // UPDATED: Multiple artworks

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

    // UPDATED: Remove post reference from all linked artworks
    if (post.linkedShopItems && post.linkedShopItems.length > 0) {
      await Artwork.updateMany(
        { _id: { $in: post.linkedShopItems } },
        { $pull: { linkedPosts: post._id } }
      );
    }

    // Handle legacy single linkedShopItem for backward compatibility
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
      .populate('linkedShopItems', 'title price images'); // UPDATED: Multiple artworks

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
      text: text.trim()
    };

    post.comments.push(comment);
    await post.save();

    // Populate the new comment with user info
    const populatedPost = await Post.findById(post._id)
      .populate({
        path: 'comments.user',
        select: 'username profileImage'
      });

    const newComment = populatedPost.comments[populatedPost.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: newComment
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