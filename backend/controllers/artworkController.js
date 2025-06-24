// backend/controllers/artworkController.js
const Artwork = require('../models/Artwork');
const User = require('../models/User');
// ✅ Updated to use Azure storage functions instead of local file system
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
      default:
        sortOptions = { createdAt: -1 };
    }

    const artworks = await Artwork.find(filter)
      .populate('creator', 'username profileImage isArtist')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const count = await Artwork.countDocuments(filter);
    const totalPages = Math.ceil(count / limit);

    // ✅ Images are now Azure URLs, no need to modify them
    const artworksWithFullImageUrls = artworks.map(artwork => {
      const artworkObj = artwork.toObject();
      // Images are already full Azure URLs from Azure blob storage
      return artworkObj;
    });

    res.json({
      success: true,
      artworks: artworksWithFullImageUrls,
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
      .populate('creator', 'username profileImage bio isArtist followers');

    if (!artwork) {
      return res.status(404).json({ 
        success: false, 
        message: 'Artwork not found' 
      });
    }

    const artworkObj = artwork.toObject();
    // ✅ Images are already Azure URLs, no need to modify them
    
    res.json({
      success: true,
      artwork: artworkObj
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
        message: 'No files uploaded'
      });
    }

    // ✅ Get Azure URLs from the uploaded files (added by uploadFilesToAzure middleware)
    const fileUrls = req.files.map(file => file.url);

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      filePaths: fileUrls  // ✅ Now returns Azure URLs instead of local paths
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a new artwork
// @route   POST /api/artworks
// @access  Private (Artists only)
const createArtwork = async (req, res) => {
  try {
    const {
      title,
      description,
      images,
      price,
      category,
      medium,
      dimensions,
      forSale,
      tags
    } = req.body;

    const artwork = new Artwork({
      title,
      description,
      images, // ✅ These are now Azure URLs
      price,
      category,
      medium,
      dimensions,
      creator: req.user._id,
      forSale,
      tags: tags && tags.length > 0 ? tags : []
    });

    const createdArtwork = await artwork.save();

    res.status(201).json({
      success: true,
      artwork: createdArtwork
    });
  } catch (error) {
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

    // Handle file uploads if present
    if (req.files && req.files.length > 0) {
      // ✅ Get Azure URLs from uploaded files
      const newImageUrls = req.files.map(file => file.url);
      
      // If replacing all images, remove old ones from Azure
      if (req.body.replaceImages === 'true') {
        // ✅ Delete old images from Azure blob storage
        for (const imageUrl of artwork.images) {
          await deleteFromAzure(imageUrl);
        }
        
        // Update with new images
        req.body.images = newImageUrls;
      } else {
        // Add new images to existing ones
        req.body.images = [...artwork.images, ...newImageUrls];
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

    const updatedArtwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true }
    );

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

    // ✅ Delete images from Azure blob storage instead of local filesystem
    for (const imageUrl of artwork.images) {
      try {
        await deleteFromAzure(imageUrl);
        console.log(`Successfully deleted image from Azure: ${imageUrl}`);
      } catch (deleteError) {
        console.log(`Warning: Could not delete image from Azure: ${imageUrl}`, deleteError);
        // Don't fail the deletion if we can't delete the image
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

module.exports = {
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  likeArtwork,
  uploadArtworkImages
};