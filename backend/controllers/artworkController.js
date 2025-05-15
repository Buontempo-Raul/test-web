// backend/controllers/artworkController.js
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Get all artworks
// @route   GET /api/artworks
// @access  Public
const getArtworks = async (req, res) => {
  try {
    const { category, price, sortBy, limit = 10, page = 1 } = req.query;
    const query = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by price range
    if (price) {
      const [min, max] = price.split('-');
      query.price = { $gte: parseInt(min) || 0 };
      if (max) {
        query.price.$lte = parseInt(max);
      }
    }

    // Only show artworks for sale
    query.forSale = true;
    query.isSold = false;

    // Count documents
    const count = await Artwork.countDocuments(query);

    // Sorting
    let sort = {};
    if (sortBy === 'price-asc') {
      sort = { price: 1 };
    } else if (sortBy === 'price-desc') {
      sort = { price: -1 };
    } else if (sortBy === 'latest') {
      sort = { createdAt: -1 };
    } else if (sortBy === 'popular') {
      sort = { views: -1 };
    } else {
      // Default sorting by latest
      sort = { createdAt: -1 };
    }

    // Pagination
    const pageSize = parseInt(limit);
    const pageNumber = parseInt(page);
    const skip = (pageNumber - 1) * pageSize;

    const artworks = await Artwork.find(query)
      .sort(sort)
      .limit(pageSize)
      .skip(skip)
      .populate('creator', 'username profileImage');

    // Generate full URLs for images
    const artworksWithImageUrls = artworks.map(artwork => {
      const artworkObj = artwork.toObject();
      artworkObj.images = artwork.images.map(image => {
        return `${req.protocol}://${req.get('host')}/${image}`;
      });
      return artworkObj;
    });

    res.json({
      success: true,
      count,
      pages: Math.ceil(count / pageSize),
      currentPage: pageNumber,
      artworks: artworksWithImageUrls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get artwork by ID
// @route   GET /api/artworks/:id
// @access  Public
const getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('creator', 'username profileImage bio isArtist');

    if (!artwork) {
      return res.status(404).json({ 
        success: false, 
        message: 'Artwork not found' 
      });
    }

    // Increment view count
    artwork.views += 1;
    await artwork.save();

    // Generate full URLs for images
    const artworkObj = artwork.toObject();
    artworkObj.images = artwork.images.map(image => {
      return `${req.protocol}://${req.get('host')}/${image}`;
    });

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

    // Get file paths
    const filePaths = req.files.map(file => file.path);

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      filePaths: filePaths
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
      images,
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
      // Get file paths
      const newImages = req.files.map(file => file.path);
      
      // If replacing all images, remove old ones
      if (req.body.replaceImages === 'true') {
        // Delete old image files
        artwork.images.forEach(imagePath => {
          const fullPath = path.join(__dirname, '..', '..', imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        });
        
        // Update with new images
        req.body.images = newImages;
      } else {
        // Add new images to existing ones
        req.body.images = [...artwork.images, ...newImages];
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

    // Delete image files
    artwork.images.forEach(imagePath => {
      const fullPath = path.join(__dirname, '..', '..', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

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