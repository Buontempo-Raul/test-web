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
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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

// Basic indexes
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });

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

// New indexes for like functionality
postSchema.index({ likedBy: 1 }); // For checking if user liked post
postSchema.index({ likes: -1 }); // For sorting by popularity

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

// Instance methods
postSchema.methods.isLikedByUser = function(userId) {
  return this.likedBy.some(likedUserId => likedUserId.toString() === userId.toString());
};

postSchema.methods.toggleLike = async function(userId) {
  const hasLiked = this.isLikedByUser(userId);
  
  if (hasLiked) {
    // Unlike: Remove user from likedBy array and decrement count
    this.likedBy = this.likedBy.filter(likedUserId => 
      likedUserId.toString() !== userId.toString()
    );
    this.likes = Math.max(0, this.likes - 1);
    return { liked: false, likes: this.likes };
  } else {
    // Like: Add user to likedBy array and increment count
    this.likedBy.push(userId);
    this.likes = this.likes + 1;
    return { liked: true, likes: this.likes };
  }
};

// Virtual properties
postSchema.virtual('likesCount').get(function() {
  return this.likedBy ? this.likedBy.length : this.likes;
});

postSchema.virtual('commentsCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Middleware to ensure data consistency
postSchema.pre('save', function(next) {
  // Ensure likes count matches likedBy array length
  if (this.likedBy) {
    this.likes = this.likedBy.length;
  }
  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;