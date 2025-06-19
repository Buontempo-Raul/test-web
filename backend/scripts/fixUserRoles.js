// backend/scripts/fixUserRoles.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function fixUserRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Import User model
    const User = require('../models/User');

    // Find all users
    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} users in database`);

    // Find users with invalid roles
    const usersWithInvalidRoles = allUsers.filter(user => 
      user.role && !['user', 'admin'].includes(user.role)
    );

    if (usersWithInvalidRoles.length === 0) {
      console.log('✓ All users have valid roles');
    } else {
      console.log(`\nFound ${usersWithInvalidRoles.length} users with invalid roles:`);
      
      for (const user of usersWithInvalidRoles) {
        console.log(`- ${user.username}: role="${user.role}", isArtist=${user.isArtist}`);
      }

      console.log('\nFixing invalid roles...');
      
      for (const user of usersWithInvalidRoles) {
        const oldRole = user.role;
        
        // If the user was marked as 'artist' role, keep them as regular user but ensure isArtist is true
        if (oldRole === 'artist') {
          user.role = 'user';
          user.isArtist = true;
        } else {
          // For any other invalid role, default to 'user'
          user.role = 'user';
        }
        
        await user.save();
        console.log(`✓ Fixed ${user.username}: "${oldRole}" -> "${user.role}" (isArtist: ${user.isArtist})`);
      }
      
      console.log(`\n✓ Fixed ${usersWithInvalidRoles.length} users`);
    }

    // Summary
    const finalUserCount = await User.countDocuments({ role: 'user' });
    const finalAdminCount = await User.countDocuments({ role: 'admin' });
    const artistCount = await User.countDocuments({ isArtist: true });

    console.log('\n=== Final Summary ===');
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Regular users: ${finalUserCount}`);
    console.log(`Admins: ${finalAdminCount}`);
    console.log(`Artists (isArtist=true): ${artistCount}`);

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    console.log('✓ User roles fixed successfully!');

  } catch (error) {
    console.error('Error fixing user roles:', error);
    process.exit(1);
  }
}

fixUserRoles();