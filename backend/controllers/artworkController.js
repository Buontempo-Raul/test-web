// backend/controllers/artworkController.js - Updated with post linking functionality
const Artwork = require('../models/Artwork');
const Post = require('../models/Post');
const User = require('../models/User');

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
      forSale,
      creator,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = {};

    if (category) query.category = category;
    if (forSale !== undefined) query.forSale = forSale === 'true';
    if (creator) query.creator = creator;

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
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
    const artwork = await Artwork.findById(req.params.id)
      .populate('creator', 'username profileImage isArtist bio website')
      .populate('linkedPosts', 'content caption createdAt likes comments creator')
      .populate({
        path: 'linkedPosts',
        populate: {
          path: 'creator',
          select: 'username profileImage'
        }
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create artwork
// @route   POST /api/artworks
// @access  Private (Artists only)
const createArtwork = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      medium,
      dimensions,
      tags,
      forSale = true,
      images,
      linkedPostIds = [], // NEW: Array of post IDs to link
      // Auction fields
      isAuction,
      auctionEndTime,
      startingPrice
    } = req.body;

    console.log('Creating artwork with data:', req.body);

    // Validate required fields
    if (!title || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, price, and category'
      });
    }

    if (!images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one image'
      });
    }

    // Validate linked posts belong to the artist
    if (linkedPostIds && linkedPostIds.length > 0) {
      const posts = await Post.find({
        _id: { $in: linkedPostIds },
        creator: req.user._id
      });

      if (posts.length !== linkedPostIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some selected posts do not belong to you or do not exist'
        });
      }
    }

    // Process tags
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags;
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }

    // Create artwork data
    const artworkData = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category,
      medium: medium || '',
      dimensions: dimensions || {},
      creator: req.user._id,
      forSale,
      images,
      tags: processedTags,
      linkedPosts: linkedPostIds || []
    };

    // Add auction data if it's an auction
    if (isAuction === 'true' || isAuction === true) {
      if (!auctionEndTime) {
        return res.status(400).json({
          success: false,
          message: 'Auction end time is required for auction items'
        });
      }

      const endTime = new Date(auctionEndTime);
      if (endTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Auction end time must be in the future'
        });
      }

      artworkData.auction = {
        endTime,
        startingPrice: parseFloat(startingPrice || price),
        isActive: true,
        bids: []
      };
    }

    console.log('Final artwork data:', artworkData);

    const artwork = new Artwork(artworkData);
    const savedArtwork = await artwork.save();

    // Update linked posts to reference this artwork
    if (linkedPostIds && linkedPostIds.length > 0) {
      await Post.updateMany(
        { _id: { $in: linkedPostIds } },
        { linkedShopItem: savedArtwork._id }
      );
    }

    // Populate the response
    const populatedArtwork = await Artwork.findById(savedArtwork._id)
      .populate('creator', 'username profileImage isArtist')
      .populate('linkedPosts', 'content caption createdAt');

    res.status(201).json({
      success: true,
      message: isAuction ? 'Artwork created successfully with auction' : 'Artwork created successfully',
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

    // Don't allow updates to artworks with active auctions that have bids
    if (artwork.auction && artwork.auction.isActive && artwork.auction.bids.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update artwork with active bids'
      });
    }

    const { linkedPostIds } = req.body;

    // Validate linked posts if provided
    if (linkedPostIds && linkedPostIds.length > 0) {
      const posts = await Post.find({
        _id: { $in: linkedPostIds },
        creator: req.user._id
      });

      if (posts.length !== linkedPostIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some selected posts do not belong to you or do not exist'
        });
      }
    }

    // Update fields
    const updatedFields = {
      title: req.body.title || artwork.title,
      description: req.body.description || artwork.description,
      price: req.body.price !== undefined ? req.body.price : artwork.price,
      category: req.body.category || artwork.category,
      medium: req.body.medium || artwork.medium,
      dimensions: req.body.dimensions || artwork.dimensions,
      forSale: req.body.forSale !== undefined ? req.body.forSale : artwork.forSale,
      tags: req.body.tags || artwork.tags
    };

    // Add images if they were updated
    if (req.body.images) {
      updatedFields.images = req.body.images;
    }

    // Handle linked posts update
    if (linkedPostIds !== undefined) {
      // Remove this artwork from previously linked posts
      await Post.updateMany(
        { linkedShopItem: artwork._id },
        { $unset: { linkedShopItem: 1 } }
      );

      // Add this artwork to newly linked posts
      if (linkedPostIds.length > 0) {
        await Post.updateMany(
          { _id: { $in: linkedPostIds } },
          { linkedShopItem: artwork._id }
        );
      }

      updatedFields.linkedPosts = linkedPostIds;
    }

    // Update auction starting price if price changed and no bids yet
    if (req.body.price && artwork.auction && artwork.auction.bids.length === 0) {
      updatedFields['auction.startingPrice'] = parseFloat(req.body.price);
    }

    const updatedArtwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true }
    ).populate('creator', 'username profileImage isArtist')
     .populate('linkedPosts', 'content caption createdAt');

    res.json({
      success: true,
      artwork: updatedArtwork
    });
  } catch (error) {
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

    // Don't allow deletion of artworks with active auctions that have bids
    if (artwork.auction && artwork.auction.isActive && artwork.auction.bids.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete artwork with active bids'
      });
    }

    // Remove artwork reference from linked posts
    await Post.updateMany(
      { linkedShopItem: artwork._id },
      { $unset: { linkedShopItem: 1 } }
    );

    await artwork.deleteOne();

    res.json({
      success: true,
      message: 'Artwork deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like/Unlike artwork
// @route   POST /api/artworks/:id/like
// @access  Private
const likeArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    // For now, just increment likes (you can add user tracking later)
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

// @desc    Upload artwork images
// @route   POST /api/artworks/upload
// @access  Private (Artists only)
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

// @desc    Get user's posts (for linking to artworks)
// @route   GET /api/artworks/user-posts
// @access  Private (Artists only)
const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ creator: req.user._id })
      .select('_id content caption createdAt linkedShopItem')
      .sort({ createdAt: -1 })
      .populate('linkedShopItem', 'title');

    res.json({
      success: true,
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
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  likeArtwork,
  uploadArtworkImages
};