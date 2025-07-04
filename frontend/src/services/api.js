// frontend/src/services/api.js - FIXED: Added missing profile methods
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API service
export const authAPI = {
  login: (credentials) => {
    return api.post('/api/auth/login', credentials);
  },
  
  register: (userData) => {
    return api.post('/api/auth/register', userData);
  },
  
  logout: () => {
    return api.post('/api/auth/logout');
  },
  
  getProfile: () => {
    return api.get('/api/auth/profile');
  },
  
  updateProfile: (userData) => {
    return api.put('/api/auth/profile', userData);
  }
};

// User API service - FIXED: Added missing methods
export const userAPI = {
  // FIXED: Added getUserByUsername method that Profile component needs
  getUserByUsername: (username) => {
    return api.get(`/api/users/${username}`);
  },
  
  // FIXED: Added getUserArtworks method that Profile component needs
  getUserArtworks: (username) => {
    return api.get(`/api/users/${username}/artworks`);
  },
  
  // Existing methods
  getUser: (id) => {
    return api.get(`/api/users/${id}`);
  },
  
  updateUser: (id, userData) => {
    return api.put(`/api/users/${id}`, userData);
  },
  
  // FIXED: Follow/unfollow methods - corrected endpoints
  followUser: (userId) => {
    return api.post(`/api/users/follow/${userId}`);
  },
  
  unfollowUser: (userId) => {
    return api.post(`/api/users/unfollow/${userId}`);
  },
  
  // FIXED: Added missing profile management methods
  updateProfile: (userData) => {
    return api.put('/api/users/profile', userData);
  },
  
  uploadProfileImage: (formData) => {
    return api.post('/api/users/profile/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // FIXED: Added favorites methods
  getFavorites: () => {
    return api.get('/api/users/favorites');
  },
  
  addToFavorites: (artworkId) => {
    return api.post(`/api/users/favorites/${artworkId}`);
  },
  
  removeFromFavorites: (artworkId) => {
    return api.delete(`/api/users/favorites/${artworkId}`);
  },
  
  // FIXED: Added following/followers methods
  getFollowing: () => {
    return api.get('/api/users/following');
  },
  
  getFollowers: () => {
    return api.get('/api/users/followers');
  },
  
  searchUsers: (query) => {
    return api.get(`/api/users/search?q=${query}`);
  },

  getFollowing: () => {
    return api.get('/api/users/following');
  },
  
  getFollowers: () => {
    return api.get('/api/users/followers');
  },

  // NEW: Public followers/following methods
  getUserFollowers: (username) => {
    return api.get(`/api/users/${username}/followers`);
  },
  
  getUserFollowing: (username) => {
    return api.get(`/api/users/${username}/following`);
  },
  
  searchUsers: (query) => {
    return api.get(`/api/users/search?q=${query}`);
  }
};

// Artwork API service
export const artworkAPI = {
  getArtworks: (params = {}) => {
    return api.get('/api/artworks', { params });
  },
  
  getArtworkById: (id) => {
    return api.get(`/api/artworks/${id}`);
  },
  
  createArtwork: (artworkData) => {
    return api.post('/api/artworks', artworkData);
  },
  
  updateArtwork: (id, artworkData) => {
    return api.put(`/api/artworks/${id}`, artworkData);
  },
  
  deleteArtwork: (id) => {
    return api.delete(`/api/artworks/${id}`);
  },
  
  likeArtwork: (id) => {
    return api.post(`/api/artworks/${id}/like`);
  },
  
  uploadImages: (formData) => {
    return api.post('/api/artworks/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Get user's posts for linking to artworks
  getUserPosts: () => {
    return api.get('/api/artworks/user/posts');
  },
  
  placeBid: (id, bidData) => {
    return api.post(`/api/artworks/${id}/bid`, bidData);
  },
  
  getBids: (id, params = {}) => {
    return api.get(`/api/artworks/${id}/bids`, { params });
  },
  
  // Get auction info for an artwork
  getAuctionInfo: (artworkId) => {
    return api.get(`/api/artworks/${artworkId}`);
  }
};

// Shop API service
export const shopAPI = {
  getFeaturedArtworks: () => {
    return api.get('/api/shop/featured');
  },
  
  createOrder: (orderData) => {
    return api.post('/api/shop/orders', orderData);
  },
  
  getOrderById: (id) => {
    return api.get(`/api/shop/orders/${id}`);
  },
  
  getMyOrders: () => {
    return api.get('/api/shop/myorders');
  },
  
  updateOrderToPaid: (id, paymentResult) => {
    return api.put(`/api/shop/orders/${id}/pay`, paymentResult);
  },
  
  updateOrderToDelivered: (id) => {
    return api.put(`/api/shop/orders/${id}/deliver`);
  }
};

// Post API service
export const postAPI = {
  getPosts: (filters = {}) => {
    return api.get('/api/posts', { params: filters });
  },
  
  getPostById: (id) => {
    return api.get(`/api/posts/${id}`);
  },
  
  getUserPosts: (userId) => {
    return api.get(`/api/posts/user/${userId}`);
  },
  
  // Get user's artworks for linking to posts
  getUserArtworks: () => {
    return api.get('/api/posts/user/artworks');
  },
  
  createPost: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    return api.post('/api/posts', formData, config);
  },
  
  updatePost: (id, formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    return api.put(`/api/posts/${id}`, formData, config);
  },
  
  deletePost: (id) => {
    return api.delete(`/api/posts/${id}`);
  },
  
  likePost: (id) => {
    return api.post(`/api/posts/${id}/like`);
  },
  
  commentOnPost: (id, text) => {
    return api.post(`/api/posts/${id}/comment`, { text });
  },
  
  deleteComment: (postId, commentId) => {
    return api.delete(`/api/posts/${postId}/comment/${commentId}`);
  }
};

// Auction API service
export const auctionAPI = {
  // Existing functions...
  placeBid: (artworkId, bidData) => {
    return api.post(`/api/auctions/${artworkId}/bid`, bidData);
  },
  
  getBidHistory: (artworkId, params = {}) => {
    return api.get(`/api/auctions/${artworkId}/bids`, { params });
  },
  
  getAuctionInfo: (artworkId) => {
    return api.get(`/api/auctions/${artworkId}/info`);
  },

  // NEW: Artist auction management functions
  startAuction: (artworkId, duration = 7) => {
    return api.post(`/api/auctions/${artworkId}/start`, { duration });
  },
  
  endAuction: (artworkId) => {
    return api.post(`/api/auctions/${artworkId}/end`);
  }
};

export default api;