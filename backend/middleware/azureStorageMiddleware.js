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
      console.log("=== Multer File Filter Debug ===");
      console.log("Received file:", file.originalname, file.mimetype);
      console.log("Allow video:", allowVideo);
      
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
      
      if (allowedImageTypes.includes(file.mimetype)) {
        console.log("File accepted: Valid image type");
        cb(null, true);
      } else if (allowVideo && allowedVideoTypes.includes(file.mimetype)) {
        console.log("File accepted: Valid video type");
        cb(null, true);
      } else {
        console.log("File rejected: Invalid type");
        cb(new Error(`Invalid file type. Allowed types: ${allowVideo ? 'images and videos' : 'images only'}`), false);
      }
    }
  });
};

// Helper function to upload a file to Azure Blob Storage
const uploadToAzure = async (file, blobName, containerName = 'images') => {
  try {
    console.log('=== Azure Upload Debug ===');
    console.log('Container name:', containerName);
    console.log('Blob name:', blobName);
    console.log('File size:', file.size || file.buffer?.length);
    console.log('File mimetype:', file.mimetype);
    
    // Check if connection string is available
    if (!connectionString) {
      throw new Error('Azure Storage connection string not configured');
    }
    
    const container = containerName === 'posts' ? postsContainer : imagesContainer;
    console.log('Using container:', container.containerName);
    
    const blockBlobClient = container.getBlockBlobClient(blobName);
    
    // Use the file buffer if available, otherwise use the file itself
    const fileData = file.buffer || file;
    const fileSize = file.size || file.buffer?.length;
    
    console.log('Starting Azure blob upload...');
    
    await blockBlobClient.upload(fileData, fileSize, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype
      }
    });
    
    console.log('Azure upload successful. URL:', blockBlobClient.url);
    return blockBlobClient.url;
  } catch (error) {
    console.error('=== Azure Upload Error ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    
    // Re-throw with more context
    throw new Error(`Azure storage upload failed: ${error.message}`);
  }
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

const checkAzureConfig = () => {
  console.log('=== Azure Storage Configuration Check ===');
  console.log('Connection string available:', !!connectionString);
  
  if (!connectionString) {
    console.error('ERROR: AZURE_STORAGE_CONNECTION_STRING not found in environment variables');
    return false;
  }
  
  console.log('Azure Storage configured successfully');
  return true;
};

// Helper function to generate unique blob names
const generateBlobName = (prefix, userId, originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '-');
  return `${prefix}-${userId}-${timestamp}-${randomString}-${cleanName}`;
};

// Middleware to upload files to Azure and attach URLs
const uploadFilesToAzure = (containerName = 'posts') => {
  return async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return next();
      }

      console.log(`Uploading ${req.files.length} files to Azure container: ${containerName}`);

      // Upload all files and attach URLs
      for (const file of req.files) {
        const blobName = generateBlobName('post', req.user._id, file.originalname);
        const fileUrl = await uploadToAzure(file, blobName, containerName);
        
        // Attach the URL to the file object
        file.url = fileUrl;
        
        console.log(`File uploaded successfully: ${file.originalname} -> ${fileUrl}`);
      }

      next();
    } catch (error) {
      console.error('Azure upload middleware error:', error);
      return res.status(500).json({
        success: false,
        message: `File upload failed: ${error.message}`
      });
    }
  };
};

// Create specific upload middleware instances
const uploadProfileImage = createUploadMiddleware(false);
const uploadPostMedia = createUploadMiddleware(true);

checkAzureConfig();


module.exports = {
  uploadProfileImage,
  uploadPostMedia,
  uploadFilesToAzure,
  imagesContainer,
  postsContainer,
  uploadToAzure,
  deleteFromAzure,
  generateBlobName,
  checkAzureConfig
};