// backend/models/EventRequest.js
const mongoose = require('mongoose');

const eventRequestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  time: {
    type: String,
    required: [true, 'Event time is required']
  },
  location: {
    type: String,
    required: [true, 'Event location is required']
  },
  organizer: {
    type: String,
    required: [true, 'Event organizer is required']
  },
  category: {
    type: String,
    required: [true, 'Event category is required']
  },
  price: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1594784108760-19be79e4c902?auto=format&fit=crop&q=80&w=700&ixlib=rb-4.0.3'
  },
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
  adminFeedback: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const EventRequest = mongoose.model('EventRequest', eventRequestSchema);

module.exports = EventRequest;