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
// ✅ Updated to use Azure storage middleware instead of local upload middleware
const { uploadArtworkImages: uploadMiddleware, uploadFilesToAzure } = require('../middleware/azureStorageMiddleware');

// Get all artworks
router.get('/', getArtworks);

// Get single artwork
router.get('/:id', getArtworkById);

// Create new artwork
router.post('/', protect, isArtist, createArtwork);

// ✅ Updated artwork image upload route to use Azure storage
router.post(
  '/upload', 
  protect, 
  isArtist, 
  uploadMiddleware.array('images', 5),        // Parse files with multer (memory storage)
  uploadFilesToAzure('artworks'),             // Upload to Azure artworks container
  uploadArtworkImages                         // Process the upload response
);

// Update artwork
router.put('/:id', protect, updateArtwork);

// ✅ Updated artwork update with images route to use Azure storage
router.put(
  '/:id/upload',
  protect,
  uploadMiddleware.array('images', 5),        // Parse files with multer (memory storage)
  uploadFilesToAzure('artworks'),             // Upload to Azure artworks container
  updateArtwork
);

// Delete artwork
router.delete('/:id', protect, deleteArtwork);

// Like artwork
router.post('/:id/like', protect, likeArtwork);

module.exports = router;