// backend/index.js - UPDATED VERSION with Admin and Artist Request Routes
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
const auctionPurchaseRoutes = require('./routes/auctionPurchase');

// NEW: Import admin and artist request routes
const adminRoutes = require('./routes/admin');
const artistRequestRoutes = require('./routes/artistRequests');
const adminArtistRequestRoutes = require('./routes/adminArtistRequests');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/auction-purchases', auctionPurchaseRoutes);

// NEW: Admin and Artist Request Routes
app.use('/api/admin', adminRoutes);
app.use('/api/artist-requests', artistRequestRoutes);
app.use('/api/admin/artist-requests', adminArtistRequestRoutes);
app.use('/api/admin', require('./routes/admin'));



// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Test route for auction purchases
app.get('/api/auction-purchases/test', (req, res) => {
  res.json({ 
    message: 'Auction purchases API is working!',
    timestamp: new Date().toISOString()
  });
});

// NEW: Test route for admin functionality
app.get('/api/admin/test', (req, res) => {
  res.json({ 
    message: 'Admin API is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/admin/dashboard/stats - Dashboard statistics',
      'GET /api/admin/dashboard/activity - Recent activity',
      'GET /api/admin/users - User management',
      'GET /api/admin/posts - Post management',
      'GET /api/admin/artworks - Artwork management',
      'GET /api/admin/auctions - Auction management',
      'GET /api/admin/artist-requests - Artist request management'
    ]
  });
});

// NEW: Automatic auction ending cron job
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('🕒 Running auction check...');
    
    const Artwork = require('./models/Artwork');
    const User = require('./models/User');
    
    // Find auctions that have ended but are still active
    const endedAuctions = await Artwork.find({
      'auction.isActive': true,
      'auction.endTime': { $lt: new Date() }
    }).populate('creator', 'username email');

    for (const artwork of endedAuctions) {
      console.log(`🔨 Ending auction for: ${artwork.title}`);
      
      // Mark auction as inactive
      artwork.auction.isActive = false;
      
      // If there are bids, process the winner
      if (artwork.auction.bids && artwork.auction.bids.length > 0) {
        // Get highest bid
        const winningBid = artwork.auction.bids.reduce((max, bid) => 
          bid.amount > max.amount ? bid : max
        );
        
        // Create auction purchase record
        const auctionPurchase = new AuctionPurchase({
          auctionId: uuidv4(),
          artwork: artwork._id,
          winner: winningBid.bidder,
          winningBid: winningBid.amount,
          status: 'pending_payment',
          auctionEndTime: artwork.auction.endTime
        });
        
        await auctionPurchase.save();
        
        // Send notification emails (if email service is configured)
        try {
          const winner = await User.findById(winningBid.bidder);
          if (winner && process.env.EMAIL_SERVICE_ENABLED === 'true') {
            await sendEmail({
              to: winner.email,
              subject: `🎉 You won the auction for "${artwork.title}"!`,
              text: `Congratulations! You won the auction for "${artwork.title}" with a bid of $${winningBid.amount}. Please complete your purchase to receive your artwork.`
            });
            
            // Notify the artist
            if (artwork.creator.email) {
              await sendEmail({
                to: artwork.creator.email,
                subject: `✅ Your auction for "${artwork.title}" has ended`,
                text: `Your auction for "${artwork.title}" has ended successfully! The winning bid was $${winningBid.amount}. The buyer will be contacted to complete the purchase.`
              });
            }
          }
        } catch (emailError) {
          console.error('Error sending auction end emails:', emailError);
        }
        
        console.log(`🏆 Auction ended - Winner: ${winner?.username}, Amount: $${winningBid.amount}`);
      } else {
        console.log(`📭 Auction ended with no bids for: ${artwork.title}`);
      }
      
      await artwork.save();
    }
    
    if (endedAuctions.length > 0) {
      console.log(`✅ Processed ${endedAuctions.length} ended auctions`);
    }
  } catch (error) {
    console.error('❌ Error in auction cron job:', error);
  }
});

// NEW: Daily cleanup cron job
cron.schedule('0 2 * * *', async () => {
  try {
    console.log('🧹 Running daily cleanup...');
    
    const User = require('./models/User');
    
    // Clean up expired bans and pauses
    const now = new Date();
    
    // Unban users whose ban period has expired
    const expiredBans = await User.updateMany(
      { 
        banUntil: { $lt: now },
        active: false 
      },
      { 
        $unset: { banUntil: 1, banReason: 1 },
        $set: { active: true }
      }
    );
    
    // Remove expired pauses
    const expiredPauses = await User.updateMany(
      { pauseUntil: { $lt: now } },
      { $unset: { pauseUntil: 1, pauseReason: 1 } }
    );
    
    console.log(`✅ Cleanup complete - Unbanned: ${expiredBans.modifiedCount}, Unpaused: ${expiredPauses.modifiedCount}`);
  } catch (error) {
    console.error('❌ Error in daily cleanup:', error);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Admin panel available at: http://localhost:${PORT}/admin`);
  console.log(`🔧 API documentation: http://localhost:${PORT}/api/test`);
  console.log(`👥 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Add a test route to verify admin API works
app.get('/api/admin/test-public', (req, res) => {
  res.json({ 
    success: true,
    message: 'Admin routes are registered!',
    timestamp: new Date().toISOString()
  });
});

// Test route to check auth middleware
app.get('/api/test-auth', (req, res) => {
  const token = req.headers.authorization;
  res.json({
    success: true,
    message: 'Auth test endpoint',
    hasAuth: !!token,
    authHeader: token || 'No auth header'
  });
});

module.exports = app;