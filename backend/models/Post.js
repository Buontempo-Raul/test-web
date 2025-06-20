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


// Performance indexes for large datasets
postSchema.index({ createdAt: -1 }); // For cursor-based pagination
postSchema.index({ creator: 1, createdAt: -1 }); // For user posts
postSchema.index({ tags: 1, createdAt: -1 }); // For tag filtering
postSchema.index({ 
  caption: 'text', 
  tags: 'text' 
}, { 
  name: 'post_search_index' 
}); // For text search

// Compound indexes for common query patterns
postSchema.index({ 
  creator: 1, 
  tags: 1, 
  createdAt: -1 
}); // For filtered user posts

postSchema.index({ 
  'creator': 1, 
  'createdAt': -1 
}, { 
  partialFilterExpression: { 'creator': { $exists: true } } 
}); // For following feed

// Alternative: Run these directly in MongoDB
/*
db.posts.createIndex({ "createdAt": -1 })
db.posts.createIndex({ "creator": 1, "createdAt": -1 })
db.posts.createIndex({ "tags": 1, "createdAt": -1 })
db.posts.createIndex({ 
  "caption": "text", 
  "tags": "text" 
})
db.posts.createIndex({ 
  "creator": 1, 
  "tags": 1, 
  "createdAt": -1 
})
*/

module.exports = mongoose.model('Post', postSchema);