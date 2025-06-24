// backend/middleware/azureStorageMiddleware.js - Add this middleware function
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

// Azure Storage configuration
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

// Get container clients
const imagesContainer = blobServiceClient.getContainerClient('images');
const postsContainer = blobServiceClient.getContainerClient('posts');
const artworksContainer = blobServiceClient.getContainerClient('artworks');

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
        cb(new Error(`Invalid file type. Allowed types: ${allowVideo ? 'Images and Videos' : 'Images only'}`));
      }
    }
  });
};

// Upload file to Azure Blob Storage
const uploadToAzure = async (file, blobName, containerName = 'posts') => {
  try {
    let containerClient;
    
    switch (containerName) {
      case 'artworks':
        containerClient = artworksContainer;
        break;
      case 'images':
        containerClient = imagesContainer;
        break;
      default:
        containerClient = postsContainer;
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload file buffer to Azure
    await blockBlobClient.upload(file.buffer, file.buffer.length, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype
      }
    });

    // Return the URL of the uploaded file
    return blockBlobClient.url;
  } catch (error) {
    console.error('Azure upload error:', error);
    throw new Error(`Failed to upload file to Azure: ${error.message}`);
  }
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
      console.log('=== Azure Upload Middleware ===');
      console.log('Files to process:', req.files ? req.files.length : 0);
      
      // If no files, continue to next middleware
      if (!req.files || req.files.length === 0) {
        console.log('No files to upload, continuing...');
        return next();
      }

      console.log(`Uploading ${req.files.length} files to Azure container: ${containerName}`);

      // Upload all files and attach URLs
      for (const file of req.files) {
        console.log(`Processing file: ${file.originalname}`);
        
        // Generate appropriate blob name based on container
        let prefix = 'file';
        if (containerName === 'artworks') {
          prefix = 'artwork';
        } else if (containerName === 'posts') {
          prefix = 'post';
        } else if (containerName === 'images') {
          prefix = 'profile';
        }
        
        const blobName = generateBlobName(prefix, req.user._id, file.originalname);
        console.log(`Generated blob name: ${blobName}`);
        
        try {
          const fileUrl = await uploadToAzure(file, blobName, containerName);
          
          // Attach the URL to the file object
          file.url = fileUrl;
          file.location = fileUrl; // Also set location for compatibility
          
          console.log(`File uploaded successfully: ${file.originalname} -> ${fileUrl}`);
        } catch (uploadError) {
          console.error(`Failed to upload ${file.originalname}:`, uploadError);
          throw uploadError;
        }
      }

      console.log('All files uploaded successfully');
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

// Delete file from Azure
const deleteFromAzure = async (fileUrl) => {
  try {
    // Extract blob name from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const containerName = pathParts[1];
    const blobName = pathParts.slice(2).join('/');

    let containerClient;
    switch (containerName) {
      case 'artworks':
        containerClient = artworksContainer;
        break;
      case 'images':
        containerClient = imagesContainer;
        break;
      default:
        containerClient = postsContainer;
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
    
    console.log(`Successfully deleted file from Azure: ${blobName}`);
  } catch (error) {
    console.error('Error deleting file from Azure:', error);
    throw error;
  }
};

// Check Azure configuration
const checkAzureConfig = () => {
  console.log('Checking Azure Storage configuration...');
  console.log('Connection string available:', !!connectionString);
  
  if (!connectionString) {
    console.error('ERROR: AZURE_STORAGE_CONNECTION_STRING not found in environment variables');
    return false;
  }
  
  console.log('Azure Storage configured successfully');
  return true;
};

// Create specific upload middleware instances
const uploadProfileImage = createUploadMiddleware(false);
const uploadPostMedia = createUploadMiddleware(true);
const uploadArtworkImages = createUploadMiddleware(false);

// Check configuration on startup
checkAzureConfig();

module.exports = {
  uploadProfileImage,
  uploadPostMedia,
  uploadArtworkImages,
  uploadFilesToAzure,
  imagesContainer,
  postsContainer,
  artworksContainer,
  uploadToAzure,
  deleteFromAzure,
  generateBlobName,
  checkAzureConfig
};