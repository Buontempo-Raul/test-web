// backend/models/Artwork.js - Updated with auction functionality
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
  const difference = endTime - now;
  
  if (difference <= 0) return 'ended';
  
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
});

// Pre-save middleware to initialize auction
artworkSchema.pre('save', function(next) {
  // If this is a new artwork and no auction is set, create one
  if (this.isNew && !this.auction) {
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 7); // 7 days from now
    
    this.auction = {
      startTime: new Date(),
      endTime: endTime,
      startingPrice: this.price,
      currentBid: null,
      highestBidder: null,
      bids: [],
      isActive: true,
      minimumIncrement: 5
    };
  }
  
  // Sync auction currentBid with artwork currentBid
  if (this.auction && this.auction.currentBid !== this.currentBid) {
    this.currentBid = this.auction.currentBid;
    this.highestBidder = this.auction.highestBidder;
  }
  
  next();
});

// Method to place a bid
artworkSchema.methods.placeBid = function(bidderId, amount) {
  if (!this.auction || !this.auction.isActive) {
    throw new Error('Auction is not active');
  }
  
  const now = new Date();
  const endTime = new Date(this.auction.endTime);
  
  if (now > endTime) {
    throw new Error('Auction has ended');
  }
  
  const currentHighest = this.auction.currentBid || this.auction.startingPrice;
  const minimumBid = currentHighest + this.auction.minimumIncrement;
  
  if (amount < minimumBid) {
    throw new Error(`Bid must be at least $${minimumBid.toFixed(2)}`);
  }
  
  // Check if bidder is the artwork owner
  if (this.creator.toString() === bidderId.toString()) {
    throw new Error('You cannot bid on your own artwork');
  }
  
  // Create new bid
  const newBid = {
    bidder: bidderId,
    amount: amount,
    timestamp: new Date()
  };
  
  // Add bid to history
  this.auction.bids.unshift(newBid);
  
  // Update current bid and highest bidder
  this.auction.currentBid = amount;
  this.auction.highestBidder = bidderId;
  this.currentBid = amount;
  this.highestBidder = bidderId;
  
  return this.save();
};

// Method to end auction
artworkSchema.methods.endAuction = function() {
  if (!this.auction) {
    throw new Error('No auction to end');
  }
  
  this.auction.isActive = false;
  
  if (this.auction.bids.length > 0) {
    this.auction.winner = this.auction.highestBidder;
    this.isSold = true;
    this.forSale = false;
  }
  
  return this.save();
};

// Static method to end expired auctions
artworkSchema.statics.endExpiredAuctions = async function() {
  const now = new Date();
  
  const expiredAuctions = await this.find({
    'auction.endTime': { $lt: now },
    'auction.isActive': true
  });
  
  for (const artwork of expiredAuctions) {
    await artwork.endAuction();
  }
  
  return expiredAuctions.length;
};

const Artwork = mongoose.model('Artwork', artworkSchema);

module.exports = Artwork;