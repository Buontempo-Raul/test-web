// backend/migrations/addAuctionToArtworks.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Artwork = require('../models/Artwork');

// Load environment variables
dotenv.config();

const addAuctionToExistingArtworks = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find artworks without auction data
    const artworksWithoutAuction = await Artwork.find({
      $or: [
        { auction: { $exists: false } },
        { auction: null }
      ]
    });

    console.log(`Found ${artworksWithoutAuction.length} artworks without auction data`);

    let updatedCount = 0;

    for (const artwork of artworksWithoutAuction) {
      try {
        // Create auction end time (7 days from artwork creation or now)
        const baseDate = artwork.createdAt || new Date();
        const auctionEndTime = new Date(baseDate);
        auctionEndTime.setDate(auctionEndTime.getDate() + 7);

        // Only create active auctions for artworks that are for sale and not sold
        const isActive = artwork.forSale && !artwork.isSold;

        const auctionData = {
          startTime: artwork.createdAt || new Date(),
          endTime: auctionEndTime,
          startingPrice: artwork.price,
          currentBid: null,
          highestBidder: null,
          bids: [],
          isActive: isActive,
          minimumIncrement: 5,
          winner: null
        };

        // Update the artwork
        await Artwork.findByIdAndUpdate(
          artwork._id,
          { 
            auction: auctionData,
            currentBid: null,
            highestBidder: null
          },
          { new: true }
        );

        updatedCount++;
        console.log(`Updated auction for: ${artwork.title}`);
      } catch (error) {
        console.error(`Error updating artwork ${artwork.title}:`, error);
      }
    }

    console.log(`Successfully updated ${updatedCount} artworks with auction data`);

    // Verify the updates
    const totalArtworks = await Artwork.countDocuments();
    const artworksWithAuction = await Artwork.countDocuments({
      auction: { $exists: true, $ne: null }
    });

    console.log(`Total artworks: ${totalArtworks}`);
    console.log(`Artworks with auction data: ${artworksWithAuction}`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  addAuctionToExistingArtworks();
}

module.exports = addAuctionToExistingArtworks;