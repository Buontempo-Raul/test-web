// backend/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
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
const uploadDirs = ['profiles', 'artworks', 'events', 'posts'];
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
const shopRoutes = require('./routes/shop');
const eventRoutes = require('./routes/events');
const eventRequestRoutes = require('./routes/eventRequests');
const postsRoutes = require('./routes/posts');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/event-requests', eventRequestRoutes);
app.use('/api/posts', postsRoutes);

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Error handling middleware  
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize admin user and default data if needed
const initializeData = async () => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      console.log('Creating admin user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create admin user
      const admin = new User({
        username: 'admin',
        email: 'admin@uncreated.com',
        password: hashedPassword,
        isArtist: true,
        role: 'admin',
        profileImage: 'uploads/profiles/default-profile.jpg',
        bio: 'System administrator for Uncreated platform'
      });
      
      await admin.save();
      console.log('Admin user created successfully');
    }

    // Copy default images if they don't exist
    const defaultProfileImagePath = path.join(uploadsDir, 'profiles', 'default-profile.jpg');
    if (!fs.existsSync(defaultProfileImagePath)) {
      const defaultImagesDir = path.join(__dirname, 'assets', 'defaults');
      
      // Ensure defaults directory exists
      if (!fs.existsSync(defaultImagesDir)) {
        fs.mkdirSync(defaultImagesDir, { recursive: true });
      }
      
      // Create a simple default profile image
      const defaultProfileSource = path.join(defaultImagesDir, 'default-profile.jpg');
      if (!fs.existsSync(defaultProfileSource)) {
        console.log('Default profile image not found, it should be created or provided');
      } else {
        fs.copyFileSync(defaultProfileSource, defaultProfileImagePath);
      }
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
};

// Run the initialization
initializeData();