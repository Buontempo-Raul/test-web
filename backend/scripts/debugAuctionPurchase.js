// backend/scripts/debugAuctionPurchase.js
// Create this file to debug your auction purchase system

const mongoose = require('mongoose');
const AuctionPurchase = require('../models/AuctionPurchase');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const debugAuctionPurchases = async () => {
  try {
    console.log('🔍 Starting Auction Purchase Debug...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // 1. Check existing auction purchases
    console.log('\n📋 Checking existing auction purchases...');
    const existingPurchases = await AuctionPurchase.find({})
      .populate('artwork', 'title')
      .populate('winner', 'username email')
      .populate('artist', 'username');
    
    console.log(`Found ${existingPurchases.length} existing purchases:`);
    
    if (existingPurchases.length > 0) {
      existingPurchases.forEach((purchase, index) => {
        console.log(`
        ${index + 1}. Purchase ID: ${purchase.auctionId}
           Artwork: ${purchase.artwork?.title || 'Unknown'}
           Winner: ${purchase.winner?.username || 'Unknown'} (${purchase.winner?.email || 'No email'})
           Artist: ${purchase.artist?.username || 'Unknown'}
           Winning Bid: $${purchase.winningBid}
           Status: ${purchase.status}
           Created: ${purchase.createdAt}
           Expires: ${purchase.expiresAt}
        `);
      });
    } else {
      console.log('❌ No auction purchases found!');
    }
    
    // 2. Check completed auctions without purchase records
    console.log('\n🎨 Checking completed auctions...');
    const completedAuctions = await Artwork.find({
      'auction.isActive': false,
      'auction.hasEnded': true,
      'auction.highestBidder': { $exists: true, $ne: null }
    })
    .populate('auction.highestBidder', 'username email')
    .populate('creator', 'username email');
    
    console.log(`Found ${completedAuctions.length} completed auctions with winners:`);
    
    if (completedAuctions.length > 0) {
      for (const artwork of completedAuctions) {
        const existingPurchase = await AuctionPurchase.findOne({ artwork: artwork._id });
        
        console.log(`
        Artwork: ${artwork.title}
        Winner: ${artwork.auction.highestBidder?.username || 'Unknown'}
        Final Bid: $${artwork.auction.currentBid}
        Artist: ${artwork.creator?.username || 'Unknown'}
        Has Purchase Record: ${existingPurchase ? '✅ YES' : '❌ NO'}
        ${!existingPurchase ? '⚠️  MISSING PURCHASE RECORD!' : ''}
        `);
        
        // 3. Create missing purchase records
        if (!existingPurchase) {
          console.log(`\n🔧 Creating missing purchase record for: ${artwork.title}`);
          
          const auctionId = uuidv4();
          const platformFeeRate = 0.05; // 5%
          const platformFee = artwork.auction.currentBid * platformFeeRate;
          const shippingFee = 25;
          const totalAmount = artwork.auction.currentBid + platformFee + shippingFee;
          
          const newPurchase = new AuctionPurchase({
            auctionId: auctionId,
            artwork: artwork._id,
            artist: artwork.creator._id,
            winner: artwork.auction.highestBidder._id,
            winningBid: artwork.auction.currentBid,
            platformFee: platformFee,
            shippingFee: shippingFee,
            totalAmount: totalAmount,
            auctionEndDate: artwork.auction.endTime,
            status: 'pending'
          });
          
          await newPurchase.save();
          console.log(`✅ Created purchase record with ID: ${auctionId}`);
          
          // Send winner email
          try {
            const { sendAuctionWinnerEmail } = require('../utils/sendEmail');
            
            const winnerData = {
              winnerEmail: artwork.auction.highestBidder.email,
              winnerUsername: artwork.auction.highestBidder.username,
              artwork: {
                title: artwork.title,
                description: artwork.description,
                images: artwork.images
              },
              finalBid: artwork.auction.currentBid,
              artistUsername: artwork.creator.username,
              auctionId: auctionId
            };
            
            await sendAuctionWinnerEmail(winnerData);
            
            newPurchase.emailNotificationsSent.winner = true;
            await newPurchase.save();
            
            console.log(`📧 Winner email sent to: ${artwork.auction.highestBidder.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send email:`, emailError.message);
          }
        }
      }
    }
    
    // 4. Test API endpoint
    console.log('\n🌐 Testing API endpoints...');
    const allPurchases = await AuctionPurchase.find({});
    
    if (allPurchases.length > 0) {
      const testPurchase = allPurchases[0];
      console.log(`Testing with purchase ID: ${testPurchase.auctionId}`);
      console.log(`Frontend URL: http://localhost:3000/auction-purchase/${testPurchase.auctionId}`);
      console.log(`Backend API URL: http://localhost:5000/api/auction-purchases/${testPurchase.auctionId}`);
    }
    
    // 5. Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Total Auction Purchases: ${allPurchases.length}`);
    console.log(`Completed Auctions: ${completedAuctions.length}`);
    
    if (allPurchases.length === 0) {
      console.log(`
❌ NO AUCTION PURCHASES FOUND!

This means:
1. No auctions have been completed yet
2. The processAuctionCompletion function isn't running when auctions end
3. There might be an issue with the auction ending process

To fix this:
1. Make sure you have some completed auctions with bids
2. Check that the auction ending process calls processAuctionCompletion
3. Run this script again to create missing purchase records
      `);
    } else {
      console.log(`
✅ Found ${allPurchases.length} auction purchase(s)

Next steps:
1. Try accessing: http://localhost:3000/auction-purchase/${allPurchases[0].auctionId}
2. Check your browser network tab for API errors
3. Make sure your backend server is running on port 5000
      `);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
};

// Test the specific auction purchase from the error
const testSpecificPurchase = async (auctionId) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`🔍 Testing specific auction purchase: ${auctionId}`);
    
    const purchase = await AuctionPurchase.findOne({ auctionId })
      .populate('artwork', 'title description images')
      .populate('artist', 'username email')
      .populate('winner', 'username email');
    
    if (purchase) {
      console.log('✅ Purchase found!');
      console.log(JSON.stringify({
        auctionId: purchase.auctionId,
        artwork: purchase.artwork,
        winner: purchase.winner,
        status: purchase.status,
        winningBid: purchase.winningBid
      }, null, 2));
    } else {
      console.log('❌ Purchase not found in database!');
      
      // Search for any purchase with similar ID
      const similarPurchases = await AuctionPurchase.find({
        auctionId: { $regex: auctionId.substring(0, 8), $options: 'i' }
      });
      
      if (similarPurchases.length > 0) {
        console.log(`Found ${similarPurchases.length} purchases with similar IDs:`);
        similarPurchases.forEach(p => {
          console.log(`- ${p.auctionId}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error testing specific purchase:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the debug
if (require.main === module) {
  const specificId = process.argv[2];
  
  if (specificId) {
    console.log(`Testing specific auction purchase: ${specificId}`);
    testSpecificPurchase(specificId);
  } else {
    debugAuctionPurchases();
  }
}

module.exports = {
  debugAuctionPurchases,
  testSpecificPurchase
};