// backend/middleware/azureStorageMiddleware.js
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

// Azure Storage configuration
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

// Get container clients
const imagesContainer = blobServiceClient.getContainerClient('images');
const postsContainer = blobServiceClient.getContainerClient('posts');

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// Create upload middleware with file type validation
const createUploadMiddleware = (allowVideo = false) => {
  return multer({
    storage: storage,
    limits: {
      fileSize: allowVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024, // 50MB for videos, 10MB for images
    },
    fileFilter: (req, file, cb) => {
      console.log("Received file:", file.originalname, file.mimetype);
      
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
      
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else if (allowVideo && allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowVideo ? 'images and videos' : 'images only'}`), false);
      }
    }
  });
};

// Helper function to upload a file to Azure Blob Storage
const uploadToAzure = async (file, blobName, containerName = 'images') => {
  const container = containerName === 'posts' ? postsContainer : imagesContainer;
  const blockBlobClient = container.getBlockBlobClient(blobName);
  
  await blockBlobClient.upload(file.buffer, file.size, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype
    }
  });
  
  return blockBlobClient.url;
};

// Helper function to delete a blob
const deleteFromAzure = async (blobUrl) => {
  try {
    if (!blobUrl || !blobUrl.includes('blob.core.windows.net')) return;
    
    // Extract container and blob name from the URL
    const urlParts = blobUrl.split('/');
    const containerName = urlParts[urlParts.length - 2];
    const blobName = urlParts[urlParts.length - 1];
    
    const container = containerName === 'posts' ? postsContainer : imagesContainer;
    const blockBlobClient = container.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
    
    return true;
  } catch (error) {
    console.error('Error deleting blob:', error);
    return false;
  }
};

// Helper function to generate unique blob names
const generateBlobName = (prefix, userId, originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '-');
  return `${prefix}-${userId}-${timestamp}-${randomString}-${cleanName}`;
};

// Create specific upload middleware instances
const uploadProfileImage = createUploadMiddleware(false);
const uploadPostMedia = createUploadMiddleware(true);

module.exports = {
  uploadProfileImage,
  uploadPostMedia,
  imagesContainer,
  postsContainer,
  uploadToAzure,
  deleteFromAzure,
  generateBlobName
};