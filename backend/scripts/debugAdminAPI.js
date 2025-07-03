// backend/scripts/debugAdminAPI.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function debugAdminAPI() {
  console.log('🔍 DEBUGGING ADMIN API CONNECTIVITY\n');
  
  try {
    // Test 1: Basic server health
    console.log('1️⃣ Testing basic server health...');
    try {
      const response = await axios.get(`${BASE_URL}/api/test`);
      console.log('✅ Server is responding');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data.message}`);
    } catch (error) {
      console.log('❌ Server is not responding');
      console.log('   Make sure your backend is running on port 5000');
      console.log('   Run: cd backend && npm run dev');
      return;
    }

    // Test 2: Check if admin routes are registered
    console.log('\n2️⃣ Testing admin route registration...');
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/test-public`);
      console.log('✅ Admin routes are registered');
      console.log(`   Status: ${response.status}`);
    } catch (error) {
      console.log('❌ Admin routes are NOT registered');
      console.log('   Error:', error.response?.status || error.message);
      console.log('\n🔧 FIX NEEDED: Add admin routes to your backend/index.js');
      console.log('   Add this line: app.use(\'/api/admin\', require(\'./routes/admin\'));');
      return;
    }

    // Test 3: Test protected admin endpoint (should fail without auth)
    console.log('\n3️⃣ Testing protected admin endpoint (should fail)...');
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/test`);
      console.log('⚠️  Admin endpoint accessible without auth - SECURITY ISSUE!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Admin endpoint properly protected');
        console.log('   Status: 401 Unauthorized (expected)');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status} - ${error.message}`);
      }
    }

    // Test 4: Test admin endpoint with simulated token
    console.log('\n4️⃣ Testing admin endpoint with auth token...');
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/test`, {
        headers: {
          'Authorization': 'Bearer simulated_token_123'
        }
      });
      console.log('✅ Admin endpoint accessible with token');
      console.log(`   Message: ${response.data.message}`);
      console.log(`   User: ${response.data.user}`);
    } catch (error) {
      console.log('❌ Admin endpoint failed with token');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message}`);
      
      if (error.response?.status === 401) {
        console.log('\n🔧 TOKEN ISSUE: The simulated token is not working');
        console.log('   This means you need to either:');
        console.log('   1. Use real JWT authentication, OR');
        console.log('   2. Temporarily bypass auth for testing');
      }
    }

    // Test 5: Check specific admin endpoints
    console.log('\n5️⃣ Testing specific admin endpoints...');
    const endpoints = [
      '/api/admin/dashboard/stats',
      '/api/admin/dashboard/activity', 
      '/api/admin/users',
      '/api/admin/posts',
      '/api/admin/artworks',
      '/api/admin/auctions'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': 'Bearer simulated_token_123'
          }
        });
        console.log(`✅ ${endpoint} - Working`);
      } catch (error) {
        console.log(`❌ ${endpoint} - Status: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }

  console.log('\n📋 DEBUGGING COMPLETE');
  console.log('Check the results above to identify the issue.');
}

// Helper function to test frontend API calls
function testFrontendAPI() {
  console.log('\n🌐 FRONTEND API TEST');
  console.log('Open browser console and run this:');
  console.log(`
// Test admin API from frontend
fetch('/api/admin/dashboard/stats', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('Admin API Response:', data))
.catch(err => console.error('Admin API Error:', err));

// Check what token is stored
console.log('Stored token:', localStorage.getItem('token'));
console.log('Stored user:', JSON.parse(localStorage.getItem('user') || '{}'));
  `);
}

debugAdminAPI().then(() => {
  testFrontendAPI();
});