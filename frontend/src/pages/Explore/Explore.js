// src/pages/Explore/Explore.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Explore.css';
import { useAuth } from '../../hooks/useAuth';

// Components will be created in separate files
import PostCard from '../../components/explore/PostCard/PostCard';
import CreatePostButton from '../../components/explore/CreatePostButton/CreatePostButton';
import CreatePostModal from '../../components/explore/CreatePostModal/CreatePostModal';
import ExploreFilters from '../../components/explore/ExploreFilters/ExploreFilters';

// Temporary data - Replace with API calls when ready
const tempPosts = [
  {
    id: '1',
    creator: {
      id: '1',
      username: 'artistic_soul',
      profileImage: 'https://via.placeholder.com/50x50'
    },
    content: {
      type: 'image',
      url: 'https://via.placeholder.com/600x800?text=Abstract+Art',
      aspectRatio: '4:5'
    },
    caption: 'Exploring color relationships and emotional resonance in my latest abstract piece. This was inspired by the changing seasons and how they affect our mood.',
    tags: ['abstract', 'color', 'emotion'],
    likes: 42,
    comments: 8,
    createdAt: '2025-04-12T10:30:00Z',
    linkedShopItem: {
      id: '101',
      name: 'Abstract Harmony',
      price: 299.99
    }
  },
  {
    id: '2',
    creator: {
      id: '2',
      username: 'city_explorer',
      profileImage: 'https://via.placeholder.com/50x50'
    },
    content: {
      type: 'video',
      url: 'https://via.placeholder.com/600x800?text=Urban+Photography+Video',
      aspectRatio: '16:9',
      thumbnailUrl: 'https://via.placeholder.com/600x800?text=Urban+Photography'
    },
    caption: 'A short montage of urban landscapes I captured last weekend. The interplay of light and shadow in the concrete jungle creates such fascinating patterns.',
    tags: ['urban', 'photography', 'city'],
    likes: 78,
    comments: 15,
    createdAt: '2025-04-11T16:45:00Z',
    linkedShopItem: null
  },
  {
    id: '3',
    creator: {
      id: '3',
      username: 'nature_artist',
      profileImage: 'https://via.placeholder.com/50x50'
    },
    content: {
      type: 'carousel',
      items: [
        { type: 'image', url: 'https://via.placeholder.com/600x800?text=Sculpture+1' },
        { type: 'image', url: 'https://via.placeholder.com/600x800?text=Sculpture+2' },
        { type: 'image', url: 'https://via.placeholder.com/600x800?text=Sculpture+3' }
      ]
    },
    caption: 'The evolution of my latest sculpture series "Nature\'s Embrace". Swipe to see the progression from concept to finished piece.',
    tags: ['sculpture', 'nature', 'process'],
    likes: 103,
    comments: 27,
    createdAt: '2025-04-10T09:15:00Z',
    linkedShopItem: {
      id: '102',
      name: 'Nature\'s Embrace - Bronze Sculpture',
      price: 1250.00
    }
  },
  {
    id: '4',
    creator: {
      id: '4',
      username: 'digital_dreams',
      profileImage: 'https://via.placeholder.com/50x50'
    },
    content: {
      type: 'image',
      url: 'https://via.placeholder.com/600x800?text=Digital+Art',
      aspectRatio: '1:1'
    },
    caption: 'Exploring new digital brushes and techniques. I am really enjoying how this piece turned out! What do you think?',
    tags: ['digital', 'art', 'illustration'],
    likes: 89,
    comments: 12,
    createdAt: '2025-04-09T14:20:00Z',
    linkedShopItem: {
      id: '103',
      name: 'Digital Dreams - Limited Print',
      price: 49.99
    }
  },
  {
    id: '5',
    creator: {
      id: '5',
      username: 'ceramic_studio',
      profileImage: 'https://via.placeholder.com/50x50'
    },
    content: {
      type: 'video',
      url: 'https://via.placeholder.com/600x800?text=Pottery+Process+Video',
      aspectRatio: '9:16',
      thumbnailUrl: 'https://via.placeholder.com/600x800?text=Pottery+Process'
    },
    caption: 'A glimpse into my pottery process. There is something so meditative about working with clay on the wheel.',
    tags: ['pottery', 'ceramics', 'process'],
    likes: 56,
    comments: 9,
    createdAt: '2025-04-08T11:10:00Z',
    linkedShopItem: null
  }
];

const Explore = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [followingOnly, setFollowingOnly] = useState(false);

  useEffect(() => {
    // Fetch posts from API
    const fetchPosts = async () => {
      try {
        // In a real application, you would fetch from your API
        // const response = await fetch('/api/posts?filter=' + activeFilter);
        // const data = await response.json();
        
        // Simulating API call with temporary data
        setTimeout(() => {
          setPosts(tempPosts);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [activeFilter, followingOnly]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleToggleFollowing = () => {
    setFollowingOnly(!followingOnly);
  };

  const handleCreatePost = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  const handleSubmitPost = (postData) => {
    // In a real app, you would submit to API
    console.log('Submitting post:', postData);
    
    // Optimistically add to local state
    const newPost = {
      id: Date.now().toString(),
      creator: {
        id: currentUser?.id || 'temp',
        username: currentUser?.username || 'user',
        profileImage: currentUser?.profileImage || 'https://via.placeholder.com/50x50'
      },
      ...postData,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString()
    };
    
    setPosts([newPost, ...posts]);
    setShowCreateModal(false);
  };

  // Filter posts based on search query and active filter
  const filteredPosts = posts.filter(post => {
    // Search in caption, username, and tags
    const matchesSearch = searchQuery === '' || 
      post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by category
    const matchesFilter = activeFilter === 'all' || 
      post.tags.includes(activeFilter);
    
    // Filter by following (in a real app, check if post.creator.id is in user's following list)
    const matchesFollowing = !followingOnly || 
      [1, 3].includes(parseInt(post.creator.id)); // Simulating following list
    
    return matchesSearch && matchesFilter && matchesFollowing;
  });

  return (
    <div className="explore-container">
      <div className="explore-header">
        <h1>Explore</h1>
        <div className="explore-actions">
          {isAuthenticated && (
            <CreatePostButton onClick={handleCreatePost} />
          )}
        </div>
      </div>

      <div className="explore-filters">
        <ExploreFilters 
          activeFilter={activeFilter} 
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          followingOnly={followingOnly}
          onToggleFollowing={handleToggleFollowing}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {isLoading ? (
        <div className="explore-loading">
          <div className="spinner"></div>
          <p>Loading amazing content...</p>
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="posts-feed">
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PostCard 
                post={post} 
                currentUser={currentUser}
                isAuthenticated={isAuthenticated}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="no-posts">
          <h2>No posts found</h2>
          <p>Try adjusting your filters or search criteria</p>
          {isAuthenticated && (
            <button 
              className="create-post-button"
              onClick={handleCreatePost}
            >
              Create the first post
            </button>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreatePostModal 
          onClose={handleCloseModal}
          onSubmit={handleSubmitPost}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default Explore;