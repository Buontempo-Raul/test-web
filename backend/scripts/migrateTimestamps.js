// backend/scripts/migrateTimestamps.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function migrateTimestamps() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('\n🔄 MIGRATING TIMESTAMP FIELDS...\n');

    // Find users with lastActive but no lastLogin
    const usersToMigrate = await mongoose.connection.db.collection('users').find({
      lastActive: { $exists: true },
      $or: [
        { lastLogin: { $exists: false } },
        { lastLogin: null }
      ]
    }).toArray();

    console.log(`Found ${usersToMigrate.length} users with lastActive but no lastLogin`);

    if (usersToMigrate.length === 0) {
      console.log('✅ No timestamp migration needed');
      await mongoose.connection.close();
      return;
    }

    let migratedCount = 0;
    for (const user of usersToMigrate) {
      try {
        // Copy lastActive to lastLogin
        await mongoose.connection.db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              lastLogin: user.lastActive
            }
          }
        );

        console.log(`✅ Migrated ${user.username}: lastActive (${user.lastActive}) → lastLogin`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Error migrating user ${user.username}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully migrated ${migratedCount} users`);

    // Optional: Remove lastActive field after migration (uncomment if desired)
    /*
    console.log('\n🗑️  Removing deprecated lastActive field...');
    const removeResult = await mongoose.connection.db.collection('users').updateMany(
      { lastActive: { $exists: true } },
      { $unset: { lastActive: 1 } }
    );
    console.log(`✅ Removed lastActive field from ${removeResult.modifiedCount} users`);
    */

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    console.log('✅ Timestamp migration completed!');

  } catch (error) {
    console.error('Error during timestamp migration:', error);
    process.exit(1);
  }
}

async function rollbackTimestamps() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('\n🔄 ROLLING BACK TIMESTAMP MIGRATION...\n');

    // Find users with lastLogin but no lastActive
    const usersToRollback = await mongoose.connection.db.collection('users').find({
      lastLogin: { $exists: true },
      $or: [
        { lastActive: { $exists: false } },
        { lastActive: null }
      ]
    }).toArray();

    console.log(`Found ${usersToRollback.length} users to rollback`);

    if (usersToRollback.length === 0) {
      console.log('✅ No rollback needed');
      await mongoose.connection.close();
      return;
    }

    let rollbackCount = 0;
    for (const user of usersToRollback) {
      try {
        // Copy lastLogin back to lastActive
        await mongoose.connection.db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              lastActive: user.lastLogin
            }
          }
        );

        console.log(`✅ Rolled back ${user.username}: lastLogin (${user.lastLogin}) → lastActive`);
        rollbackCount++;
      } catch (error) {
        console.error(`❌ Error rolling back user ${user.username}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully rolled back ${rollbackCount} users`);

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    console.log('✅ Timestamp rollback completed!');

  } catch (error) {
    console.error('Error during timestamp rollback:', error);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const isRollback = args.includes('--rollback');

if (isRollback) {
  console.log('Running timestamp rollback...');
  rollbackTimestamps();
} else {
  console.log('Running timestamp migration...');
  console.log('Use --rollback flag to rollback changes');
  migrateTimestamps();
}