// backend/scripts/initArtworksContainer.js
require('dotenv').config({ path: '../.env' });
const { BlobServiceClient } = require('@azure/storage-blob');

async function initArtworksContainer() {
  console.log('=== Azure Artworks Container Initialization ===');
  
  // Check environment variables
  console.log('Environment variables check:');
  console.log('AZURE_STORAGE_CONNECTION_STRING:', process.env.AZURE_STORAGE_CONNECTION_STRING ? 'SET' : 'NOT SET');
  
  if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
    console.error('ERROR: AZURE_STORAGE_CONNECTION_STRING is not set in environment variables');
    console.log('Please check your .env file and ensure it contains:');
    console.log('AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here');
    return;
  }
  
  try {
    // Test connection
    console.log('\nTesting Azure Storage connection...');
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    
    // Test container access
    console.log('Testing container access...');
    const imagesContainer = blobServiceClient.getContainerClient('images');
    const postsContainer = blobServiceClient.getContainerClient('posts');
    const artworksContainer = blobServiceClient.getContainerClient('artworks'); // ✅ New artworks container
    
    // Check if containers exist
    const imagesExists = await imagesContainer.exists();
    const postsExists = await postsContainer.exists();
    const artworksExists = await artworksContainer.exists(); // ✅ Check artworks container
    
    console.log('Images container exists:', imagesExists);
    console.log('Posts container exists:', postsExists);
    console.log('Artworks container exists:', artworksExists); // ✅ Log artworks container status
    
    if (!imagesExists) {
      console.log('Creating images container...');
      await imagesContainer.create({ access: 'blob' });
      console.log('Images container created successfully');
    }
    
    if (!postsExists) {
      console.log('Creating posts container...');
      await postsContainer.create({ access: 'blob' });
      console.log('Posts container created successfully');
    }
    
    // ✅ Create artworks container if it doesn't exist
    if (!artworksExists) {
      console.log('Creating artworks container...');
      await artworksContainer.create({ access: 'blob' });
      console.log('Artworks container created successfully');
    }
    
    console.log('\n=== Container Configuration Summary ===');
    console.log('✅ Images container: Ready for profile pictures');
    console.log('✅ Posts container: Ready for post media');
    console.log('✅ Artworks container: Ready for artwork images');
    console.log('\nAll Azure Storage containers are configured correctly!');
    
  } catch (error) {
    console.error('Azure Storage connection failed:');
    console.error('Error:', error.message);
    console.error('Please check your connection string and Azure Storage account');
  }
}

// Run the initialization
initArtworksContainer();