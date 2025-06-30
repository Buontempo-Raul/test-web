// backend/controllers/artworkController.js - FIXED VERSION with proper bidirectional linking

const Artwork = require('../models/Artwork');
const Post = require('../models/Post');

// @desc    Create artwork
// @route   POST /api/artworks
// @access  Private (Artists only)
const createArtwork = async (req, res) => {
  try {
    const { linkedPostIds, ...artworkData } = req.body;

    // Create artwork with all required fields
    const artwork = new Artwork({
      ...artworkData,
      creator: req.user._id,
      linkedPosts: linkedPostIds || []
    });

    // Save the artwork first
    const savedArtwork = await artwork.save();

    // 🔧 FIXED: If linking to existing posts, update those posts bidirectionally
    if (linkedPostIds && linkedPostIds.length > 0) {
      console.log('Linking artwork to existing posts:', linkedPostIds);
      
      // Validate posts exist and belong to user
      const validPosts = await Post.find({
        _id: { $in: linkedPostIds },
        creator: req.user._id
      });

      if (validPosts.length !== linkedPostIds.length) {
        // Rollback artwork creation
        await Artwork.findByIdAndDelete(savedArtwork._id);
        return res.status(400).json({
          success: false,
          message: 'Some selected posts do not exist or do not belong to you'
        });
      }

      // Add this artwork to the posts' linkedShopItems arrays
      await Post.updateMany(
        { _id: { $in: linkedPostIds } },
        { $addToSet: { linkedShopItems: savedArtwork._id } }
      );

      console.log(`Added artwork ${savedArtwork._id} to ${linkedPostIds.length} posts`);
    }

    // Populate the response
    const populatedArtwork = await Artwork.findById(savedArtwork._id)
      .populate('creator', 'username profileImage isArtist')
      .populate('linkedPosts', 'content caption createdAt creator');

    res.status(201).json({
      success: true,
      message: 'Artwork created successfully',
      artwork: populatedArtwork
    });
  } catch (error) {
    console.error('Error creating artwork:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update artwork
// @route   PUT /api/artworks/:id
// @access  Private (Artwork creator only)
const updateArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ 
        success: false, 
        message: 'Artwork not found' 
      });
    }

    // Check if user is artwork creator
    if (artwork.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this artwork' 
      });
    }

    const { linkedPostIds, ...updateData } = req.body;

    // 🔧 FIXED: Handle linked posts update with proper bidirectional sync
    if (linkedPostIds !== undefined) {
      console.log('Updating linked posts for artwork:', req.params.id);
      console.log('Old linked posts:', artwork.linkedPosts);
      console.log('New linked posts:', linkedPostIds);

      // Validate new posts exist and belong to user
      if (linkedPostIds.length > 0) {
        const validPosts = await Post.find({
          _id: { $in: linkedPostIds },
          creator: req.user._id
        });

        if (validPosts.length !== linkedPostIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Some selected posts do not exist or do not belong to you'
          });
        }
      }

      // Get old linked posts
      const oldLinkedPosts = artwork.linkedPosts || [];
      const newLinkedPosts = linkedPostIds || [];

      // Remove artwork from posts that are no longer linked
      const postsToUnlink = oldLinkedPosts.filter(postId => 
        !newLinkedPosts.includes(postId.toString())
      );

      if (postsToUnlink.length > 0) {
        await Post.updateMany(
          { _id: { $in: postsToUnlink } },
          { 
            $pull: { linkedShopItems: artwork._id },
            $unset: { linkedShopItem: 1 } // Remove legacy field too
          }
        );
        console.log(`Removed artwork from ${postsToUnlink.length} posts`);
      }

      // Add artwork to newly linked posts
      const postsToLink = newLinkedPosts.filter(postId => 
        !oldLinkedPosts.some(oldId => oldId.toString() === postId)
      );

      if (postsToLink.length > 0) {
        await Post.updateMany(
          { _id: { $in: postsToLink } },
          { $addToSet: { linkedShopItems: artwork._id } }
        );
        console.log(`Added artwork to ${postsToLink.length} posts`);
      }

      // Update artwork's linkedPosts
      updateData.linkedPosts = newLinkedPosts;
    }

    // Update the artwork
    const updatedArtwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('creator', 'username profileImage isArtist')
     .populate('linkedPosts', 'content caption createdAt creator');

    res.json({
      success: true,
      artwork: updatedArtwork
    });
  } catch (error) {
    console.error('Error updating artwork:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete artwork
// @route   DELETE /api/artworks/:id
// @access  Private (Artwork creator only)
const deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ 
        success: false, 
        message: 'Artwork not found' 
      });
    }

    // Check if user is artwork creator
    if (artwork.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this artwork' 
      });
    }

    // 🔧 FIXED: Remove artwork reference from all linked posts using both old and new formats
    if (artwork.linkedPosts && artwork.linkedPosts.length > 0) {
      await Post.updateMany(
        { _id: { $in: artwork.linkedPosts } },
        { 
          $pull: { linkedShopItems: artwork._id },
          $unset: { linkedShopItem: 1 } // Also remove legacy single reference
        }
      );
      console.log(`Removed artwork ${artwork._id} from ${artwork.linkedPosts.length} posts`);
    }

    await artwork.deleteOne();

    res.json({
      success: true,
      message: 'Artwork deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single artwork
// @route   GET /api/artworks/:id
// @access  Public
const getArtworkById = async (req, res) => {
  try {
    // 🔧 FIXED: Add validation for artwork ID
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid artwork ID'
      });
    }

    const artwork = await Artwork.findById(req.params.id)
      .populate('creator', 'username profileImage isArtist bio website')
      .populate({
        path: 'linkedPosts',
        populate: {
          path: 'creator',
          select: 'username profileImage'
        },
        select: 'content caption createdAt likes comments creator'
      });

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    // Increment view count
    artwork.views += 1;
    await artwork.save();

    res.json({
      success: true,
      artwork
    });
  } catch (error) {
    console.error('Error fetching artwork:', error);
    
    // Handle specific MongoDB casting errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid artwork ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all artworks
// @route   GET /api/artworks
// @access  Public
const getArtworks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = { forSale: true, isSold: false };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sort]: sortOrder };

    const total = await Artwork.countDocuments(query);
    const artworks = await Artwork.find(query)
      .populate('creator', 'username profileImage isArtist')
      .populate('linkedPosts', 'content caption createdAt') // Include linked posts
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      artworks,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalArtworks: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Keep existing functions (likeArtwork, uploadArtworkImages, getUserPosts) unchanged
const likeArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    artwork.likes += 1;
    await artwork.save();

    res.json({
      success: true,
      likes: artwork.likes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const uploadArtworkImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const imageUrls = req.files.map(file => file.url || file.location || `/uploads/artworks/${file.filename}`);

    res.json({
      success: true,
      images: imageUrls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getUserPosts = async (req, res) => {
  try {
    console.log('=== getUserPosts called ===');
    console.log('User ID:', req.user._id);
    
    const posts = await Post.find({ creator: req.user._id })
      .select('_id content caption createdAt linkedShopItems linkedShopItem')
      .sort({ createdAt: -1 })
      .populate('linkedShopItems', 'title price currentBid')
      .populate('linkedShopItem', 'title price currentBid');

    console.log('Posts found:', posts.length);

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  likeArtwork,
  uploadArtworkImages,
  getUserPosts
};