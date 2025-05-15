// backend/scripts/initDb.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

// Initialize connection
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    return false;
  }
}

// Define schemas
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profileImage: {
    type: String,
    default: 'default-profile.jpg'
  },
  bio: {
    type: String,
    default: ''
  },
  website: String,
  isArtist: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const artworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['painting', 'sculpture', 'photography', 'digital', 'mixed media', 'other']
  },
  medium: String,
  dimensions: {
    width: Number,
    height: Number,
    depth: Number,
    unit: {
      type: String,
      enum: ['cm', 'in'],
      default: 'cm'
    }
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  forSale: {
    type: Boolean,
    default: true
  },
  isSold: {
    type: Boolean,
    default: false
  },
  tags: [String],
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  orderItems: [
    {
      title: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      artwork: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Artwork'
      }
    }
  ],
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String }
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create models
const User = mongoose.model('User', userSchema);
const Artwork = mongoose.model('Artwork', artworkSchema);
const Order = mongoose.model('Order', orderSchema);

// Create indexes
async function createIndexes() {
  try {
    console.log('Creating indexes...');
    
    // User indexes
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    
    // Artwork indexes
    await Artwork.collection.createIndex({ creator: 1 });
    await Artwork.collection.createIndex({ category: 1 });
    await Artwork.collection.createIndex({ forSale: 1, price: 1 });
    await Artwork.collection.createIndex({ tags: 1 });
    
    console.log('Indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

// Create admin user
async function createAdminUser() {
  try {
    console.log('Checking for admin user...');
    
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }
    
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
      bio: 'System administrator for Uncreated platform'
    });
    
    await admin.save();
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Main function
async function initializeDatabase() {
  // Connect to MongoDB
  const connected = await connectToDatabase();
  if (!connected) return;
  
  try {
    // Create indexes
    await createIndexes();
    
    // Create admin user
    await createAdminUser();
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the initialization
initializeDatabase();