// backend/scripts/updateUserSchema.js
const mongoose = require('mongoose');
const User = require('../models/User');

async function updateUserSchema() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Add new fields to existing users
    await User.updateMany(
      {},
      {
        $set: {
          'socialLinks.instagram': '',
          'socialLinks.twitter': '',
          'socialLinks.facebook': '',
          'socialLinks.pinterest': '',
          'settings.emailNotifications': true,
          'settings.privateProfile': false
        }
      }
    );
    
    console.log('✅ User schema updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user schema:', error);
    process.exit(1);
  }
}

updateUserSchema();