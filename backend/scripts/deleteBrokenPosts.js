// backend/scripts/deleteBrokenPosts.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import all required models
const User = require('../models/User');
const Post = require('../models/Post');

async function deleteBrokenPosts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Count posts before deletion
    const count = await Post.countDocuments();
    console.log(`Found ${count} posts in database`);

    if (count > 0) {
      // Show some info about the posts
      const posts = await Post.find().limit(5).populate('creator', 'username');
      console.log('\nFirst few posts:');
      posts.forEach(post => {
        console.log(`- Caption: "${post.caption || 'No caption'}" by ${post.creator?.username || 'Unknown'}`);
      });

      // Ask for confirmation
      console.log('\nThis will delete ALL posts from the database.');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Delete all posts
      const result = await Post.deleteMany({});
      console.log(`\nDeleted ${result.deletedCount} posts`);
    } else {
      console.log('No posts to delete');
    }

    await mongoose.connection.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if --force flag is provided
if (process.argv[2] === '--force') {
  deleteBrokenPosts();
} else {
  console.log('This script will delete ALL posts from the database.');
  console.log('Run with --force flag to confirm:');
  console.log('  node deleteBrokenPosts.js --force');
}   