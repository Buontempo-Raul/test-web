// Save this as: backend/scripts/simpleCheck.js
// This script doesn't use populate() to avoid schema registration issues

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const simpleCheck = async () => {
  try {
    console.log('🔍 Simple Database Check...');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // Get the AuctionPurchase collection directly
    const db = mongoose.connection.db;
    const auctionPurchasesCollection = db.collection('auctionpurchases');
    
    // Count total purchases
    const totalCount = await auctionPurchasesCollection.countDocuments();
    console.log(`\n📊 Total Auction Purchases: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('❌ No auction purchases found in the database!');
      console.log('\nThis means:');
      console.log('1. No auctions have been completed yet');
      console.log('2. The processAuctionCompletion function isn\'t working');
      console.log('3. You need to end an auction to create purchase records');
      
      // Check if there are any completed auctions
      const artworksCollection = db.collection('artworks');
      const completedAuctions = await artworksCollection.find({
        'auction.isActive': false,
        'auction.highestBidder': { $exists: true, $ne: null }
      }).toArray();
      
      console.log(`\n🎨 Completed auctions in database: ${completedAuctions.length}`);
      
      if (completedAuctions.length > 0) {
        console.log('\n⚠️  You have completed auctions but no purchase records!');
        console.log('   This means the processAuctionCompletion function didn\'t run properly.');
        console.log('   Run the fixed debug script to create missing purchase records.');
      }
      
    } else {
      // Get all purchase IDs
      const purchases = await auctionPurchasesCollection.find({}, {
        projection: { 
          auctionId: 1, 
          status: 1, 
          winningBid: 1, 
          createdAt: 1,
          _id: 0 
        }
      }).toArray();
      
      console.log(`\n📋 Found ${purchases.length} auction purchases:`);
      
      purchases.forEach((purchase, index) => {
        console.log(`   ${index + 1}. ID: ${purchase.auctionId}`);
        console.log(`      Status: ${purchase.status}`);
        console.log(`      Bid: $${purchase.winningBid}`);
        console.log(`      Created: ${purchase.createdAt}`);
        console.log('');
      });
      
      // Check for the specific problematic ID
      const problemId = '8ee08e06-fc5d-4639-b5dc-bcff68faadb3';
      const specificPurchase = await auctionPurchasesCollection.findOne({ 
        auctionId: problemId 
      });
      
      console.log(`🎯 Checking for specific ID: ${problemId}`);
      
      if (specificPurchase) {
        console.log('✅ FOUND! This ID exists in the database.');
        console.log(`   Status: ${specificPurchase.status}`);
        console.log(`   Winning Bid: $${specificPurchase.winningBid}`);
        console.log(`   Your URL should work: http://localhost:3000/auction-purchase/${problemId}`);
      } else {
        console.log('❌ NOT FOUND! This specific ID does not exist.');
        
        // Look for similar IDs
        const similarIds = purchases.filter(p => 
          p.auctionId.substring(0, 10) === problemId.substring(0, 10)
        );
        
        if (similarIds.length > 0) {
          console.log('\n🔍 Found similar IDs (possible typo):');
          similarIds.forEach(p => {
            console.log(`   ${p.auctionId}`);
            console.log(`   Use this URL instead: http://localhost:3000/auction-purchase/${p.auctionId}`);
          });
        } else {
          console.log('\n❌ No similar IDs found either.');
          console.log('   This auction purchase was never created.');
        }
      }
    }
    
    // Additional diagnostics
    console.log('\n🔧 DIAGNOSTIC INFORMATION:');
    console.log(`Database Name: ${mongoose.connection.name}`);
    console.log(`Connection State: ${mongoose.connection.readyState}`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Available Collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error during simple check:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
};

simpleCheck();