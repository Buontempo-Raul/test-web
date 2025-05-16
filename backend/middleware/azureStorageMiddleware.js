// backend/middleware/azureStorageMiddleware.js
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

// Azure Storage configuration
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

// Get the images container client - using your single container
const imagesContainer = blobServiceClient.getContainerClient('images');

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// Create upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log("Received file:", file.originalname, file.mimetype);
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Helper function to upload a file to Azure Blob Storage
const uploadToAzure = async (file, blobName) => {
  const blockBlobClient = imagesContainer.getBlockBlobClient(blobName);
  
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
    
    // Extract blob name from the URL
    const urlParts = blobUrl.split('/');
    const blobName = urlParts[urlParts.length - 1];
    
    const blockBlobClient = imagesContainer.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
    
    return true;
  } catch (error) {
    console.error('Error deleting blob:', error);
    return false;
  }
};

module.exports = {
  upload,
  imagesContainer,
  uploadToAzure,
  deleteFromAzure
};