// backend/controllers/artworkController.js - Updated with auction support
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const { deleteFromAzure } = require('../middleware/azureStorageMiddleware');

// @desc    Get all artworks with filtering and pagination
// @route   GET /api/artworks
// @access  Public
const getArtworks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};
    
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }
    
    if (req.query.forSale !== undefined) {
      filter.forSale = req.query.forSale === 'true';
    }
    
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    // Price filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Sort options
    let sortOptions = {};
    switch (req.query.sort) {
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'popular':
        sortOptions = { likes: -1 };
        break;
      case 'ending_soon':
        sortOptions = { 'auction.endTime': 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const artworks = await Artwork.find(filter)
      .populate('creator', 'username profileImage isArtist')
      .populate('auction.highestBidder', 'username')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const count = await Artwork.countDocuments(filter);
    const totalPages = Math.ceil(count / limit);

    // Process artworks to include auction status
    const artworksWithAuctionInfo = artworks.map(artwork => {
      const artworkObj = artwork.toObject();
      
      // Add computed auction fields
      if (artworkObj.auction) {
        const now = new Date();
        const endTime = new Date(artworkObj.auction.endTime);
        const isExpired = now > endTime;
        
        artworkObj.auctionStatus = isExpired ? 'ended' : (artworkObj.auction.isActive ? 'active' : 'inactive');
        artworkObj.timeRemaining = artwork.timeRemaining;
        artworkObj.nextMinimumBid = artworkObj.auction.currentBid 
          ? artworkObj.auction.currentBid + (artworkObj.auction.minimumIncrement || 5)
          : artworkObj.auction.startingPrice + (artworkObj.auction.minimumIncrement || 5);
      }
      
      return artworkObj;
    });

    res.json({
      success: true,
      artworks: artworksWithAuctionInfo,
      pagination: {
        currentPage: page,
        totalPages,
        count,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
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

// @desc    Get single artwork by ID
// @route   GET /api/artworks/:id
// @access  Public
const getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('creator', 'username profileImage bio isArtist followers')
      .populate('auction.bids.bidder', 'username')
      .populate('auction.highestBidder', 'username');

    if (!artwork) {
      return res.status(404).json({ 
        success: false, 
        message: 'Artwork not found' 
      });
    }

    // Increment view count
    artwork.views += 1;
    await artwork.save();

    const artworkObj = artwork.toObject();
    
    // Add computed auction fields
    if (artworkObj.auction) {
      const now = new Date();
      const endTime = new Date(artworkObj.auction.endTime);
      const isExpired = now > endTime;
      
      // If auction expired but still active, end it
      if (isExpired && artwork.auction.isActive) {
        await artwork.endAuction();
        await artwork.populate('auction.winner', 'username');
      }
      
      artworkObj.auctionStatus = isExpired ? 'ended' : (artworkObj.auction.isActive ? 'active' : 'inactive');
      artworkObj.timeRemaining = artwork.timeRemaining;
      artworkObj.nextMinimumBid = artworkObj.auction.currentBid 
        ? artworkObj.auction.currentBid + (artworkObj.auction.minimumIncrement || 5)
        : artworkObj.auction.startingPrice + (artworkObj.auction.minimumIncrement || 5);
        
      // Format bid history for response
      if (artworkObj.auction.bids) {
        artworkObj.auction.bids = artworkObj.auction.bids.slice(0, 10).map(bid => ({
          id: bid._id,
          amount: bid.amount,
          bidder: {
            username: bid.bidder.username,
            _id: bid.bidder._id
          },
          timestamp: bid.timestamp
        }));
      }
    }

    res.json({
      success: true,
      artwork: artworkObj
    });
  } catch (error) {
    console.error('Error fetching artwork:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new artwork with auction
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
      images,
      auctionDuration = 7 // days
    } = req.body;

    // Validate required fields
    if (!title || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, price, and category are required'
      });
    }

    if (!images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    // Check if user is an artist
    if (!req.user.isArtist) {
      return res.status(403).json({
        success: false,
        message: 'Only artists can create artworks'
      });
    }

    // Create auction end time
    const auctionEndTime = new Date();
    auctionEndTime.setDate(auctionEndTime.getDate() + parseInt(auctionDuration));

    const artwork = new Artwork({
      title,
      description,
      price: parseFloat(price),
      category,
      medium,
      dimensions,
      tags: tags || [],
      images,
      creator: req.user._id,
      auction: {
        startTime: new Date(),
        endTime: auctionEndTime,
        startingPrice: parseFloat(price),
        minimumIncrement: 5,
        isActive: true,
        bids: []
      }
    });

    const savedArtwork = await artwork.save();
    
    // Populate creator info
    await savedArtwork.populate('creator', 'username profileImage isArtist');

    res.status(201).json({
      success: true,
      artwork: savedArtwork,
      message: 'Artwork created successfully with auction'
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

    // Update auction starting price if price changed and no bids yet
    if (req.body.price && artwork.auction && artwork.auction.bids.length === 0) {
      updatedFields['auction.startingPrice'] = parseFloat(req.body.price);
    }

    const updatedArtwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true }
    ).populate('creator', 'username profileImage isArtist');

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

    // Delete images from Azure blob storage
    for (const imageUrl of artwork.images) {
      try {
        await deleteFromAzure(imageUrl);
        console.log(`Successfully deleted image from Azure: ${imageUrl}`);
      } catch (deleteError) {
        console.log(`Warning: Could not delete image from Azure: ${imageUrl}`, deleteError);
      }
    }

    await artwork.deleteOne();

    res.json({
      success: true,
      message: 'Artwork removed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like an artwork
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

    // Increment likes
    artwork.likes += 1;
    await artwork.save();

    res.json({
      success: true,
      message: 'Artwork liked',
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
    if (!req.user.isArtist) {
      return res.status(403).json({
        success: false,
        message: 'Only artists can upload artwork images'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    // Image URLs are already processed by Azure middleware
    const imageUrls = req.files.map(file => file.location);

    res.json({
      success: true,
      images: imageUrls,
      message: 'Images uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading images:', error);
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