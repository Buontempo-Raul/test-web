// backend/scripts/validateUsers.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function validateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all users directly from collection to see raw data
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    console.log('\n🔍 USER DATA VALIDATION REPORT\n');
    console.log(`Total users in database: ${users.length}\n`);

    // Expected schema structure
    const expectedFields = {
      required: ['username', 'email', 'password', 'profileImage', 'bio', 'website', 'isArtist', 'role', 'active', 'createdAt'],
      optional: ['following', 'followers', 'favorites', 'socialLinks', 'settings', 'lastLogin', 'lastActive', 'updatedAt', '__v', 'resetPasswordToken', 'resetPasswordExpire'],
      nested: {
        socialLinks: ['instagram', 'twitter', 'facebook', 'pinterest'],
        settings: ['emailNotifications', 'privateProfile']
      }
    };

    let healthyUsers = 0;
    let usersWithIssues = 0;
    const issuesSummary = {};

    // Analyze each user
    for (const user of users) {
      let userIssues = [];
      
      // Check required fields
      for (const field of expectedFields.required) {
        if (!(field in user)) {
          userIssues.push(`Missing required field: ${field}`);
          issuesSummary[`missing_${field}`] = (issuesSummary[`missing_${field}`] || 0) + 1;
        }
      }

      // Check nested socialLinks
      if (user.socialLinks) {
        for (const socialField of expectedFields.nested.socialLinks) {
          if (!(socialField in user.socialLinks)) {
            userIssues.push(`Missing socialLinks.${socialField}`);
            issuesSummary[`missing_socialLinks_${socialField}`] = (issuesSummary[`missing_socialLinks_${socialField}`] || 0) + 1;
          }
        }
      } else {
        userIssues.push('Missing socialLinks object');
        issuesSummary['missing_socialLinks'] = (issuesSummary['missing_socialLinks'] || 0) + 1;
      }

      // Check nested settings
      if (user.settings) {
        for (const settingField of expectedFields.nested.settings) {
          if (!(settingField in user.settings)) {
            userIssues.push(`Missing settings.${settingField}`);
            issuesSummary[`missing_settings_${settingField}`] = (issuesSummary[`missing_settings_${settingField}`] || 0) + 1;
          }
        }
      } else {
        userIssues.push('Missing settings object');
        issuesSummary['missing_settings'] = (issuesSummary['missing_settings'] || 0) + 1;
      }

      // Check timestamp consistency
      if (user.lastActive && !user.lastLogin) {
        userIssues.push('Has lastActive but missing lastLogin');
        issuesSummary['timestamp_inconsistency'] = (issuesSummary['timestamp_inconsistency'] || 0) + 1;
      }

      // Check for valid role
      if (user.role && !['user', 'admin'].includes(user.role)) {
        userIssues.push(`Invalid role: ${user.role}`);
        issuesSummary['invalid_role'] = (issuesSummary['invalid_role'] || 0) + 1;
      }

      // Check for valid email format
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (user.email && !emailRegex.test(user.email)) {
        userIssues.push(`Invalid email format: ${user.email}`);
        issuesSummary['invalid_email'] = (issuesSummary['invalid_email'] || 0) + 1;
      }

      // Check username length
      if (user.username && user.username.length < 3) {
        userIssues.push(`Username too short: ${user.username}`);
        issuesSummary['short_username'] = (issuesSummary['short_username'] || 0) + 1;
      }

      // Report user status
      if (userIssues.length === 0) {
        console.log(`✅ ${user.username} - All good`);
        healthyUsers++;
      } else {
        console.log(`❌ ${user.username} (${user._id}):`);
        userIssues.forEach(issue => console.log(`   - ${issue}`));
        usersWithIssues++;
      }
    }

    // Summary Report
    console.log('\n' + '='.repeat(50));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total users: ${users.length}`);
    console.log(`Healthy users: ${healthyUsers}`);
    console.log(`Users with issues: ${usersWithIssues}`);
    console.log(`Health score: ${Math.round((healthyUsers / users.length) * 100)}%`);

    if (Object.keys(issuesSummary).length > 0) {
      console.log('\n📈 ISSUES BREAKDOWN:');
      Object.entries(issuesSummary)
        .sort((a, b) => b[1] - a[1])
        .forEach(([issue, count]) => {
          console.log(`  ${issue}: ${count} users`);
        });
    }

    // Detailed user analysis
    console.log('\n📋 DETAILED ANALYSIS:');
    
    // Role distribution
    const roleCounts = {};
    users.forEach(user => {
      const role = user.role || 'undefined';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    console.log('\nRole distribution:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} users`);
    });

    // Artist distribution
    const artistCount = users.filter(user => user.isArtist === true).length;
    console.log(`\nArtists: ${artistCount} users`);

    // Active users
    const activeCount = users.filter(user => user.active === true).length;
    const inactiveCount = users.filter(user => user.active === false).length;
    const undefinedActiveCount = users.filter(user => user.active === undefined).length;
    console.log(`\nActive status:`);
    console.log(`  Active: ${activeCount} users`);
    console.log(`  Inactive: ${inactiveCount} users`);
    console.log(`  Undefined: ${undefinedActiveCount} users`);

    // Profile image analysis
    const defaultProfileCount = users.filter(user => 
      user.profileImage === 'uploads/default-profile.jpg' || 
      user.profileImage === 'default-profile.jpg'
    ).length;
    const customProfileCount = users.filter(user => 
      user.profileImage && 
      user.profileImage !== 'uploads/default-profile.jpg' && 
      user.profileImage !== 'default-profile.jpg'
    ).length;
    console.log(`\nProfile images:`);
    console.log(`  Default: ${defaultProfileCount} users`);
    console.log(`  Custom: ${customProfileCount} users`);

    // Recent activity
    const now = new Date();
    const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const recentlyActive = users.filter(user => {
      const lastActivity = user.lastLogin || user.lastActive;
      return lastActivity && new Date(lastActivity) > last30Days;
    }).length;
    console.log(`\nRecent activity (last 30 days): ${recentlyActive} users`);

    console.log('\n' + '='.repeat(50));
    
    if (usersWithIssues === 0) {
      console.log('🎉 All users have consistent schema! No issues found.');
    } else {
      console.log(`⚠️  ${usersWithIssues} users need attention.`);
      console.log('\nTo fix issues, run:');
      console.log('  node backend/scripts/migrateUserSchema.js');
      console.log('  node backend/scripts/migrateTimestamps.js');
    }

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');

  } catch (error) {
    console.error('Error during validation:', error);
    process.exit(1);
  }
}

// Run validation
validateUsers();