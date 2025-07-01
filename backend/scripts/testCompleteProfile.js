// backend/scripts/testCompleteProfileSystem.js
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const API_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

async function testCompleteProfileSystem() {
  try {
    console.log('🧪 COMPLETE PROFILE SYSTEM TEST\n');
    console.log('Testing both API endpoints and post data structure...\n');

    // Connect to MongoDB to get test data
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('../models/User');
    const Post = require('../models/Post');

    // Test 1: Profile API endpoints
    console.log('📋 TEST 1: Profile API Endpoints');
    console.log('-'.repeat(40));

    const testUsers = ['admin', 'virgil', 'art_lover', 'test', 'buontempo'];
    let profileApiPassed = 0;

    for (const username of testUsers) {
      try {
        const response = await axios.get(`${API_URL}/api/users/${username}`);
        if (response.data.success && response.data.user.username === username) {
          console.log(`✅ ${username}: Profile API working`);
          profileApiPassed++;
        } else {
          console.log(`❌ ${username}: Profile API returned invalid data`);
        }
      } catch (error) {
        console.log(`❌ ${username}: Profile API failed (${error.response?.status})`);
      }
    }

    // Test 2: Posts API and Creator Data
    console.log(`\n📋 TEST 2: Posts API Creator Data`);
    console.log('-'.repeat(40));

    let postsApiPassed = true;
    try {
      const postsResponse = await axios.get(`${API_URL}/api/posts`);
      
      if (postsResponse.data.success && postsResponse.data.posts) {
        const posts = postsResponse.data.posts;
        console.log(`Found ${posts.length} posts from API`);
        
        let validCreators = 0;
        let invalidCreators = 0;
        
        for (const post of posts.slice(0, 5)) { // Test first 5 posts
          if (post.creator && post.creator.username) {
            console.log(`✅ Post ${post._id.slice(-6)}: Creator = ${post.creator.username}`);
            validCreators++;
          } else {
            console.log(`❌ Post ${post._id.slice(-6)}: Missing creator username`);
            console.log(`   Creator data:`, JSON.stringify(post.creator));
            invalidCreators++;
          }
        }
        
        if (invalidCreators > 0) {
          console.log(`⚠️  ${invalidCreators} posts missing creator data - profile links won't work`);
          postsApiPassed = false;
        } else {
          console.log(`✅ All tested posts have valid creator data`);
        }
      } else {
        console.log(`❌ Posts API failed or returned invalid structure`);
        postsApiPassed = false;
      }
    } catch (error) {
      console.log(`❌ Posts API failed: ${error.response?.status} - ${error.message}`);
      postsApiPassed = false;
    }

    // Test 3: Database Post-User Relationships
    console.log(`\n📋 TEST 3: Database Post-User Relationships`);
    console.log('-'.repeat(40));

    const dbPosts = await Post.find({})
      .populate('creator', 'username _id')
      .limit(10);
    
    let dbRelationshipsPassed = true;
    let validDbPosts = 0;
    let invalidDbPosts = 0;

    for (const post of dbPosts) {
      if (post.creator && post.creator.username) {
        validDbPosts++;
      } else {
        invalidDbPosts++;
        console.log(`❌ DB Post ${post._id}: Invalid creator reference`);
        dbRelationshipsPassed = false;
      }
    }

    if (dbRelationshipsPassed) {
      console.log(`✅ All ${validDbPosts} database posts have valid creator references`);
    } else {
      console.log(`⚠️  ${invalidDbPosts} database posts have invalid creator references`);
    }

    // Test 4: Navigation URL Structure
    console.log(`\n📋 TEST 4: Navigation URL Structure`);
    console.log('-'.repeat(40));

    const users = await User.find({}).select('username _id').limit(5);
    let navigationPassed = true;

    for (const user of users) {
      // Simulate what PostCard would do with FIXED code
      const correctUrl = `/profile/${user.username}`;
      const incorrectUrl = `/profile/${user._id}`;
      
      console.log(`User: ${user.username}`);
      console.log(`  ✅ Correct URL: ${correctUrl}`);
      console.log(`  ❌ Wrong URL:   ${incorrectUrl}`);
      
      // Test if the correct URL would work
      try {
        const testResponse = await axios.get(`${API_URL}/api/users/${user.username}`);
        if (testResponse.data.success) {
          console.log(`  ✅ URL ${correctUrl} would work`);
        } else {
          console.log(`  ❌ URL ${correctUrl} would fail`);
          navigationPassed = false;
        }
      } catch (error) {
        console.log(`  ❌ URL ${correctUrl} would fail (${error.response?.status})`);
        navigationPassed = false;
      }
    }

    // Overall Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 OVERALL TEST RESULTS');
    console.log('='.repeat(60));

    const allTestsPassed = (profileApiPassed === testUsers.length) && 
                          postsApiPassed && 
                          dbRelationshipsPassed && 
                          navigationPassed;

    console.log(`Profile API Tests: ${profileApiPassed}/${testUsers.length} passed`);
    console.log(`Posts API Test: ${postsApiPassed ? 'PASS' : 'FAIL'}`);
    console.log(`Database Relationships: ${dbRelationshipsPassed ? 'PASS' : 'FAIL'}`);
    console.log(`Navigation URLs: ${navigationPassed ? 'PASS' : 'FAIL'}`);

    if (allTestsPassed) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('\nProfile system should work correctly:');
      console.log('✅ Profile tab navigation works');
      console.log('✅ Clicking usernames in posts works');
      console.log('✅ Direct profile URLs work');
      console.log('✅ All APIs return proper data');
      
      console.log('\n📱 Test these URLs in your browser:');
      testUsers.forEach(username => {
        console.log(`- http://localhost:3000/profile/${username}`);
      });
    } else {
      console.log('\n❌ SOME TESTS FAILED');
      
      if (profileApiPassed < testUsers.length) {
        console.log('\n🔧 Profile API Issues:');
        console.log('- Some profile endpoints are not working');
        console.log('- Check backend routes and user data');
      }
      
      if (!postsApiPassed) {
        console.log('\n🔧 Posts API Issues:');
        console.log('- Posts are not returning creator username data');
        console.log('- Update posts API to populate creator properly');
        console.log('- PostCard profile links will fail without this');
      }
      
      if (!dbRelationshipsPassed) {
        console.log('\n🔧 Database Issues:');
        console.log('- Some posts reference invalid/deleted users');
        console.log('- Run user migration scripts');
        console.log('- Clean up orphaned posts');
      }
      
      if (!navigationPassed) {
        console.log('\n🔧 Navigation Issues:');
        console.log('- Profile URLs not working properly');
        console.log('- Check route configuration');
      }
    }

    await mongoose.connection.close();

  } catch (error) {
    console.error('Test script error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('- Backend server is running');
    console.log('- Database is accessible');
    console.log('- Environment variables are set correctly');
  }
}

testCompleteProfileSystem();