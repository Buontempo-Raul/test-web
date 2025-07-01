// backend/models/AuctionPurchase.js
const mongoose = require('mongoose');

const auctionPurchaseSchema = new mongoose.Schema({
  // Auction and artwork info
  auctionId: {
    type: String,
    required: true,
    unique: true
  },
  artwork: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Artwork'
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  
  // Purchase details
  winningBid: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Shipping information
  shippingAddress: {
    fullName: String,
    address: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phoneNumber: String
  },
  
  // Payment information
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer'],
    default: 'credit_card'
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String,
    payer_id: String
  },
  
  // Fees and totals
  platformFee: {
    type: Number,
    default: 0
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  
  // Status tracking
  status: {
    type: String,
    enum: [
      'pending', // Email sent, waiting for buyer action
      'address_provided', // Buyer provided shipping address
      'payment_pending', // Payment in progress
      'paid', // Payment completed
      'shipped', // Artist has shipped the item
      'delivered', // Item delivered
      'completed', // Transaction fully completed
      'cancelled', // Purchase cancelled
      'expired' // 7-day window expired
    ],
    default: 'pending'
  },
  
  // Important dates
  auctionEndDate: {
    type: Date,
    required: true
  },
  emailSentAt: {
    type: Date,
    default: Date.now
  },
  addressProvidedAt: Date,
  paidAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  completedAt: Date,
  
  // Purchase window (usually 7 days)
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  },
  
  // Tracking information
  trackingNumber: String,
  shippingCarrier: String,
  
  // Communication
  notes: String,
  artistNotes: String,
  
  // Metadata
  emailNotificationsSent: {
    winner: { type: Boolean, default: false },
    artist: { type: Boolean, default: false },
    reminder: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
auctionPurchaseSchema.index({ auctionId: 1 });
auctionPurchaseSchema.index({ winner: 1 });
auctionPurchaseSchema.index({ artist: 1 });
auctionPurchaseSchema.index({ status: 1 });
auctionPurchaseSchema.index({ expiresAt: 1 });

// Virtual for checking if purchase is expired
auctionPurchaseSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt && this.status === 'pending';
});

// Virtual for time remaining
auctionPurchaseSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'pending') return null;
  
  const now = new Date();
  const expiry = new Date(this.expiresAt);
  const diff = expiry - now;
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} hour${hours > 1 ? 's' : ''}`;
});

// Method to update status
auctionPurchaseSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  this.status = newStatus;
  
  // Update relevant timestamp based on status
  switch (newStatus) {
    case 'address_provided':
      this.addressProvidedAt = new Date();
      break;
    case 'paid':
      this.paidAt = new Date();
      break;
    case 'shipped':
      this.shippedAt = new Date();
      break;
    case 'delivered':
      this.deliveredAt = new Date();
      break;
    case 'completed':
      this.completedAt = new Date();
      break;
  }
  
  // Apply additional data
  Object.assign(this, additionalData);
  
  return this.save();
};

// Static method to find expired purchases
auctionPurchaseSchema.statics.findExpired = function() {
  return this.find({
    status: 'pending',
    expiresAt: { $lt: new Date() }
  });
};

// Static method to find purchases needing reminders
auctionPurchaseSchema.statics.findNeedingReminders = function() {
  const reminderTime = new Date();
  reminderTime.setDate(reminderTime.getDate() - 5); // 2 days before expiry
  
  return this.find({
    status: 'pending',
    emailSentAt: { $lt: reminderTime },
    'emailNotificationsSent.reminder': false
  });
};

const AuctionPurchase = mongoose.model('AuctionPurchase', auctionPurchaseSchema);

module.exports = AuctionPurchase;