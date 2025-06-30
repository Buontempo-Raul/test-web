// backend/models/Artwork.js - Updated with linkedPosts functionality
const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const auctionSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    required: true
  },
  startingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentBid: {
    type: Number,
    default: null
  },
  highestBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  bids: [bidSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  minimumIncrement: {
    type: Number,
    default: 5
  }
});

const artworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Artwork title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Artwork description is required']
  },
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  price: {
    type: Number,
    required: [true, 'Starting price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
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
  // Auction-specific fields
  auction: auctionSchema,
  currentBid: {
    type: Number,
    default: null
  },
  highestBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // NEW: Array of linked posts
  linkedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  // End auction fields
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted price
artworkSchema.virtual('formattedPrice').get(function() {
  const price = this.currentBid || this.price;
  return `$${price.toFixed(2)}`;
});

// Virtual for auction status
artworkSchema.virtual('auctionStatus').get(function() {
  if (!this.auction) return 'no_auction';
  
  const now = new Date();
  const endTime = new Date(this.auction.endTime);
  
  if (now > endTime) return 'ended';
  if (this.auction.isActive) return 'active';
  return 'inactive';
});

// Virtual for time remaining
artworkSchema.virtual('timeRemaining').get(function() {
  if (!this.auction) return null;
  
  const now = new Date();
  const endTime = new Date(this.auction.endTime);
  
  if (endTime <= now) return 'Auction ended';
  
  const diff = endTime - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
});

// Method to add linked post
artworkSchema.methods.addLinkedPost = function(postId) {
  if (!this.linkedPosts.includes(postId)) {
    this.linkedPosts.push(postId);
  }
};

// Method to remove linked post
artworkSchema.methods.removeLinkedPost = function(postId) {
  this.linkedPosts = this.linkedPosts.filter(id => id.toString() !== postId.toString());
};

// Static method to get artworks by creator with linked posts
artworkSchema.statics.findByCreatorWithPosts = function(creatorId) {
  return this.find({ creator: creatorId })
    .populate('linkedPosts', 'content caption createdAt')
    .populate('creator', 'username profileImage');
};

// Index for efficient queries
artworkSchema.index({ creator: 1 });
artworkSchema.index({ linkedPosts: 1 });
artworkSchema.index({ category: 1 });
artworkSchema.index({ forSale: 1, price: 1 });
artworkSchema.index({ tags: 1 });

const Artwork = mongoose.model('Artwork', artworkSchema);

module.exports = Artwork;