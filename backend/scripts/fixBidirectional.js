// backend/scripts/fixBidirectionalLinks.js - Fix inconsistent post-artwork relationships

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
const Post = require('../models/Post');
const Artwork = require('../models/Artwork');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Diagnose current state of relationships
const diagnoseRelationships = async () => {
  console.log('\n🔍 DIAGNOSING CURRENT RELATIONSHIP STATE...\n');

  try {
    // Count posts with different linking patterns
    const totalPosts = await Post.countDocuments();
    const postsWithOldFormat = await Post.countDocuments({ linkedShopItem: { $exists: true, $ne: null } });
    const postsWithNewFormat = await Post.countDocuments({ linkedShopItems: { $exists: true, $ne: [] } });
    const postsWithBothFormats = await Post.countDocuments({
      linkedShopItem: { $exists: true, $ne: null },
      linkedShopItems: { $exists: true, $ne: [] }
    });

    console.log('📊 POST ANALYSIS:');
    console.log(`   Total posts: ${totalPosts}`);
    console.log(`   Posts with old format (linkedShopItem): ${postsWithOldFormat}`);
    console.log(`   Posts with new format (linkedShopItems): ${postsWithNewFormat}`);
    console.log(`   Posts with both formats: ${postsWithBothFormats}`);

    // Count artworks
    const totalArtworks = await Artwork.countDocuments();
    const artworksWithLinkedPosts = await Artwork.countDocuments({ linkedPosts: { $exists: true, $ne: [] } });

    console.log('\n📊 ARTWORK ANALYSIS:');
    console.log(`   Total artworks: ${totalArtworks}`);
    console.log(`   Artworks with linked posts: ${artworksWithLinkedPosts}`);

    // Find mismatched relationships
    console.log('\n🔍 CHECKING FOR RELATIONSHIP MISMATCHES...\n');

    let mismatchCount = 0;

    // Check posts pointing to artworks that don't point back
    const postsWithArtworks = await Post.find({
      $or: [
        { linkedShopItems: { $exists: true, $ne: [] } },
        { linkedShopItem: { $exists: true, $ne: null } }
      ]
    }).populate('linkedShopItems linkedShopItem');

    for (const post of postsWithArtworks) {
      const artworkIds = [];
      
      // Collect all artwork IDs
      if (post.linkedShopItems) {
        artworkIds.push(...post.linkedShopItems.map(a => a._id.toString()));
      }
      if (post.linkedShopItem) {
        artworkIds.push(post.linkedShopItem._id.toString());
      }

      // Check if artworks point back to this post
      for (const artworkId of artworkIds) {
        const artwork = await Artwork.findById(artworkId);
        if (artwork && !artwork.linkedPosts.some(p => p.toString() === post._id.toString())) {
          console.log(`❌ Mismatch: Post ${post._id} → Artwork ${artworkId}, but artwork doesn't link back`);
          mismatchCount++;
        }
      }
    }

    // Check artworks pointing to posts that don't point back
    const artworksWithPosts = await Artwork.find({ linkedPosts: { $exists: true, $ne: [] } });

    for (const artwork of artworksWithPosts) {
      for (const postId of artwork.linkedPosts) {
        const post = await Post.findById(postId);
        if (post) {
          const isLinked = 
            (post.linkedShopItems && post.linkedShopItems.some(a => a.toString() === artwork._id.toString())) ||
            (post.linkedShopItem && post.linkedShopItem.toString() === artwork._id.toString());
          
          if (!isLinked) {
            console.log(`❌ Mismatch: Artwork ${artwork._id} → Post ${postId}, but post doesn't link back`);
            mismatchCount++;
          }
        }
      }
    }

    if (mismatchCount === 0) {
      console.log('✅ No relationship mismatches found!');
    } else {
      console.log(`❌ Found ${mismatchCount} relationship mismatches`);
    }

    return {
      totalPosts,
      postsWithOldFormat,
      postsWithNewFormat,
      postsWithBothFormats,
      totalArtworks,
      artworksWithLinkedPosts,
      mismatchCount
    };

  } catch (error) {
    console.error('Error during diagnosis:', error);
    throw error;
  }
};

// Fix bidirectional relationships
const fixBidirectionalLinks = async () => {
  console.log('\n🔧 FIXING BIDIRECTIONAL RELATIONSHIPS...\n');

  try {
    let fixedCount = 0;

    // Step 1: Migrate old format to new format
    console.log('📝 Step 1: Migrating old linkedShopItem to linkedShopItems...');
    
    const postsWithOldFormat = await Post.find({
      linkedShopItem: { $exists: true, $ne: null },
      $or: [
        { linkedShopItems: { $exists: false } },
        { linkedShopItems: { $size: 0 } }
      ]
    });

    for (const post of postsWithOldFormat) {
      post.linkedShopItems = [post.linkedShopItem];
      await post.save();
      console.log(`   Migrated post ${post._id}`);
      fixedCount++;
    }

    // Step 2: Ensure all posts in new format point to valid artworks
    console.log('\n📝 Step 2: Validating artwork references in posts...');
    
    const postsWithNewFormat = await Post.find({ linkedShopItems: { $exists: true, $ne: [] } });
    
    for (const post of postsWithNewFormat) {
      const validArtworkIds = [];
      
      for (const artworkId of post.linkedShopItems) {
        const artwork = await Artwork.findById(artworkId);
        if (artwork) {
          validArtworkIds.push(artworkId);
        } else {
          console.log(`   Removed invalid artwork reference ${artworkId} from post ${post._id}`);
        }
      }
      
      if (validArtworkIds.length !== post.linkedShopItems.length) {
        post.linkedShopItems = validArtworkIds;
        await post.save();
        fixedCount++;
      }
    }

    // Step 3: Sync artwork → post relationships
    console.log('\n📝 Step 3: Syncing artwork → post relationships...');
    
    const allPosts = await Post.find({ linkedShopItems: { $exists: true, $ne: [] } });
    
    for (const post of allPosts) {
      for (const artworkId of post.linkedShopItems) {
        const artwork = await Artwork.findById(artworkId);
        if (artwork) {
          // Add post to artwork's linkedPosts if not already there
          if (!artwork.linkedPosts.some(p => p.toString() === post._id.toString())) {
            artwork.linkedPosts.push(post._id);
            await artwork.save();
            console.log(`   Added post ${post._id} to artwork ${artwork._id}`);
            fixedCount++;
          }
        }
      }
    }

    // Step 4: Clean up artwork → post relationships (remove invalid references)
    console.log('\n📝 Step 4: Cleaning up artwork → post relationships...');
    
    const allArtworks = await Artwork.find({ linkedPosts: { $exists: true, $ne: [] } });
    
    for (const artwork of allArtworks) {
      const validPostIds = [];
      
      for (const postId of artwork.linkedPosts) {
        const post = await Post.findById(postId);
        if (post && post.linkedShopItems && post.linkedShopItems.some(a => a.toString() === artwork._id.toString())) {
          validPostIds.push(postId);
        } else {
          console.log(`   Removed invalid post reference ${postId} from artwork ${artwork._id}`);
        }
      }
      
      if (validPostIds.length !== artwork.linkedPosts.length) {
        artwork.linkedPosts = validPostIds;
        await artwork.save();
        fixedCount++;
      }
    }

    // Step 5: Remove old linkedShopItem fields
    console.log('\n📝 Step 5: Cleaning up old linkedShopItem fields...');
    
    const postsWithOldField = await Post.find({ linkedShopItem: { $exists: true } });
    
    for (const post of postsWithOldField) {
      post.linkedShopItem = undefined;
      await post.save();
      console.log(`   Removed old linkedShopItem field from post ${post._id}`);
      fixedCount++;
    }

    console.log(`\n✅ Fixed ${fixedCount} relationship issues`);
    return fixedCount;

  } catch (error) {
    console.error('Error during fix:', error);
    throw error;
  }
};

// Main execution function
const main = async () => {
  const command = process.argv[2];

  try {
    await connectDB();

    switch (command) {
      case 'diagnose':
        await diagnoseRelationships();
        break;

      case 'fix':
        await diagnoseRelationships();
        console.log('\n' + '='.repeat(60));
        const fixedCount = await fixBidirectionalLinks();
        console.log('\n' + '='.repeat(60));
        console.log('\n🎉 VERIFICATION - Running diagnosis again...\n');
        await diagnoseRelationships();
        console.log(`\n✅ Relationship fixing completed! Fixed ${fixedCount} issues.`);
        break;

      case 'force-fix':
        console.log('🚨 FORCE FIX MODE - Fixing without diagnosis first...\n');
        await fixBidirectionalLinks();
        break;

      default:
        console.log('🔧 Bidirectional Link Fixer\n');
        console.log('Usage:');
        console.log('  node fixBidirectionalLinks.js diagnose   - Check for relationship issues');
        console.log('  node fixBidirectionalLinks.js fix        - Diagnose and fix all issues');
        console.log('  node fixBidirectionalLinks.js force-fix  - Fix without diagnosis\n');
        console.log('💡 Run "diagnose" first to see what issues exist');
        break;
    }

  } catch (error) {
    console.error('\n❌ Script execution failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Database connection closed');
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
  console.error('\n❌ Unhandled error:', error);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(1);
});