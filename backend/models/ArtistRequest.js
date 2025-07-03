// backend/models/ArtistRequest.js
const mongoose = require('mongoose');

const artistRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  applicationData: {
    // Personal Information
    fullName: {
      type: String,
      required: true
    },
    artistName: {
      type: String,
      required: true
    },
    
    // Contact Information
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String
    },
    website: {
      type: String
    },
    
    // Professional Information
    artStyle: {
      type: String,
      required: true
    },
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'professional'],
      required: true
    },
    specialties: [{
      type: String
    }],
    
    // Portfolio
    portfolioImages: [{
      url: String,
      title: String,
      description: String
    }],
    portfolioDescription: {
      type: String,
      required: true,
      maxlength: 1000
    },
    
    // Professional Background
    education: {
      type: String
    },
    exhibitions: {
      type: String
    },
    awards: {
      type: String
    },
    
    // Business Information
    priceRange: {
      min: {
        type: Number,
        required: true
      },
      max: {
        type: Number,
        required: true
      }
    },
    customOrders: {
      type: Boolean,
      default: false
    },
    shippingInfo: {
      type: String
    },
    
    // Social Media
    socialLinks: {
      instagram: String,
      twitter: String,
      facebook: String,
      pinterest: String,
      other: String
    },
    
    // Application Statement
    motivation: {
      type: String,
      required: true,
      maxlength: 500
    },
    goals: {
      type: String,
      required: true,
      maxlength: 500
    }
  },
  
  // Admin Review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewComments: {
    type: String
  },
  
  // Additional Files
  documents: [{
    type: String,
    name: String,
    size: Number
  }],
  
  // Submission tracking
  submittedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
artistRequestSchema.index({ user: 1 });
artistRequestSchema.index({ status: 1 });
artistRequestSchema.index({ submittedAt: -1 });

// Virtual for calculating application completeness
artistRequestSchema.virtual('completeness').get(function() {
  const required = ['fullName', 'artistName', 'email', 'artStyle', 'experience', 'portfolioDescription', 'motivation', 'goals'];
  const completed = required.filter(field => {
    const value = this.applicationData[field];
    return value && value.toString().trim().length > 0;
  });
  
  return Math.round((completed.length / required.length) * 100);
});

// Method to approve request
artistRequestSchema.methods.approve = async function(adminId, comments = '') {
  this.status = 'approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.reviewComments = comments;
  
  // Update user to be an artist
  const User = require('./User');
  await User.findByIdAndUpdate(this.user, { isArtist: true });
  
  return this.save();
};

// Method to reject request
artistRequestSchema.methods.reject = async function(adminId, comments = '') {
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.reviewComments = comments;
  
  return this.save();
};

// Static method to get pending requests
artistRequestSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'pending' })
    .populate('user', 'username email profileImage createdAt')
    .sort({ submittedAt: -1 });
};

// Static method to get requests by status
artistRequestSchema.statics.getByStatus = function(status) {
  return this.find({ status })
    .populate('user', 'username email profileImage createdAt')
    .populate('reviewedBy', 'username')
    .sort({ submittedAt: -1 });
};

// Static method to check if user has pending request
artistRequestSchema.statics.hasUserPendingRequest = function(userId) {
  return this.findOne({ 
    user: userId, 
    status: 'pending' 
  });
};

// Pre-save middleware to update lastUpdated
artistRequestSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const ArtistRequest = mongoose.model('ArtistRequest', artistRequestSchema);

module.exports = ArtistRequest;