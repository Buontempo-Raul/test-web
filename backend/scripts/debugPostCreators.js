// backend/scripts/debugPostCreators.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function debugPostCreators() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Import models
    const Post = require('../models/Post');
    const User = require('../models/User');

    console.log('\n🔍 POST CREATOR DATA DEBUGGING\n');
    console.log('='.repeat(60));

    // Get posts to check creator population
    const posts = await Post.find({})
      .populate('creator', 'username profileImage _id')
      .limit(10)
      .sort({ createdAt: -1 });

    if (posts.length === 0) {
      console.log('❌ No posts found in database');
      return;
    }

    console.log(`Found ${posts.length} posts to analyze:\n`);

    let validPosts = 0;
    let invalidPosts = 0;

    for (const post of posts) {
      console.log(`📝 Post ID: ${post._id}`);
      console.log(`   Created: ${post.createdAt?.toLocaleDateString() || 'Unknown'}`);
      
      // Check creator data
      if (post.creator) {
        if (typeof post.creator === 'object' && post.creator.username) {
          console.log(`   ✅ Creator: ${post.creator.username} (${post.creator._id})`);
          console.log(`   📷 Profile: ${post.creator.profileImage || 'No image'}`);
          validPosts++;
        } else if (typeof post.creator === 'string') {
          console.log(`   ⚠️  Creator: ${post.creator} (ID only - not populated)`);
          
          // Try to get the user manually
          try {
            const user = await User.findById(post.creator).select('username _id');
            if (user) {
              console.log(`   🔍 Manual lookup: ${user.username}`);
            } else {
              console.log(`   ❌ User ${post.creator} not found in database`);
            }
          } catch (error) {
            console.log(`   ❌ Error looking up user: ${error.message}`);
          }
          invalidPosts++;
        } else {
          console.log(`   ❌ Creator data invalid: ${JSON.stringify(post.creator)}`);
          invalidPosts++;
        }
      } else {
        console.log(`   ❌ No creator data`);
        invalidPosts++;
      }
      
      console.log(''); // Empty line
    }

    console.log('='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Valid posts (with creator username): ${validPosts}`);
    console.log(`Invalid posts (missing creator data): ${invalidPosts}`);
    console.log(`Total posts analyzed: ${posts.length}`);

    if (invalidPosts > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      console.log('Some posts have missing or incomplete creator data.');
      console.log('\nPossible causes:');
      console.log('1. Posts were created before proper population was implemented');
      console.log('2. Users were deleted but posts remain');
      console.log('3. Population is not working in the API endpoints');
      
      console.log('\n🔧 SOLUTIONS:');
      console.log('1. Check that your getPosts API properly populates creator:');
      console.log('   .populate("creator", "username profileImage _id")');
      console.log('2. Clean up orphaned posts with deleted users');
      console.log('3. Update existing posts to ensure valid creator references');
    } else {
      console.log('\n✅ All posts have valid creator data!');
      console.log('Profile links should work correctly.');
    }

    console.log('\n🔍 API ENDPOINT CHECK:');
    console.log('Verify that your posts API endpoints include:');
    console.log('```javascript');
    console.log('const posts = await Post.find({})');
    console.log('  .populate("creator", "username profileImage _id")');
    console.log('  .sort({ createdAt: -1 });');
    console.log('```');

    // Test a specific post API call structure
    console.log('\n📋 SAMPLE POST STRUCTURE:');
    if (validPosts > 0) {
      const samplePost = posts.find(p => p.creator && p.creator.username);
      if (samplePost) {
        console.log('A properly structured post should look like:');
        console.log(JSON.stringify({
          _id: samplePost._id,
          creator: {
            _id: samplePost.creator._id,
            username: samplePost.creator.username,
            profileImage: samplePost.creator.profileImage
          },
          caption: samplePost.caption || 'Sample caption',
          createdAt: samplePost.createdAt
        }, null, 2));
      }
    }

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');

  } catch (error) {
    console.error('Debug script error:', error);
  }
}

debugPostCreators();