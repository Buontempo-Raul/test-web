// backend/scripts/fixIdMismatch.js
// Run this to fix the ID mismatch issue

const mongoose = require('mongoose');
const AuctionPurchase = require('../models/AuctionPurchase');
const Artwork = require('../models/Artwork'); // Add missing import
const User = require('../models/User'); // Add missing import
const dotenv = require('dotenv');

dotenv.config();

const fixIdMismatch = async () => {
  try {
    console.log('🔧 Starting ID Mismatch Fix...');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // The problematic IDs
    const urlId = '2a9ccdf8-064d-4d2c-8dc6-6282ae4ebd3a';  // From email/URL
    const dbId = '2a9ccdf8-06dd-4d2c-8dc6-6282ae4ebd3a';   // From database
    
    console.log(`\n🔍 Searching for URL ID: ${urlId}`);
    const urlPurchase = await AuctionPurchase.findOne({ auctionId: urlId });
    
    console.log(`🔍 Searching for DB ID: ${dbId}`);
    const dbPurchase = await AuctionPurchase.findOne({ auctionId: dbId })
      .populate('artwork', 'title')
      .populate('winner', 'username email');
    
    if (!urlPurchase && dbPurchase) {
      console.log('\n❌ URL ID not found in database');
      console.log('✅ DB ID found in database');
      console.log('\n📋 Purchase Details:');
      console.log(`   ID: ${dbPurchase.auctionId}`);
      console.log(`   Artwork: ${dbPurchase.artwork?.title}`);
      console.log(`   Winner: ${dbPurchase.winner?.username}`);
      console.log(`   Status: ${dbPurchase.status}`);
      
      // Option 1: Update the database record to match the URL
      console.log('\n🔧 Option 1: Update database ID to match URL');
      console.log(`   Would change: ${dbId} → ${urlId}`);
      
      // Option 2: Show the correct URL
      console.log('\n🔧 Option 2: Use the correct URL');
      console.log(`   Correct URL: http://localhost:3000/auction-purchase/${dbId}`);
      
      // Ask user what they want to do
      console.log('\n❓ What would you like to do?');
      console.log('1. Update database ID to match the URL (recommended)');
      console.log('2. Keep database as-is and use correct URL');
      
      // For automation, let's update the DB to match the URL
      console.log('\n🔄 Updating database ID to match URL...');
      
      dbPurchase.auctionId = urlId;
      await dbPurchase.save();
      
      console.log('✅ Database updated successfully!');
      console.log(`   New ID: ${dbPurchase.auctionId}`);
      
      // Verify the change
      const verifyPurchase = await AuctionPurchase.findOne({ auctionId: urlId });
      if (verifyPurchase) {
        console.log('✅ Verification successful - URL ID now works!');
        console.log(`   Test URL: http://localhost:3000/auction-purchase/${urlId}`);
      } else {
        console.log('❌ Verification failed');
      }
      
    } else if (urlPurchase) {
      console.log('✅ URL ID found in database - no fix needed');
    } else {
      console.log('❌ Neither ID found - there might be a different issue');
      
      // Show all purchases to help debug
      const allPurchases = await AuctionPurchase.find({})
        .populate('artwork', 'title')
        .populate('winner', 'username');
      
      console.log('\n📋 All purchases in database:');
      allPurchases.forEach((purchase, index) => {
        console.log(`   ${index + 1}. ${purchase.auctionId}`);
        console.log(`      Artwork: ${purchase.artwork?.title}`);
        console.log(`      Winner: ${purchase.winner?.username}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing ID mismatch:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
};

// Also create a function to find similar IDs
const findSimilarIds = async (searchId) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`🔍 Searching for IDs similar to: ${searchId}`);
    
    // Get first 10 characters for similarity matching
    const prefix = searchId.substring(0, 10);
    
    const purchases = await AuctionPurchase.find({})
      .populate('artwork', 'title')
      .populate('winner', 'username');
    
    const similar = purchases.filter(p => 
      p.auctionId.substring(0, 10) === prefix ||
      p.auctionId.includes(searchId.substring(0, 8))
    );
    
    console.log(`Found ${similar.length} similar purchases:`);
    similar.forEach(purchase => {
      console.log(`   ${purchase.auctionId}`);
      console.log(`   Similarity: ${purchase.auctionId.substring(0, 10) === prefix ? 'High' : 'Medium'}`);
      console.log(`   Artwork: ${purchase.artwork?.title}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error finding similar IDs:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the appropriate function based on arguments
if (require.main === module) {
  const command = process.argv[2];
  const searchId = process.argv[3];
  
  if (command === 'similar' && searchId) {
    findSimilarIds(searchId);
  } else {
    fixIdMismatch();
  }
}

module.exports = {
  fixIdMismatch,
  findSimilarIds
};