// Run this in your backend directory: node debug-auction-purchases.js

const mongoose = require('mongoose');
const AuctionPurchase = require('./models/AuctionPurchase');
const Artwork = require('./models/Artwork');
require('dotenv').config();

const debugAuctionPurchases = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    // 1. Check all auction purchases
    console.log('🔍 CHECKING ALL AUCTION PURCHASES:');
    const allPurchases = await AuctionPurchase.find({})
      .populate('artwork', 'title')
      .populate('winner', 'username email')
      .populate('artist', 'username');

    console.log(`Found ${allPurchases.length} auction purchases:`);
    
    if (allPurchases.length > 0) {
      allPurchases.forEach((purchase, index) => {
        console.log(`
  ${index + 1}. 🆔 ID: ${purchase.auctionId}
     🎨 Artwork: ${purchase.artwork?.title || 'Unknown'}
     👤 Winner: ${purchase.winner?.username || 'Unknown'}
     💰 Bid: $${purchase.winningBid}
     📋 Status: ${purchase.status}
     📅 Created: ${purchase.createdAt}
     🔗 URL: http://localhost:3000/auction-purchase/${purchase.auctionId}
        `);
      });
    } else {
      console.log('❌ NO AUCTION PURCHASES FOUND!\n');
    }

    // 2. Check the specific auction ID from your error
    const specificId = '12635af4-4122-45c6-ba79-efac56a5d3c3';
    console.log(`\n🎯 CHECKING SPECIFIC AUCTION ID: ${specificId}`);
    
    const specificPurchase = await AuctionPurchase.findOne({ auctionId: specificId });
    if (specificPurchase) {
      console.log('✅ Found the specific purchase!');
    } else {
      console.log('❌ Specific auction purchase NOT found in database');
    }

    // 3. Check completed auctions without purchase records
    console.log('\n🔍 CHECKING COMPLETED AUCTIONS:');
    const completedAuctions = await Artwork.find({
      'auction.isActive': false,
      'auction.currentBid': { $gt: 0 },
      'auction.highestBidder': { $exists: true }
    })
    .populate('auction.highestBidder', 'username email')
    .populate('creator', 'username');

    console.log(`Found ${completedAuctions.length} completed auctions with bids:`);

    for (const artwork of completedAuctions) {
      const existingPurchase = await AuctionPurchase.findOne({ artwork: artwork._id });
      console.log(`
  🎨 ${artwork.title}
  👤 Winner: ${artwork.auction.highestBidder?.username || 'Unknown'}
  💰 Final Bid: $${artwork.auction.currentBid}
  📋 Purchase Record: ${existingPurchase ? '✅ EXISTS' : '❌ MISSING'}
      `);
    }

    // 4. Test API endpoints
    console.log('\n🌐 API ENDPOINT TESTS:');
    console.log('Test these URLs in your browser:');
    console.log('• Backend Health: http://localhost:5000/api/test');
    console.log('• Auction Purchases API: http://localhost:5000/api/auction-purchases/test');
    
    if (allPurchases.length > 0) {
      console.log(`• Test Purchase: http://localhost:5000/api/auction-purchases/${allPurchases[0].auctionId}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
};

// Run the debug function
debugAuctionPurchases();