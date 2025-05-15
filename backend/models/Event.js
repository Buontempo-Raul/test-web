// backend/models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;