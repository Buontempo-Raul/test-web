// backend/scripts/testConnection.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas successfully!');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Count documents in users collection
    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`Number of users: ${userCount}`);
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testConnection();