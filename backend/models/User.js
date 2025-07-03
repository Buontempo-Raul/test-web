// backend/models/User.js - UPDATED with ban/pause functionality
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  profileImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
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
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true
  },
  
  // NEW: Ban functionality
  banUntil: {
    type: Date,
    default: undefined
  },
  banReason: {
    type: String,
    default: undefined
  },
  
  // NEW: Pause functionality (temporary account suspension)
  pauseUntil: {
    type: Date,
    default: undefined
  },
  pauseReason: {
    type: String,
    default: undefined
  },
  
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
  socialLinks: {
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    facebook: { type: String, default: '' },
    pinterest: { type: String, default: '' }
  },
  settings: {
    emailNotifications: { type: Boolean, default: true },
    privateProfile: { type: Boolean, default: false }
  },
  lastLogin: {
    type: Date
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Virtual for checking if user is currently banned
userSchema.virtual('isBanned').get(function() {
  return this.banUntil && this.banUntil > new Date();
});

// Virtual for checking if user is currently paused
userSchema.virtual('isPaused').get(function() {
  return this.pauseUntil && this.pauseUntil > new Date();
});

// Virtual for checking if user account is accessible
userSchema.virtual('isAccessible').get(function() {
  return this.active && !this.isBanned && !this.isPaused;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
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

// NEW: Method to ban user
userSchema.methods.banUser = function(duration = 7, reason = 'Violation of platform rules') {
  const banUntil = new Date();
  banUntil.setDate(banUntil.getDate() + duration);
  
  this.banUntil = banUntil;
  this.banReason = reason;
  this.active = false;
  
  return this.save();
};

// NEW: Method to unban user
userSchema.methods.unbanUser = function() {
  this.banUntil = undefined;
  this.banReason = undefined;
  this.active = true;
  
  return this.save();
};

// NEW: Method to pause user account
userSchema.methods.pauseUser = function(duration = 7, reason = 'Account temporarily paused') {
  const pauseUntil = new Date();
  pauseUntil.setDate(pauseUntil.getDate() + duration);
  
  this.pauseUntil = pauseUntil;
  this.pauseReason = reason;
  
  return this.save();
};

// NEW: Method to unpause user account
userSchema.methods.unpauseUser = function() {
  this.pauseUntil = undefined;
  this.pauseReason = undefined;
  
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ 
    active: true,
    $or: [
      { banUntil: { $exists: false } },
      { banUntil: { $lt: new Date() } }
    ],
    $or: [
      { pauseUntil: { $exists: false } },
      { pauseUntil: { $lt: new Date() } }
    ]
  });
};

userSchema.statics.findArtists = function() {
  return this.find({ 
    isArtist: true, 
    active: true,
    $or: [
      { banUntil: { $exists: false } },
      { banUntil: { $lt: new Date() } }
    ]
  });
};

userSchema.statics.findBannedUsers = function() {
  return this.find({ 
    banUntil: { $gt: new Date() } 
  });
};

userSchema.statics.findPausedUsers = function() {
  return this.find({ 
    pauseUntil: { $gt: new Date() } 
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;