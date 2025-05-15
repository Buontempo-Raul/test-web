// backend/routes/artworks.js
const express = require('express');
const router = express.Router();
const { 
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  likeArtwork,
  uploadArtworkImages
} = require('../controllers/artworkController');
const { protect, isArtist } = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Get all artworks
router.get('/', getArtworks);

// Get single artwork
router.get('/:id', getArtworkById);

// Create new artwork
router.post('/', protect, isArtist, createArtwork);

// Upload artwork images
router.post(
  '/upload', 
  protect, 
  isArtist, 
  uploadMiddleware.array('images', 5),
  uploadMiddleware.handleMulterError,
  uploadArtworkImages
);

// Update artwork
router.put('/:id', protect, updateArtwork);

// Update artwork with images
router.put(
  '/:id/upload',
  protect,
  uploadMiddleware.array('images', 5),
  uploadMiddleware.handleMulterError,
  updateArtwork
);

// Delete artwork
router.delete('/:id', protect, deleteArtwork);

// Like artwork
router.post('/:id/like', protect, likeArtwork);

module.exports = router;