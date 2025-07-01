// Save this as: backend/scripts/testAPI.js
// This tests your API endpoints to make sure they're working

const http = require('http');

const testAPI = async () => {
  console.log('🌐 Testing Auction Purchase API...\n');
  
  const makeRequest = (path) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  };
  
  try {
    // Test 1: Basic server health
    console.log('1️⃣ Testing basic server health...');
    try {
      const healthResponse = await makeRequest('/api/test');
      if (healthResponse.status === 200) {
        console.log('✅ Server is running and responding');
        console.log(`   Status: ${healthResponse.status}`);
        console.log(`   Response: ${healthResponse.body.substring(0, 100)}...`);
      } else {
        console.log(`❌ Server responded with status: ${healthResponse.status}`);
        console.log(`   Response: ${healthResponse.body}`);
      }
    } catch (error) {
      console.log('❌ Server health check failed');
      console.log(`   Error: ${error.message}`);
      console.log('\n💡 Make sure your backend server is running:');
      console.log('   cd backend && npm run dev');
      return;
    }
    
    // Test 2: Auction purchases API test endpoint
    console.log('\n2️⃣ Testing auction purchases API...');
    try {
      const testResponse = await makeRequest('/api/auction-purchases/test');
      if (testResponse.status === 200) {
        console.log('✅ Auction purchases API is working');
        console.log(`   Response: ${testResponse.body}`);
      } else {
        console.log(`❌ Auction purchases API failed with status: ${testResponse.status}`);
        console.log(`   Response: ${testResponse.body}`);
      }
    } catch (error) {
      console.log('❌ Auction purchases API test failed');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 3: Your specific auction purchase
    console.log('\n3️⃣ Testing your specific auction purchase...');
    const auctionId = '8ee08e06-fc5d-4639-b5dc-bcff68faadb3';
    
    try {
      const auctionResponse = await makeRequest(`/api/auction-purchases/${auctionId}`);
      
      console.log(`   Status: ${auctionResponse.status}`);
      console.log(`   Content-Type: ${auctionResponse.headers['content-type']}`);
      
      if (auctionResponse.status === 200) {
        // Try to parse as JSON
        try {
          const data = JSON.parse(auctionResponse.body);
          console.log('✅ SUCCESS! Your auction purchase API is working!');
          console.log(`   Artwork: ${data.purchase.artwork.title}`);
          console.log(`   Winner: ${data.purchase.winner.username}`);
          console.log(`   Status: ${data.purchase.status}`);
          console.log(`   Winning Bid: $${data.purchase.winningBid}`);
          console.log('\n🎉 Your frontend should now work!');
          console.log(`   Try: http://localhost:3000/auction-purchase/${auctionId}`);
        } catch (parseError) {
          console.log('❌ Response is not valid JSON');
          console.log(`   Response: ${auctionResponse.body.substring(0, 200)}...`);
        }
      } else if (auctionResponse.status === 404) {
        console.log('❌ Auction purchase not found (404)');
        console.log('   But we know it exists in the database...');
        console.log('   This suggests a routing or controller issue.');
      } else {
        console.log(`❌ Unexpected status: ${auctionResponse.status}`);
        console.log(`   Response: ${auctionResponse.body.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log('❌ Failed to connect to auction purchase endpoint');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 4: Debug endpoint
    console.log('\n4️⃣ Testing debug endpoint...');
    try {
      const debugResponse = await makeRequest(`/api/auction-purchases/debug/${auctionId}`);
      if (debugResponse.status === 200) {
        const debugData = JSON.parse(debugResponse.body);
        console.log('✅ Debug endpoint working');
        console.log(`   Found exact match: ${debugData.debug.exactMatch.found ? 'YES' : 'NO'}`);
        console.log(`   Total purchases in DB: ${debugData.debug.allPurchases.length}`);
      }
    } catch (error) {
      console.log('❌ Debug endpoint failed');
      console.log(`   Error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error during API testing:', error);
  }
  
  console.log('\n📋 TEST COMPLETE');
  console.log('If all tests pass, your issue is likely in the frontend.');
  console.log('If tests fail, check your backend server configuration.');
};

testAPI();