// backend/scripts/setupAuctions.js
// Run this script to add auction functionality to existing artworks

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import the Artwork model
const Artwork = require('../models/Artwork');

// Simple script to add auction data to artworks
const setupAuctions = async () => {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');

    // Find artworks without auction data
    const artworks = await Artwork.find({
      $or: [
        { auction: { $exists: false } },
        { auction: null }
      ]
    });

    console.log(`Found ${artworks.length} artworks to update`);

    for (const artwork of artworks) {
      try {
        // Create auction end time (7 days from now)
        const endTime = new Date();
        endTime.setDate(endTime.getDate() + 7);

        // Add auction data
        artwork.auction = {
          startTime: new Date(),
          endTime: endTime,
          startingPrice: artwork.price,
          currentBid: null,
          highestBidder: null,
          bids: [],
          isActive: true,
          minimumIncrement: 5
        };

        // Initialize currentBid and highestBidder if they don't exist
        if (!artwork.currentBid) artwork.currentBid = null;
        if (!artwork.highestBidder) artwork.highestBidder = null;

        await artwork.save();
        console.log(`✅ Updated auction for: ${artwork.title}`);
      } catch (error) {
        console.error(`❌ Failed to update ${artwork.title}:`, error.message);
      }
    }

    console.log('🎉 Auction setup complete!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up auctions:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  setupAuctions();
}

module.exports = setupAuctions;