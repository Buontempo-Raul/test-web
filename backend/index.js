// backend/index.js - Updated with auction routes
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const connectDB = require('./config/db');

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