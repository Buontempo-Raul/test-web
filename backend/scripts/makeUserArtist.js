// backend/scripts/makeUserArtist.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import required models
const User = require('../models/User');

async function makeUserArtist() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get username from command line arguments
    const username = process.argv[3];
    
    if (!username) {
      console.log('Usage: node makeUserArtist.js --make <username>');
      console.log('Example: node makeUserArtist.js --make john_doe');
      await mongoose.connection.close();
      return;
    }

    // Find the user
    const user = await User.findOne({ username: username });
    
    if (!user) {
      console.log(`User "${username}" not found.`);
      
      // Show available users
      const users = await User.find({}, 'username email isArtist').limit(10);
      if (users.length > 0) {
        console.log('\nAvailable users:');
        users.forEach(u => {
          console.log(`- ${u.username} (${u.email}) - Artist: ${u.isArtist ? 'Yes' : 'No'}`);
        });
      }
      
      await mongoose.connection.close();
      return;
    }

    // Check if user is already an artist
    if (user.isArtist) {
      console.log(`User "${username}" is already an artist!`);
    } else {
      // Make user an artist
      user.isArtist = true;
      await user.save();
      console.log(`✅ User "${username}" is now an artist!`);
    }

    console.log('\nUser details:');
    console.log(`- Username: ${user.username}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Is Artist: ${user.isArtist}`);
    console.log(`- Role: ${user.role}`);

    await mongoose.connection.close();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Function to list all users
async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'username email isArtist role createdAt');
    
    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      console.log(`Found ${users.length} users:\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Artist: ${user.isArtist ? 'Yes' : 'No'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt?.toDateString() || 'Unknown'}`);
        console.log('');
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Main execution
const command = process.argv[2];

if (command === '--make') {
  makeUserArtist();
} else if (command === '--list') {
  listUsers();
} else {
  console.log('Make User Artist Script');
  console.log('');
  console.log('Commands:');
  console.log('  --list                     List all users');
  console.log('  --make <username>          Make a user an artist');
  console.log('');
  console.log('Examples:');
  console.log('  node makeUserArtist.js --list');
  console.log('  node makeUserArtist.js --make john_doe');
}