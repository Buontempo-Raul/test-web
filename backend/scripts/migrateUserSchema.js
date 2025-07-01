// backend/scripts/migrateUserSchema.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function migrateUserSchema() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Import User model
    const User = require('../models/User');

    // Find all users
    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} users in database`);

    console.log('\n🔍 ANALYZING USER INCONSISTENCIES...\n');

    let updateCount = 0;
    const inconsistencies = [];

    for (const user of allUsers) {
      const userIssues = [];
      let needsUpdate = false;
      const updates = {};

      // 1. Check for missing socialLinks
      if (!user.socialLinks) {
        userIssues.push('Missing socialLinks object');
        updates.socialLinks = {
          instagram: '',
          twitter: '',
          facebook: '',
          pinterest: ''
        };
        needsUpdate = true;
      } else {
        // Ensure all socialLinks fields exist
        const requiredSocialFields = ['instagram', 'twitter', 'facebook', 'pinterest'];
        let socialLinksUpdate = { ...user.socialLinks };
        let socialNeedsUpdate = false;
        
        for (const field of requiredSocialFields) {
          if (!(field in user.socialLinks)) {
            userIssues.push(`Missing socialLinks.${field}`);
            socialLinksUpdate[field] = '';
            socialNeedsUpdate = true;
          }
        }
        
        if (socialNeedsUpdate) {
          updates.socialLinks = socialLinksUpdate;
          needsUpdate = true;
        }
      }

      // 2. Check for missing settings
      if (!user.settings) {
        userIssues.push('Missing settings object');
        updates.settings = {
          emailNotifications: true,
          privateProfile: false
        };
        needsUpdate = true;
      } else {
        // Ensure all settings fields exist
        let settingsUpdate = { ...user.settings };
        let settingsNeedsUpdate = false;
        
        if (!('emailNotifications' in user.settings)) {
          userIssues.push('Missing settings.emailNotifications');
          settingsUpdate.emailNotifications = true;
          settingsNeedsUpdate = true;
        }
        
        if (!('privateProfile' in user.settings)) {
          userIssues.push('Missing settings.privateProfile');
          settingsUpdate.privateProfile = false;
          settingsNeedsUpdate = true;
        }
        
        if (settingsNeedsUpdate) {
          updates.settings = settingsUpdate;
          needsUpdate = true;
        }
      }

      // 3. Check for missing active field
      if (!('active' in user.toObject())) {
        userIssues.push('Missing active field');
        updates.active = true;
        needsUpdate = true;
      }

      // 4. Handle lastActive vs lastLogin inconsistency
      if (user.lastActive && !user.lastLogin) {
        userIssues.push('Has lastActive but missing lastLogin (schema uses lastLogin)');
        updates.lastLogin = user.lastActive;
        // Note: We'll keep lastActive for now but the schema should use lastLogin
        needsUpdate = true;
      }

      // 5. Ensure website field exists (can be empty string)
      if (!('website' in user.toObject())) {
        userIssues.push('Missing website field');
        updates.website = '';
        needsUpdate = true;
      }

      // 6. Ensure bio exists (can be empty string)
      if (!('bio' in user.toObject())) {
        userIssues.push('Missing bio field');
        updates.bio = '';
        needsUpdate = true;
      }

      // Log issues found
      if (userIssues.length > 0) {
        inconsistencies.push({
          username: user.username,
          id: user._id,
          issues: userIssues
        });
        
        console.log(`❌ User "${user.username}" (${user._id}):`);
        userIssues.forEach(issue => console.log(`   - ${issue}`));
      }

      // Apply updates if needed
      if (needsUpdate) {
        try {
          await User.findByIdAndUpdate(
            user._id,
            { $set: updates },
            { new: true, runValidators: false } // Skip validators to avoid conflicts
          );
          
          console.log(`✅ Fixed user "${user.username}"`);
          updateCount++;
        } catch (error) {
          console.error(`❌ Error updating user "${user.username}":`, error.message);
        }
      } else {
        console.log(`✅ User "${user.username}" is consistent`);
      }
      
      console.log(''); // Empty line for readability
    }

    // Summary
    console.log('\n=== MIGRATION SUMMARY ===');
    console.log(`Total users processed: ${allUsers.length}`);
    console.log(`Users with inconsistencies: ${inconsistencies.length}`);
    console.log(`Users updated: ${updateCount}`);
    console.log(`Users already consistent: ${allUsers.length - inconsistencies.length}`);

    if (inconsistencies.length > 0) {
      console.log('\n=== INCONSISTENCIES FOUND ===');
      inconsistencies.forEach((item, index) => {
        console.log(`${index + 1}. ${item.username} (${item.id}):`);
        item.issues.forEach(issue => console.log(`   - ${issue}`));
      });
    }

    // Verify final state
    console.log('\n=== VERIFICATION ===');
    const verificationUsers = await User.find({});
    
    let verificationIssues = 0;
    for (const user of verificationUsers) {
      const userObj = user.toObject();
      
      // Check required fields
      const requiredFields = ['socialLinks', 'settings', 'active', 'website', 'bio'];
      for (const field of requiredFields) {
        if (!(field in userObj)) {
          console.log(`❌ User ${user.username} still missing ${field}`);
          verificationIssues++;
        }
      }
      
      // Check nested socialLinks
      if (user.socialLinks) {
        const requiredSocialFields = ['instagram', 'twitter', 'facebook', 'pinterest'];
        for (const field of requiredSocialFields) {
          if (!(field in user.socialLinks)) {
            console.log(`❌ User ${user.username} still missing socialLinks.${field}`);
            verificationIssues++;
          }
        }
      }
      
      // Check nested settings
      if (user.settings) {
        const requiredSettingsFields = ['emailNotifications', 'privateProfile'];
        for (const field of requiredSettingsFields) {
          if (!(field in user.settings)) {
            console.log(`❌ User ${user.username} still missing settings.${field}`);
            verificationIssues++;
          }
        }
      }
    }
    
    if (verificationIssues === 0) {
      console.log('✅ All users now have consistent schema!');
    } else {
      console.log(`❌ ${verificationIssues} verification issues remain`);
    }

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    console.log('✅ User schema migration completed!');

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateUserSchema();