// backend/models/Artwork.js
const mongoose = require('mongoose');

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
    required: [true, 'Price is required'],
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
  return `$${this.price.toFixed(2)}`;
});

const Artwork = mongoose.model('Artwork', artworkSchema);

module.exports = Artwork;