// backend/models/User.js - Updated with consistent schema
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  profileImage: {
    type: String,
    default: 'uploads/default-profile.jpg'
  },
  bio: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  isArtist: {
    type: Boolean,
    default: false
  },
  // Social media links
  socialLinks: {
    instagram: {
      type: String,
      default: ''
    },
    twitter: {
      type: String,
      default: ''
    },
    facebook: {
      type: String,
      default: ''
    },
    pinterest: {
      type: String,
      default: ''
    }
  },
  // User relationships
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork'
  }],
  // User settings
  settings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    privateProfile: {
      type: Boolean,
      default: false
    }
  },
  // System fields
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true
  },
  // Authentication fields
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date, // Changed from lastActive to lastLogin for consistency
  // Legacy field for migration compatibility
  lastActive: Date, // Will be removed after migration
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ active: 1 });
userSchema.index({ isArtist: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for artworks (not stored in DB)
userSchema.virtual('artworks', {
  ref: 'Artwork',
  localField: '_id',
  foreignField: 'creator',
  justOne: false
});

// Virtual for full name (if you add firstName/lastName later)
userSchema.virtual('displayName').get(function() {
  return this.username; // For now, just return username
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password only if it's been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Migration middleware to handle lastActive -> lastLogin
userSchema.pre('save', function(next) {
  // If lastActive exists but lastLogin doesn't, copy it over
  if (this.lastActive && !this.lastLogin) {
    this.lastLogin = this.lastActive;
  }
  next();
});

// Instance methods
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateResetToken = function() {
  // Generate random token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token expire time (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Method to follow another user
userSchema.methods.followUser = async function(targetUserId) {
  if (!this.following.includes(targetUserId)) {
    this.following.push(targetUserId);
    
    // Add this user to target's followers
    const targetUser = await this.constructor.findById(targetUserId);
    if (targetUser && !targetUser.followers.includes(this._id)) {
      targetUser.followers.push(this._id);
      await targetUser.save();
    }
    
    await this.save();
    return true;
  }
  return false;
};

// Method to unfollow another user
userSchema.methods.unfollowUser = async function(targetUserId) {
  const followingIndex = this.following.indexOf(targetUserId);
  if (followingIndex > -1) {
    this.following.splice(followingIndex, 1);
    
    // Remove this user from target's followers
    const targetUser = await this.constructor.findById(targetUserId);
    if (targetUser) {
      const followerIndex = targetUser.followers.indexOf(this._id);
      if (followerIndex > -1) {
        targetUser.followers.splice(followerIndex, 1);
        await targetUser.save();
      }
    }
    
    await this.save();
    return true;
  }
  return false;
};

// Method to add artwork to favorites
userSchema.methods.addToFavorites = function(artworkId) {
  if (!this.favorites.includes(artworkId)) {
    this.favorites.push(artworkId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove artwork from favorites
userSchema.methods.removeFromFavorites = function(artworkId) {
  const index = this.favorites.indexOf(artworkId);
  if (index > -1) {
    this.favorites.splice(index, 1);
    return this.save();
  }
  return Promise.resolve(this);
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ active: true });
};

userSchema.statics.findArtists = function() {
  return this.find({ isArtist: true, active: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User;