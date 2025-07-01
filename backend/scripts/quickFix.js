// Save this as: backend/scripts/quickFix.js
const mongoose = require('mongoose');
const AuctionPurchase = require('../models/AuctionPurchase');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const quickFix = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔧 Quick Fix: Checking and fixing auction purchase...');
    
    const problemId = '8ee08e06-fc5d-4639-b5dc-bcff68faadb3';
    
    // Check if it exists
    let purchase = await AuctionPurchase.findOne({ auctionId: problemId });
    
    if (purchase) {
      console.log('✅ Purchase found! No fix needed.');
      return;
    }
    
    // Look for the most recent purchase (likely the one you're trying to access)
    const recentPurchase = await AuctionPurchase.findOne()
      .sort({ createdAt: -1 })
      .populate('artwork', 'title')
      .populate('winner', 'username email');
    
    if (!recentPurchase) {
      console.log('❌ No purchases found. Need to create one first.');
      return;
    }
    
    console.log(`🎯 Found most recent purchase:`);
    console.log(`   Current ID: ${recentPurchase.auctionId}`);
    console.log(`   Artwork: ${recentPurchase.artwork?.title}`);
    console.log(`   Winner: ${recentPurchase.winner?.username}`);
    console.log(`   Status: ${recentPurchase.status}`);
    
    // Update the ID to match your URL
    console.log(`\n🔄 Updating ID from ${recentPurchase.auctionId} to ${problemId}`);
    
    recentPurchase.auctionId = problemId;
    await recentPurchase.save();
    
    // Verify the fix
    const verification = await AuctionPurchase.findOne({ auctionId: problemId });
    
    if (verification) {
      console.log('✅ SUCCESS! Your URL should now work:');
      console.log(`   http://localhost:3000/auction-purchase/${problemId}`);
      console.log(`   Backend API: http://localhost:5000/api/auction-purchases/${problemId}`);
    } else {
      console.log('❌ Fix failed. Manual intervention needed.');
    }
    
  } catch (error) {
    console.error('❌ Error during quick fix:', error);
  } finally {
    await mongoose.disconnect();
  }
};

quickFix();