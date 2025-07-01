// backend/index.js - Updated with auction routes
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const connectDB = require('./config/db');
const AuctionPurchase = require('./models/AuctionPurchase');
const { sendAuctionWinnerEmail } = require('./utils/sendEmail');
const { v4: uuidv4 } = require('uuid');
const auctionPurchaseRoutes = require('./routes/auctionPurchase');




// Enhanced auction processing function
const processAuctionCompletion = async (artwork) => {
  try {
    // Ensure artwork has populated creator and highestBidder
    await artwork.populate('creator', 'username email');
    await artwork.populate('auction.highestBidder', 'username email');

    if (!artwork.auction.highestBidder || !artwork.auction.currentBid) {
      console.log(`No winner or bid amount found for auction: ${artwork.title}`);
      return;
    }

    // Generate unique auction ID
    const auctionId = uuidv4();

    // Calculate platform fee (e.g., 5% of winning bid)
    const platformFeeRate = 0.05; // 5%
    const platformFee = artwork.auction.currentBid * platformFeeRate;
    const shippingFee = 25; // Default shipping fee
    const totalAmount = artwork.auction.currentBid + platformFee + shippingFee;

    // Check if purchase record already exists
    const existingPurchase = await AuctionPurchase.findOne({ artwork: artwork._id });
    if (existingPurchase) {
      console.log(`Purchase record already exists for artwork: ${artwork.title}`);
      return;
    }

    // Create auction purchase record
    const auctionPurchase = new AuctionPurchase({
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

    await auctionPurchase.save();

    // Send winner notification email
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

    // Mark email as sent
    auctionPurchase.emailNotificationsSent.winner = true;
    await auctionPurchase.save();

    console.log(`✅ Auction completion processed successfully!`);
    console.log(`   Artwork: ${artwork.title}`);
    console.log(`   Winner: ${artwork.auction.highestBidder.username}`);
    console.log(`   Final Bid: $${artwork.auction.currentBid}`);
    console.log(`   Auction ID: ${auctionId}`);

  } catch (error) {
    console.error('❌ Error processing auction completion:', error);
    throw error;
  }
};

// Enhanced cron job to end expired auctions every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('🔍 Checking for expired auctions...');
    const Artwork = require('./models/Artwork');
    const now = new Date();
    
    // Find auctions that are expired but still active
    const expiredAuctions = await Artwork.find({
      'auction.endTime': { $lt: now },
      'auction.isActive': true
    }).populate('creator', 'username email')
      .populate('auction.highestBidder', 'username email');
    
    if (expiredAuctions.length > 0) {
      console.log(`📋 Found ${expiredAuctions.length} expired auction(s) to process`);
      
      for (const artwork of expiredAuctions) {
        try {
          console.log(`⏰ Processing expired auction: ${artwork.title}`);
          
          // End the auction
          artwork.auction.isActive = false;
          
          // If there are bids, process the completion
          if (artwork.auction.bids && artwork.auction.bids.length > 0) {
            artwork.auction.winner = artwork.auction.highestBidder;
            await processAuctionCompletion(artwork);
          } else {
            console.log(`   No bids found for: ${artwork.title}`);
          }
          
          await artwork.save();
          console.log(`✅ Successfully ended auction: ${artwork.title}`);
          
        } catch (error) {
          console.error(`❌ Error processing auction ${artwork.title}:`, error);
        }
      }
    } else {
      console.log('✨ No expired auctions found');
    }
  } catch (error) {
    console.error('❌ Error in auction cleanup cron job:', error);
  }
});

// New cron job to handle expired purchase windows (runs daily at midnight)
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('🔍 Checking for expired purchase windows...');
    
    const expiredPurchases = await AuctionPurchase.findExpired();
    
    if (expiredPurchases.length > 0) {
      console.log(`📋 Found ${expiredPurchases.length} expired purchase(s) to update`);
      
      for (const purchase of expiredPurchases) {
        try {
          await purchase.updateStatus('expired');
          console.log(`⏰ Marked purchase as expired: ${purchase.auctionId}`);
        } catch (error) {
          console.error(`❌ Error updating purchase ${purchase.auctionId}:`, error);
        }
      }
    } else {
      console.log('✨ No expired purchases found');
    }
  } catch (error) {
    console.error('❌ Error in purchase expiry cron job:', error);
  }
});

// New cron job to send reminder emails (runs daily at 9 AM)
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('📧 Checking for purchase reminder emails...');
    
    const purchasesNeedingReminders = await AuctionPurchase.findNeedingReminders();
    
    if (purchasesNeedingReminders.length > 0) {
      console.log(`📋 Found ${purchasesNeedingReminders.length} purchase(s) needing reminders`);
      
      for (const purchase of purchasesNeedingReminders) {
        try {
          await purchase.populate('winner', 'username email');
          await purchase.populate('artwork', 'title');
          
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const completePurchaseUrl = `${frontendUrl}/auction-purchase/${purchase.auctionId}`;
          
          const reminderMessage = `
            Hello ${purchase.winner.username},

            This is a friendly reminder that you have won the auction for "${purchase.artwork.title}".
            
            You have ${purchase.timeRemaining} left to complete your purchase.
            
            Please complete your purchase here: ${completePurchaseUrl}
            
            If you don't complete your purchase within the time limit, the artwork may be offered to the next highest bidder.
            
            Best regards,
            The Uncreated Team
          `;
          
          await sendEmail({
            email: purchase.winner.email,
            subject: `⏰ Reminder: Complete your purchase for "${purchase.artwork.title}"`,
            message: reminderMessage
          });
          
          purchase.emailNotificationsSent.reminder = true;
          await purchase.save();
          
          console.log(`📧 Sent reminder email for: ${purchase.auctionId}`);
        } catch (error) {
          console.error(`❌ Error sending reminder for ${purchase.auctionId}:`, error);
        }
      }
    } else {
      console.log('✨ No reminder emails needed');
    }
  } catch (error) {
    console.error('❌ Error in reminder email cron job:', error);
  }
});

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different types of uploads
const uploadDirs = ['profiles', 'artworks', 'posts'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const artworkRoutes = require('./routes/artworks');
const auctionRoutes = require('./routes/auctions'); // Add auction routes
const shopRoutes = require('./routes/shop');
const postsRoutes = require('./routes/posts');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/auctions', auctionRoutes); // Add auction routes
app.use('/api/shop', shopRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/auction-purchases', auctionPurchaseRoutes);


// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Cron job to end expired auctions (runs every hour)
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Running expired auctions check...');
    const Artwork = require('./models/Artwork');
    const endedCount = await Artwork.endExpiredAuctions();
    console.log(`Ended ${endedCount} expired auctions`);
  } catch (error) {
    console.error('Error in auction cron job:', error);
  }
});

// Cron job to end expired auctions every 5 minutes (more frequent for testing)
cron.schedule('*/5 * * * *', async () => {
  try {
    const Artwork = require('./models/Artwork');
    const now = new Date();
    
    // Find auctions that are expired but still active
    const expiredAuctions = await Artwork.find({
      'auction.endTime': { $lt: now },
      'auction.isActive': true
    });
    
    if (expiredAuctions.length > 0) {
      console.log(`Found ${expiredAuctions.length} expired auctions to end`);
      
      for (const artwork of expiredAuctions) {
        try {
          await artwork.endAuction();
          console.log(`Ended auction for artwork: ${artwork.title}`);
        } catch (error) {
          console.error(`Error ending auction for ${artwork.title}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in auction cleanup cron job:', error);
  }
});

// Error handling middleware  
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Auction cron jobs scheduled');
});