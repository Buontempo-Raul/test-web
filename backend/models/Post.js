// backend/models/Post.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const postSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: {
      type: String,
      enum: ['image', 'video', 'carousel'],
      required: true
    },
    url: String,
    thumbnailUrl: String,
    aspectRatio: String,
    items: [{
      type: {
        type: String,
        enum: ['image', 'video']
      },
      url: String
    }]
  },
  caption: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  likes: {
    type: Number,
    default: 0
  },
  comments: [commentSchema],
  linkedShopItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for searching by tags
postSchema.index({ tags: 1 });
// Index for sorting by creation date
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;