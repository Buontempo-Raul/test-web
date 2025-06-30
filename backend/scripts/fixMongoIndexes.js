// backend/scripts/fixMongoIndexes.js
// Script to fix duplicate MongoDB index warnings

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
console.log('🔧 Loaded MONGODB_URI:', process.env.MONGODB_URI);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for index cleanup');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    console.log('🔍 Checking current indexes...\n');
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      console.log(`📋 Collection: ${collectionName}`);
      
      try {
        // Get current indexes
        const indexes = await collection.indexes();
        
        console.log('Current indexes:');
        indexes.forEach(index => {
          console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });
        
        // Check for problematic indexes based on the warnings
        const duplicateIndexes = [];
        
        // Look for duplicate createdAt indexes
        const createdAtIndexes = indexes.filter(idx => 
          idx.key.createdAt && Object.keys(idx.key).length === 1
        );
        
        if (createdAtIndexes.length > 1) {
          console.log('⚠️  Found duplicate createdAt indexes');
          // Keep the first one, mark others for deletion
          for (let i = 1; i < createdAtIndexes.length; i++) {
            duplicateIndexes.push(createdAtIndexes[i].name);
          }
        }
        
        // Look for duplicate creator+createdAt indexes
        const creatorCreatedAtIndexes = indexes.filter(idx => 
          idx.key.creator && idx.key.createdAt && Object.keys(idx.key).length === 2
        );
        
        if (creatorCreatedAtIndexes.length > 1) {
          console.log('⚠️  Found duplicate creator+createdAt indexes');
          // Keep the first one, mark others for deletion
          for (let i = 1; i < creatorCreatedAtIndexes.length; i++) {
            duplicateIndexes.push(creatorCreatedAtIndexes[i].name);
          }
        }
        
        // Remove duplicate indexes
        if (duplicateIndexes.length > 0) {
          console.log(`🗑️  Removing duplicate indexes: ${duplicateIndexes.join(', ')}`);
          
          for (const indexName of duplicateIndexes) {
            if (indexName !== '_id_') { // Never drop the _id index
              try {
                await collection.dropIndex(indexName);
                console.log(`✅ Dropped index: ${indexName}`);
              } catch (error) {
                console.log(`❌ Failed to drop index ${indexName}: ${error.message}`);
              }
            }
          }
        } else {
          console.log('✅ No duplicate indexes found');
        }
        
        console.log(''); // Empty line for readability
        
      } catch (error) {
        console.log(`❌ Error processing collection ${collectionName}: ${error.message}\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  }
};

const showIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📊 Current Database Indexes:\n');
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      try {
        const indexes = await collection.indexes();
        const docCount = await collection.countDocuments();
        
        console.log(`📋 ${collectionName} (${docCount} documents):`);
        indexes.forEach(index => {
          const keyStr = JSON.stringify(index.key);
          const unique = index.unique ? ' [UNIQUE]' : '';
          const sparse = index.sparse ? ' [SPARSE]' : '';
          console.log(`  ${index.name}: ${keyStr}${unique}${sparse}`);
        });
        console.log('');
        
      } catch (error) {
        console.log(`❌ Error reading indexes for ${collectionName}: ${error.message}\n`);
      }
    }
  } catch (error) {
    console.error('❌ Error showing indexes:', error);
  }
};

const recreateOptimalIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    console.log('🔧 Recreating optimal indexes...\n');
    
    // Posts collection optimal indexes
    const postsCollection = db.collection('posts');
    if (await postsCollection.estimatedDocumentCount() > 0) {
      console.log('📋 Optimizing posts collection indexes...');
      
      // Drop all non-_id indexes and recreate optimal ones
      const postIndexes = await postsCollection.indexes();
      for (const index of postIndexes) {
        if (index.name !== '_id_') {
          try {
            await postsCollection.dropIndex(index.name);
            console.log(`🗑️  Dropped old index: ${index.name}`);
          } catch (error) {
            console.log(`⚠️  Could not drop ${index.name}: ${error.message}`);
          }
        }
      }
      
      // Create optimal indexes for posts
      const postOptimalIndexes = [
        { key: { createdAt: -1 }, name: 'createdAt_-1' },
        { key: { creator: 1, createdAt: -1 }, name: 'creator_1_createdAt_-1' },
        { key: { tags: 1 }, name: 'tags_1' },
        { key: { likedBy: 1 }, name: 'likedBy_1' },
        { key: { likes: -1 }, name: 'likes_-1' },
        { key: { linkedShopItems: 1 }, name: 'linkedShopItems_1' }
      ];
      
      for (const indexSpec of postOptimalIndexes) {
        try {
          await postsCollection.createIndex(indexSpec.key, { name: indexSpec.name });
          console.log(`✅ Created index: ${indexSpec.name}`);
        } catch (error) {
          console.log(`❌ Failed to create ${indexSpec.name}: ${error.message}`);
        }
      }
    }
    
    // Artworks collection optimal indexes
    const artworksCollection = db.collection('artworks');
    if (await artworksCollection.estimatedDocumentCount() > 0) {
      console.log('\n📋 Optimizing artworks collection indexes...');
      
      // Drop all non-_id indexes and recreate optimal ones
      const artworkIndexes = await artworksCollection.indexes();
      for (const index of artworkIndexes) {
        if (index.name !== '_id_') {
          try {
            await artworksCollection.dropIndex(index.name);
            console.log(`🗑️  Dropped old index: ${index.name}`);
          } catch (error) {
            console.log(`⚠️  Could not drop ${index.name}: ${error.message}`);
          }
        }
      }
      
      // Create optimal indexes for artworks
      const artworkOptimalIndexes = [
        { key: { creator: 1 }, name: 'creator_1' },
        { key: { category: 1 }, name: 'category_1' },
        { key: { forSale: 1, price: 1 }, name: 'forSale_1_price_1' },
        { key: { tags: 1 }, name: 'tags_1' },
        { key: { linkedPosts: 1 }, name: 'linkedPosts_1' },
        { key: { createdAt: -1 }, name: 'createdAt_-1' }
      ];
      
      for (const indexSpec of artworkOptimalIndexes) {
        try {
          await artworksCollection.createIndex(indexSpec.key, { name: indexSpec.name });
          console.log(`✅ Created index: ${indexSpec.name}`);
        } catch (error) {
          console.log(`❌ Failed to create ${indexSpec.name}: ${error.message}`);
        }
      }
    }
    
    // Users collection optimal indexes
    const usersCollection = db.collection('users');
    if (await usersCollection.estimatedDocumentCount() > 0) {
      console.log('\n📋 Optimizing users collection indexes...');
      
      // Create optimal indexes for users (keeping existing unique constraints)
      const userOptimalIndexes = [
        { key: { email: 1 }, name: 'email_1', unique: true },
        { key: { username: 1 }, name: 'username_1', unique: true }
      ];
      
      for (const indexSpec of userOptimalIndexes) {
        try {
          const options = { name: indexSpec.name };
          if (indexSpec.unique) options.unique = true;
          
          await usersCollection.createIndex(indexSpec.key, options);
          console.log(`✅ Ensured index: ${indexSpec.name}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`ℹ️  Index already exists: ${indexSpec.name}`);
          } else {
            console.log(`❌ Failed to create ${indexSpec.name}: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\n🎉 Index optimization complete!');
    
  } catch (error) {
    console.error('❌ Error recreating indexes:', error);
  }
};

const main = async () => {
  await connectDB();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'show':
    case 'list':
      await showIndexes();
      break;
      
    case 'fix':
      await fixIndexes();
      break;
      
    case 'optimize':
    case 'recreate':
      await recreateOptimalIndexes();
      break;
      
    case 'clean':
      await fixIndexes();
      await recreateOptimalIndexes();
      break;
      
    default:
      console.log('🔧 MongoDB Index Manager');
      console.log('\nCommands:');
      console.log('  node fixMongoIndexes.js show      - Show all current indexes');
      console.log('  node fixMongoIndexes.js fix       - Remove duplicate indexes');
      console.log('  node fixMongoIndexes.js optimize  - Recreate optimal indexes');
      console.log('  node fixMongoIndexes.js clean     - Fix duplicates + optimize');
      console.log('\n💡 Recommended: Run "clean" to fix all index issues');
      break;
  }
  
  await mongoose.connection.close();
  console.log('\n📡 Database connection closed');
  process.exit(0);
};

process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted. Closing database connection...');
  await mongoose.connection.close();
  process.exit(0);
});

main().catch(async (error) => {
  console.error('❌ Script execution failed:', error);
  await mongoose.connection.close();
  process.exit(1);
});