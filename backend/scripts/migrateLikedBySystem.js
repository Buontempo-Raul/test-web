const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('../models/Post');

async function migrateLikedByField() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await Post.updateMany(
      { likedBy: { $exists: false } },
      { 
        $set: { 
          likedBy: [],
          likes: 0 
        } 
      }
    );

    console.log(`Updated ${result.modifiedCount} posts with likedBy field`);
    
    await mongoose.connection.close();
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateLikedByField();