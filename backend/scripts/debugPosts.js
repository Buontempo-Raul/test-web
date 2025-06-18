// backend/scripts/debugPosts.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import all required models
const User = require('../models/User'); // Import User model first
const Post = require('../models/Post');

async function debugPosts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all posts
    const posts = await Post.find()
      .populate('creator', 'username')
      .sort({ createdAt: -1 });

    console.log(`\nFound ${posts.length} posts:\n`);

    posts.forEach((post, index) => {
      console.log(`Post ${index + 1}:`);
      console.log(`- ID: ${post._id}`);
      console.log(`- Creator: ${post.creator?.username || 'Unknown'}`);
      console.log(`- Caption: ${post.caption || 'No caption'}`);
      console.log(`- Content Type: ${post.content.type}`);
      console.log(`- URL: ${post.content.url || 'No URL'}`);
      
      if (post.content.type === 'carousel') {
        console.log(`- Carousel Items:`);
        post.content.items?.forEach((item, i) => {
          console.log(`  Item ${i + 1}: ${item.type} - ${item.url}`);
        });
      }
      
      console.log(`- Created: ${post.createdAt}`);
      console.log('---');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugPosts();