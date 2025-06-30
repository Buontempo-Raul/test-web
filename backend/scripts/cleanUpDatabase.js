// backend/scripts/cleanupDatabase.js - FIXED VERSION with better connection handling

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from the correct path
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded .env file from:', envPath);
} else {
  console.log('⚠️ No .env file found, using default environment variables');
  dotenv.config();
}

// Display connection info for debugging
const showConnectionInfo = () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/your-db-name';
  console.log('\n🔍 Connection Information:');
  console.log('MONGODB_URI:', mongoUri);
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  
  // Mask password in URI for security
  const maskedUri = mongoUri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  console.log('Using connection string:', maskedUri);
};

// Enhanced connection function with better error handling
const connectDB = async () => {
  try {
    showConnectionInfo();
    
    // Try multiple possible MongoDB URI environment variables
    const mongoUri = 
      process.env.MONGODB_URI || 
      process.env.MONGO_URI || 
      process.env.DATABASE_URL ||
      'mongodb://localhost:27017/your-db-name';

    console.log('\n🔄 Attempting to connect to MongoDB...');

    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoUri, connectionOptions);
    
    console.log('✅ MongoDB connected successfully');
    
    // Test the connection by getting database info
    const db = mongoose.connection.db;
    const admin = db.admin();
    const info = await admin.serverStatus();
    console.log('📊 MongoDB Server Info:');
    console.log(`   Version: ${info.version}`);
    console.log(`   Host: ${info.host}`);
    console.log(`   Database: ${db.databaseName}`);
    
  } catch (error) {
    console.error('\n❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    
    // Provide specific troubleshooting based on error type
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Troubleshooting Steps:');
      console.log('1. Check if MongoDB is running:');
      console.log('   - Local: brew services start mongodb/brew/mongodb-community');
      console.log('   - Local: sudo systemctl start mongod');
      console.log('   - Docker: docker run -d -p 27017:27017 mongo');
      console.log('');
      console.log('2. Verify your connection string in .env file:');
      console.log('   MONGODB_URI=mongodb://localhost:27017/your-database-name');
      console.log('   or');
      console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n🔧 Authentication Issue:');
      console.log('Check your username/password in the connection string');
    } else if (error.message.includes('ServerSelectionTimeoutError')) {
      console.log('\n🔧 Network/Firewall Issue:');
      console.log('Check if MongoDB Atlas IP whitelist includes your IP');
      console.log('Or check if local MongoDB is bound to the correct interface');
    }
    
    process.exit(1);
  }
};

// Test MongoDB connection without doing anything else
const testConnection = async () => {
  try {
    await connectDB();
    
    // Get basic collection counts
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n📋 Available Collections:');
    for (const collection of collections) {
      try {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`   ${collection.name}: ${count} documents`);
      } catch (err) {
        console.log(`   ${collection.name}: Error counting documents`);
      }
    }
    
    console.log('\n✅ Connection test successful!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

// Check if MongoDB is accessible and show environment
const checkEnvironment = () => {
  console.log('🔍 Environment Check:');
  console.log('Current directory:', process.cwd());
  console.log('Script location:', __filename);
  
  // Check for .env file
  const envPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '.env')
  ];
  
  console.log('\n📁 Checking for .env files:');
  envPaths.forEach(envPath => {
    if (fs.existsSync(envPath)) {
      console.log(`✅ Found: ${envPath}`);
      
      // Read and show relevant environment variables (without passwords)
      const envContent = fs.readFileSync(envPath, 'utf8');
      const mongoLines = envContent.split('\n').filter(line => 
        line.includes('MONGO') || line.includes('DATABASE_URL')
      );
      
      if (mongoLines.length > 0) {
        console.log('   MongoDB-related variables:');
        mongoLines.forEach(line => {
          // Mask passwords for security
          const maskedLine = line.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
          console.log(`   ${maskedLine}`);
        });
      }
    } else {
      console.log(`❌ Not found: ${envPath}`);
    }
  });
  
  console.log('\n🌍 Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('PORT:', process.env.PORT || 'not set');
  
  // Show MongoDB URI (masked)
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'not set';
  if (mongoUri !== 'not set') {
    const maskedUri = mongoUri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
    console.log('MONGODB_URI:', maskedUri);
  } else {
    console.log('MONGODB_URI: not set');
  }
};

// Create a simple connection test script
const createConnectionTest = () => {
  const testScript = `
// Quick MongoDB connection test
const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    console.log('Testing connection to:', uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@'));
    
    await mongoose.connect(uri);
    console.log('✅ MongoDB connection successful!');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

testConnection();
`;

  const testFilePath = path.join(__dirname, 'testConnection.js');
  fs.writeFileSync(testFilePath, testScript);
  console.log(`✅ Created connection test file: ${testFilePath}`);
  console.log('Run with: node testConnection.js');
};

// Rest of the original script functions would go here...
// (I'm keeping this short to focus on the connection issue)

// Main execution with enhanced error handling
const main = async () => {
  const command = process.argv[2];

  switch (command) {
    case 'test':
      await testConnection();
      break;

    case 'env':
    case 'check':
      checkEnvironment();
      break;

    case 'create-test':
      createConnectionTest();
      break;

    case 'fix':
      console.log('🔧 MongoDB Connection Fix Guide:');
      console.log('\n1. Check if MongoDB is running:');
      console.log('   Local MongoDB:');
      console.log('   - macOS: brew services start mongodb/brew/mongodb-community');
      console.log('   - Ubuntu: sudo systemctl start mongod');
      console.log('   - Windows: net start MongoDB');
      console.log('   - Docker: docker run -d -p 27017:27017 --name mongodb mongo');
      console.log('\n2. Check your .env file:');
      console.log('   Create or update backend/.env with:');
      console.log('   MONGODB_URI=mongodb://localhost:27017/your-database-name');
      console.log('\n3. If using MongoDB Atlas:');
      console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
      console.log('\n4. Test the connection:');
      console.log('   node cleanupDatabase.js test');
      break;

    default:
      console.log('🔧 MongoDB Connection Troubleshooter');
      console.log('\nCommands:');
      console.log('  node cleanupDatabase.js test        - Test MongoDB connection');
      console.log('  node cleanupDatabase.js env         - Check environment variables');
      console.log('  node cleanupDatabase.js fix         - Show connection fix guide');
      console.log('  node cleanupDatabase.js create-test - Create simple connection test');
      console.log('\n⚠️ Fix your MongoDB connection before running cleanup commands!');
      break;
  }
};

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n\n⚠️ Process interrupted.');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

// Run the script
main().catch(async (error) => {
  console.error('\n❌ Script execution failed:', error);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(1);
});