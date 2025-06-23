// backend/scripts/migrateLikeSystem.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import models
const Post = require('../models/Post');

async function migrateLikeSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all posts that don't have the likedBy field
    const postsToUpdate = await Post.find({
      $or: [
        { likedBy: { $exists: false } },
        { likedBy: null }
      ]
    });

    console.log(`Found ${postsToUpdate.length} posts to migrate`);

    if (postsToUpdate.length === 0) {
      console.log('No posts need migration. All posts already have the likedBy field.');
      await mongoose.connection.close();
      return;
    }

    // Update each post
    let updateCount = 0;
    for (const post of postsToUpdate) {
      try {
        // Initialize likedBy as empty array
        post.likedBy = [];
        
        // If the post has likes but no likedBy array, we can't recover who liked it
        // So we'll reset the likes count to 0 for data consistency
        if (post.likes > 0) {
          console.log(`Post ${post._id} had ${post.likes} likes but no user tracking. Resetting to 0.`);
          post.likes = 0;
        }

        await post.save();
        updateCount++;
        
        if (updateCount % 100 === 0) {
          console.log(`Migrated ${updateCount} posts...`);
        }
      } catch (error) {
        console.error(`Error updating post ${post._id}:`, error.message);
      }
    }

    console.log(`\nMigration completed! Updated ${updateCount} posts.`);
    console.log('Note: Like counts were reset to 0 for posts that had likes but no user tracking.');
    
    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Alternative migration that preserves like counts (if you want to keep existing counts)
async function migrateLikeSystemPreserveCounts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await Post.updateMany(
      {
        $or: [
          { likedBy: { $exists: false } },
          { likedBy: null }
        ]
      },
      {
        $set: { likedBy: [] }
        // This preserves existing like counts without user tracking
      }
    );

    console.log(`Updated ${result.modifiedCount} posts with empty likedBy arrays`);
    console.log('Warning: Existing like counts preserved but user tracking is not available for old likes');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migration based on command line argument
const preserveCounts = process.argv.includes('--preserve-counts');

if (preserveCounts) {
  console.log('Running migration with preserved like counts...');
  migrateLikeSystemPreserveCounts();
} else {
  console.log('Running migration with reset like counts for data consistency...');
  console.log('Use --preserve-counts flag to keep existing like counts');
  migrateLikeSystem();
}