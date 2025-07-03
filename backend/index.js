// backend/index.js - FIXED VERSION
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const connectDB = require('./config/db');
const AuctionPurchase = require('./models/AuctionPurchase');
const { sendEmail } = require('./utils/sendEmail');
const { v4: uuidv4 } = require('uuid');

// Load environment variables FIRST
dotenv.config();

// Connect to database
connectDB();

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ 
  limit: '50mb',  // Increase JSON payload limit to 50MB
  extended: true 
}));

app.use(express.urlencoded({ 
  limit: '50mb',  // Also increase URL-encoded data limit
  extended: true 
}));

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
const auctionRoutes = require('./routes/auctions');
const shopRoutes = require('./routes/shop');
const postsRoutes = require('./routes/posts');
const auctionPurchaseRoutes = require('./routes/auctionPurchase'); // FIXED: Import the route

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/auction-purchases', auctionPurchaseRoutes); // FIXED: Ensure this route is registered

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// FIXED: Add test route for auction purchases
app.get('/api/auction-purchases/test', (req, res) => {
  res.json({ 
    message: 'Auction purchases API is working!',
    timestamp: new Date().toISOString()
  });
});

// FIXED: Add global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// FIXED: Handle 404 for API routes specifically
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Cron job to check for expired purchases (runs every hour)
cron.schedule('0 * * * *', async () => {
  try {
    console.log('⏰ Checking for expired auction purchases...');
    
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

// Cron job to send reminder emails (runs daily at 9 AM)
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
    const { sendAuctionWinnerEmail } = require('./utils/sendEmail');
    
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

    console.log(`✅ Auction completion processed for artwork: ${artwork.title}, winner: ${artwork.auction.highestBidder.username}`);
    console.log(`📧 Winner email sent to: ${artwork.auction.highestBidder.email}`);
    console.log(`🆔 Purchase ID: ${auctionId}`);

  } catch (error) {
    console.error('❌ Error processing auction completion:', error);
    throw error;
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Export for testing
module.exports = app;

// ===================================================================
// DEBUGGING SCRIPT - Run this to test your auction purchase system
// ===================================================================

// Create a test script: backend/scripts/testAuctionPurchase.js
/*
const mongoose = require('mongoose');
const AuctionPurchase = require('../models/AuctionPurchase');
const dotenv = require('dotenv');

dotenv.config();

// Test function to check auction purchases
const testAuctionPurchases = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    // Find all auction purchases
    const purchases = await AuctionPurchase.find({})
      .populate('artwork', 'title')
      .populate('winner', 'username email')
      .populate('artist', 'username');
    
    console.log(`Found ${purchases.length} auction purchases:`);
    
    purchases.forEach(purchase => {
      console.log(`
        🆔 ID: ${purchase.auctionId}
        🎨 Artwork: ${purchase.artwork?.title || 'Unknown'}
        👑 Winner: ${purchase.winner?.username || 'Unknown'}
        🎯 Artist: ${purchase.artist?.username || 'Unknown'}
        💰 Bid: $${purchase.winningBid}
        📋 Status: ${purchase.status}
        ⏰ Created: ${purchase.createdAt}
        ---
      `);
    });
    
    if (purchases.length === 0) {
      console.log('❌ No auction purchases found. You may need to:');
      console.log('1. End an auction to create a purchase record');
      console.log('2. Make sure the auction has bids');
      console.log('3. Check that the processAuctionCompletion function is working');
    }
    
  } catch (error) {
    console.error('Error testing auction purchases:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Uncomment to run:
// testAuctionPurchases();
*/