// backend/scripts/makeUserAdmin.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function makeUserAdmin() {
  try {
    console.log('🔗 Connecting to database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Import User model
    const User = require('../models/User');
    
    // Get username from command line argument
    const username = process.argv[2];
    
    if (!username) {
      console.log('\n❌ Please provide a username!');
      console.log('📝 Usage: node makeUserAdmin.js <username>');
      console.log('📝 Example: node makeUserAdmin.js john_artist');
      
      // Show available users
      const users = await User.find({}).select('username email role');
      if (users.length > 0) {
        console.log('\n👥 Available users:');
        users.forEach(user => {
          console.log(`   - ${user.username} (${user.email}) [${user.role || 'user'}]`);
        });
      }
      
      await mongoose.connection.close();
      return;
    }

    // Find the user
    const user = await User.findOne({ username: username });
    
    if (!user) {
      console.log(`\n❌ User "${username}" not found!`);
      
      // Show available users
      const users = await User.find({}).select('username email');
      if (users.length > 0) {
        console.log('\n👥 Available users:');
        users.forEach(u => {
          console.log(`   - ${u.username} (${u.email})`);
        });
      }
      
      await mongoose.connection.close();
      return;
    }

    // Check if already admin
    if (user.role === 'admin') {
      console.log(`\n✅ User "${username}" is already an admin!`);
      console.log(`👑 Admin: ${user.username} (${user.email})`);
      await mongoose.connection.close();
      return;
    }

    // Make user admin
    console.log(`\n🔄 Making "${username}" an admin...`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🎨 Is Artist: ${user.isArtist ? 'Yes' : 'No'}`);
    
    // Update user role
    user.role = 'admin';
    user.isArtist = true; // Admins should also be artists to access all features
    user.active = true;   // Make sure they're active
    
    await user.save();
    
    console.log('\n🎉 SUCCESS!');
    console.log(`👑 ${user.username} is now an admin!`);
    console.log('\n📋 Updated user info:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Is Artist: ${user.isArtist}`);
    console.log(`   Active: ${user.active}`);
    
    console.log('\n💡 You can now login with this user to access the admin dashboard!');
    console.log('🔗 Admin dashboard: http://localhost:3000/admin');
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error making user admin:', error);
    process.exit(1);
  }
}

// Run the script
makeUserAdmin();