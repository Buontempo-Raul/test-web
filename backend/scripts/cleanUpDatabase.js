// backend/scripts/cleanUpDatabase.js - FIXED VERSION (No admin permissions required)

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded .env file from:', envPath);
} else {
  console.log('⚠️ No .env file found, using system environment variables');
  dotenv.config();
}

// Import models - order matters for dependencies
const User = require('../models/User');
const Post = require('../models/Post');
const Artwork = require('../models/Artwork');
const Order = require('../models/Order');

// Simple connection function without admin operations
const connectDB = async () => {
  try {
    const mongoUri = 
      process.env.MONGODB_URI || 
      process.env.MONGO_URI || 
      'mongodb://localhost:27017/uncreated';

    console.log('\n🔄 Connecting to MongoDB...');
    
    // Mask password for security when logging
    const maskedUri = mongoUri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
    console.log('Connection string:', maskedUri);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔧 Authentication Issue:');
      console.log('- Check your username/password in MONGODB_URI');
      console.log('- Verify user exists in MongoDB Atlas');
      console.log('- Check if user has read/write permissions');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Connection Issue:');
      console.log('- Check if MongoDB is running (local)');
      console.log('- Verify network connectivity (Atlas)');
    }
    
    throw error;
  }
};

// Safe collection count function
const getCollectionStats = async () => {
  try {
    const stats = {
      users: await User.countDocuments(),
      posts: await Post.countDocuments(),
      artworks: await Artwork.countDocuments(),
      orders: await Order.countDocuments()
    };
    
    console.log('\n📋 Current Database Stats:');
    Object.entries(stats).forEach(([collection, count]) => {
      console.log(`   ${collection}: ${count} documents`);
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting collection stats:', error.message);
    return {};
  }
};

// Clean up posts and their relationships
const cleanupPosts = async () => {
  try {
    console.log('\n🧹 Cleaning up posts...');
    
    // Get posts with linked artworks for cleanup
    const postsWithArtworks = await Post.find({
      $or: [
        { linkedShopItems: { $exists: true, $ne: [] } },
        { linkedShopItem: { $exists: true, $ne: null } }
      ]
    }).select('_id linkedShopItems linkedShopItem');
    
    console.log(`Found ${postsWithArtworks.length} posts with linked artworks`);
    
    // Remove post references from artworks
    for (const post of postsWithArtworks) {
      const artworkIds = [];
      
      if (post.linkedShopItems?.length > 0) {
        artworkIds.push(...post.linkedShopItems);
      }
      if (post.linkedShopItem) {
        artworkIds.push(post.linkedShopItem);
      }
      
      if (artworkIds.length > 0) {
        await Artwork.updateMany(
          { _id: { $in: artworkIds } },
          { $pull: { linkedPosts: post._id } }
        );
      }
    }
    
    // Delete all posts
    const result = await Post.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} posts`);
    
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error cleaning up posts:', error.message);
    throw error;
  }
};

// Clean up artworks and their relationships
const cleanupArtworks = async () => {
  try {
    console.log('\n🧹 Cleaning up artworks...');
    
    // Get artworks with linked posts for cleanup
    const artworksWithPosts = await Artwork.find({
      linkedPosts: { $exists: true, $ne: [] }
    }).select('_id linkedPosts');
    
    console.log(`Found ${artworksWithPosts.length} artworks with linked posts`);
    
    // Remove artwork references from posts (if any posts still exist)
    for (const artwork of artworksWithPosts) {
      if (artwork.linkedPosts?.length > 0) {
        await Post.updateMany(
          { _id: { $in: artwork.linkedPosts } },
          { 
            $unset: { linkedShopItem: 1 },
            $pull: { linkedShopItems: artwork._id }
          }
        );
      }
    }
    
    // Delete all artworks
    const result = await Artwork.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} artworks`);
    
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error cleaning up artworks:', error.message);
    throw error;
  }
};

// Clean up orders
const cleanupOrders = async () => {
  try {
    console.log('\n🧹 Cleaning up orders...');
    
    const result = await Order.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} orders`);
    
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error cleaning up orders:', error.message);
    throw error;
  }
};

// Main cleanup function
const performCleanup = async (options = {}) => {
  try {
    await connectDB();
    
    console.log('\n📊 Database state before cleanup:');
    await getCollectionStats();
    
    let deletedCounts = {};
    
    if (options.posts !== false) {
      deletedCounts.posts = await cleanupPosts();
    }
    
    if (options.artworks !== false) {
      deletedCounts.artworks = await cleanupArtworks();
    }
    
    if (options.orders !== false) {
      deletedCounts.orders = await cleanupOrders();
    }
    
    console.log('\n📊 Database state after cleanup:');
    await getCollectionStats();
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log('📋 Summary:');
    Object.entries(deletedCounts).forEach(([type, count]) => {
      console.log(`   Deleted ${count} ${type}`);
    });
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
};

// Test connection only
const testConnection = async () => {
  try {
    await connectDB();
    await getCollectionStats();
    console.log('\n✅ Connection test successful!');
  } catch (error) {
    console.error('\n❌ Connection test failed:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Show environment info
const showEnvironment = () => {
  console.log('\n🔍 Environment Information:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'set' : 'not set');
  console.log('MONGO_URI:', process.env.MONGO_URI ? 'set' : 'not set');
  
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (mongoUri) {
    const maskedUri = mongoUri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
    console.log('Connection string:', maskedUri);
  }
};

// Main script execution
const main = async () => {
  const command = process.argv[2];
  const force = process.argv.includes('--force');

  switch (command) {
    case 'test':
      await testConnection();
      break;

    case 'env':
      showEnvironment();
      break;

    case 'posts':
      if (!force) {
        console.log('⚠️ This will delete ALL posts!');
        console.log('Add --force flag to confirm: node cleanUpDatabase.js posts --force');
        return;
      }
      await performCleanup({ artworks: false, orders: false });
      break;

    case 'artworks':
      if (!force) {
        console.log('⚠️ This will delete ALL artworks!');
        console.log('Add --force flag to confirm: node cleanUpDatabase.js artworks --force');
        return;
      }
      await performCleanup({ posts: false, orders: false });
      break;

    case 'orders':
      if (!force) {
        console.log('⚠️ This will delete ALL orders!');
        console.log('Add --force flag to confirm: node cleanUpDatabase.js orders --force');
        return;
      }
      await performCleanup({ posts: false, artworks: false });
      break;

    case 'all':
      if (!force) {
        console.log('⚠️ This will delete ALL posts, artworks, and orders!');
        console.log('Add --force flag to confirm: node cleanUpDatabase.js all --force');
        return;
      }
      await performCleanup();
      break;

    default:
      console.log('🧹 Database Cleanup Tool');
      console.log('\nUsage:');
      console.log('  node cleanUpDatabase.js test           - Test database connection');
      console.log('  node cleanUpDatabase.js env            - Show environment info');
      console.log('  node cleanUpDatabase.js posts --force  - Delete all posts');
      console.log('  node cleanUpDatabase.js artworks --force - Delete all artworks');
      console.log('  node cleanUpDatabase.js orders --force - Delete all orders');
      console.log('  node cleanUpDatabase.js all --force    - Delete everything');
      console.log('\n⚠️ Always use --force flag for destructive operations');
      console.log('💡 Run "test" command first to verify connection');
      break;
  }
};

// Handle process interruption
process.on('SIGINT', async () => {
  console.log('\n\n⚠️ Process interrupted');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

// Run the script
main().catch(async (error) => {
  console.error('\n❌ Script execution failed:', error);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(1);
});