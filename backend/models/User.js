// backend/models/User.js - Enhanced with permanent ban distinction
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
  
  // ENHANCED: Ban functionality with permanent ban tracking
  banUntil: {
    type: Date,
    default: undefined
  },
  banReason: {
    type: String,
    default: undefined
  },
  permanentlyBanned: {
    type: Boolean,
    default: false
  },
  bannedAt: {
    type: Date,
    default: undefined
  },
  
  // Pause functionality (temporary restriction only)
  pauseUntil: {
    type: Date,
    default: undefined
  },
  pauseReason: {
    type: String,
    default: undefined
  },
  pausedAt: {
    type: Date,
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
    ref: 'User'
  }],
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
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

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ENHANCED: Method to ban user (marks email as permanently banned)
userSchema.methods.banUser = function(duration = 7, reason = 'Violation of community guidelines') {
  const banUntil = new Date();
  banUntil.setDate(banUntil.getDate() + duration);
  
  this.banUntil = banUntil;
  this.banReason = reason;
  this.bannedAt = new Date();
  this.permanentlyBanned = true; // IMPORTANT: Email becomes permanently banned
  this.active = false;
  
  return this.save();
};

// ENHANCED: Method to unban user (removes current ban but keeps permanent ban flag)
userSchema.methods.unbanUser = function() {
  this.banUntil = undefined;
  this.banReason = undefined;
  this.active = true;
  
  // NOTE: We keep permanentlyBanned = true to prevent re-registration
  // Only an admin can manually set permanentlyBanned = false if needed
  
  return this.save();
};

// Method to pause user account (temporary restriction only)
userSchema.methods.pauseUser = function(duration = 7, reason = 'Account temporarily paused') {
  const pauseUntil = new Date();
  pauseUntil.setDate(pauseUntil.getDate() + duration);
  
  this.pauseUntil = pauseUntil;
  this.pauseReason = reason;
  this.pausedAt = new Date();
  
  // NOTE: Pause does NOT set permanentlyBanned - user can return normally
  
  return this.save();
};

// Method to unpause user account
userSchema.methods.unpauseUser = function() {
  this.pauseUntil = undefined;
  this.pauseReason = undefined;
  
  return this.save();
};

// ENHANCED: Method to fully restore user (removes permanent ban flag)
userSchema.methods.fullyRestoreUser = function() {
  this.banUntil = undefined;
  this.banReason = undefined;
  this.pauseUntil = undefined;
  this.pauseReason = undefined;
  this.permanentlyBanned = false; // Fully restore - allows re-registration
  this.active = true;
  
  return this.save();
};

// Method to check current account status
userSchema.methods.getAccountStatus = function() {
  const now = new Date();
  
  // Check if currently banned
  if (this.banUntil && this.banUntil > now) {
    return {
      allowed: false,
      status: 'banned',
      restriction: 'temporary_ban',
      until: this.banUntil,
      reason: this.banReason,
      isPermanentlyBanned: this.permanentlyBanned
    };
  }
  
  // Check if currently paused
  if (this.pauseUntil && this.pauseUntil > now) {
    return {
      allowed: false,
      status: 'paused',
      restriction: 'temporary_pause',
      until: this.pauseUntil,
      reason: this.pauseReason,
      isPermanentlyBanned: this.permanentlyBanned
    };
  }
  
  // Check if inactive
  if (!this.active) {
    return {
      allowed: false,
      status: 'inactive',
      restriction: 'account_disabled',
      reason: 'Account has been deactivated',
      isPermanentlyBanned: this.permanentlyBanned
    };
  }
  
  return {
    allowed: true,
    status: 'active',
    isPermanentlyBanned: this.permanentlyBanned
  };
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// ENHANCED: Check if email is permanently banned (for registration prevention)
userSchema.statics.isEmailPermanentlyBanned = async function(email) {
  const user = await this.findOne({ 
    email: email.toLowerCase(),
    permanentlyBanned: true 
  });
  return !!user;
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ 
    active: true,
    $and: [
      {
        $or: [
          { banUntil: { $exists: false } },
          { banUntil: { $lt: new Date() } }
        ]
      },
      {
        $or: [
          { pauseUntil: { $exists: false } },
          { pauseUntil: { $lt: new Date() } }
        ]
      }
    ]
  });
};

userSchema.statics.findArtists = function() {
  return this.find({ 
    isArtist: true, 
    active: true,
    $and: [
      {
        $or: [
          { banUntil: { $exists: false } },
          { banUntil: { $lt: new Date() } }
        ]
      },
      {
        $or: [
          { pauseUntil: { $exists: false } },
          { pauseUntil: { $lt: new Date() } }
        ]
      }
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

userSchema.statics.findPermanentlyBannedUsers = function() {
  return this.find({ 
    permanentlyBanned: true 
  });
};

// Get users by ban/pause status
userSchema.statics.getUsersByStatus = function(status) {
  const now = new Date();
  
  switch (status) {
    case 'active':
      return this.findActiveUsers();
    case 'banned':
      return this.findBannedUsers();
    case 'paused':
      return this.findPausedUsers();
    case 'permanently_banned':
      return this.findPermanentlyBannedUsers();
    case 'inactive':
      return this.find({ active: false });
    default:
      return this.find();
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;