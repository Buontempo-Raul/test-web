// backend/scripts/clearArtworks.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import required models
const User = require('../models/User'); // Need to import User first since Artwork references it
const Artwork = require('../models/Artwork');

async function clearArtworks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Count artworks before deletion
    const count = await Artwork.countDocuments();
    console.log(`Found ${count} artworks in database`);

    if (count > 0) {
      // Show some info about the artworks
      const artworks = await Artwork.find().limit(5).populate('creator', 'username');
      console.log('\nFirst few artworks:');
      artworks.forEach(artwork => {
        console.log(`- "${artwork.title}" by ${artwork.creator?.username || 'Unknown'} - $${artwork.price}`);
      });

      // Ask for confirmation
      console.log('\nThis will delete ALL artworks from the database.');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Delete all artworks
      const result = await Artwork.deleteMany({});
      console.log(`\nDeleted ${result.deletedCount} artworks`);
    } else {
      console.log('No artworks to delete');
    }

    await mongoose.connection.close();
    console.log('Done! Database cleared of all artworks.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if --force flag is provided
if (process.argv[2] === '--force') {
  clearArtworks();
} else {
  console.log('This script will delete ALL artworks from the database.');
  console.log('Run with --force flag to confirm:');
  console.log('  node clearArtworks.js --force');
  console.log('');
  console.log('This will remove all products currently showing in your shop.');
}