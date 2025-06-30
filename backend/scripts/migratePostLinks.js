// backend/scripts/migratePostArtworkLinks.js
// Migration script to convert single linkedShopItem to multiple linkedShopItems

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/your-db-name');
    console.log('MongoDB connected for migration');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define Post schema for migration
const postSchema = new mongoose.Schema({
  linkedShopItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork'
  },
  linkedShopItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork'
  }]
}, { strict: false }); // Allow other fields

const Post = mongoose.model('Post', postSchema);

const migratePostArtworkLinks = async () => {
  try {
    console.log('Starting migration of post artwork links...');

    // Find all posts that have linkedShopItem but no linkedShopItems
    const postsToMigrate = await Post.find({
      linkedShopItem: { $exists: true, $ne: null },
      $or: [
        { linkedShopItems: { $exists: false } },
        { linkedShopItems: { $size: 0 } }
      ]
    });

    console.log(`Found ${postsToMigrate.length} posts to migrate`);

    if (postsToMigrate.length === 0) {
      console.log('No posts need migration. All posts are up to date.');
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const post of postsToMigrate) {
      try {
        console.log(`Migrating post ${post._id}: ${post.linkedShopItem} -> [${post.linkedShopItem}]`);

        // Move linkedShopItem to linkedShopItems array
        await Post.updateOne(
          { _id: post._id },
          {
            $set: {
              linkedShopItems: [post.linkedShopItem]
            },
            $unset: {
              linkedShopItem: 1
            }
          }
        );

        migratedCount++;
        
        // Log progress every 100 posts
        if (migratedCount % 100 === 0) {
          console.log(`Progress: ${migratedCount}/${postsToMigrate.length} posts migrated`);
        }

      } catch (error) {
        console.error(`Error migrating post ${post._id}:`, error);
        errorCount++;
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Successfully migrated: ${migratedCount} posts`);
    console.log(`Errors: ${errorCount} posts`);
    console.log(`Total processed: ${postsToMigrate.length} posts`);

    // Verify migration
    const remainingOldPosts = await Post.countDocuments({
      linkedShopItem: { $exists: true, $ne: null }
    });

    const newFormatPosts = await Post.countDocuments({
      linkedShopItems: { $exists: true, $not: { $size: 0 } }
    });

    console.log('\n=== Verification ===');
    console.log(`Posts still using old format: ${remainingOldPosts}`);
    console.log(`Posts using new format: ${newFormatPosts}`);

    if (remainingOldPosts === 0) {
      console.log('✅ Migration successful! All posts are using the new format.');
    } else {
      console.log('⚠️  Some posts still use the old format. You may need to run the migration again.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
};

const rollbackMigration = async () => {
  try {
    console.log('Starting rollback of post artwork links migration...');

    // Find all posts that have linkedShopItems with exactly one item
    const postsToRollback = await Post.find({
      linkedShopItems: { $exists: true, $size: 1 },
      linkedShopItem: { $exists: false }
    });

    console.log(`Found ${postsToRollback.length} posts to rollback`);

    if (postsToRollback.length === 0) {
      console.log('No posts need rollback.');
      return;
    }

    let rolledBackCount = 0;

    for (const post of postsToRollback) {
      try {
        const artworkId = post.linkedShopItems[0];
        
        await Post.updateOne(
          { _id: post._id },
          {
            $set: {
              linkedShopItem: artworkId
            },
            $unset: {
              linkedShopItems: 1
            }
          }
        );

        rolledBackCount++;
        console.log(`Rolled back post ${post._id}: [${artworkId}] -> ${artworkId}`);

      } catch (error) {
        console.error(`Error rolling back post ${post._id}:`, error);
      }
    }

    console.log(`\nRollback complete. ${rolledBackCount} posts rolled back to old format.`);

  } catch (error) {
    console.error('Rollback failed:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();

  const command = process.argv[2];

  switch (command) {
    case 'migrate':
      await migratePostArtworkLinks();
      break;
    
    case 'rollback':
      await rollbackMigration();
      break;
    
    case 'status':
      // Check current status
      const oldFormatCount = await Post.countDocuments({
        linkedShopItem: { $exists: true, $ne: null }
      });
      const newFormatCount = await Post.countDocuments({
        linkedShopItems: { $exists: true, $not: { $size: 0 } }
      });
      const totalPosts = await Post.countDocuments();

      console.log('=== Migration Status ===');
      console.log(`Total posts: ${totalPosts}`);
      console.log(`Posts using old format (linkedShopItem): ${oldFormatCount}`);
      console.log(`Posts using new format (linkedShopItems): ${newFormatCount}`);
      console.log(`Posts with no linked artworks: ${totalPosts - oldFormatCount - newFormatCount}`);
      break;

    default:
      console.log('Usage:');
      console.log('  node migratePostArtworkLinks.js migrate   - Migrate to new format');
      console.log('  node migratePostArtworkLinks.js rollback  - Rollback to old format');
      console.log('  node migratePostArtworkLinks.js status    - Check migration status');
      break;
  }

  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\nProcess interrupted. Closing database connection...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
main().catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});