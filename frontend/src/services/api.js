// src/services/api.js - Updated with auction endpoints
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
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
  register: (userData) => {
    return api.post('/api/auth/register', userData);
  },
  
  login: (credentials) => {
    return api.post('/api/auth/login', credentials);
  },
  
  getProfile: () => {
    return api.get('/api/auth/profile');
  },
  
  changePassword: (passwordData) => {
    return api.put('/api/auth/change-password', passwordData);
  },
  
  forgotPassword: (email) => {
    return api.post('/api/auth/forgot-password', { email });
  }
};

// User API service
export const userAPI = {
  getUserByUsername: (username) => {
    return api.get(`/api/users/${username}`);
  },
  
  getUserArtworks: (username) => {
    return api.get(`/api/users/${username}/artworks`);
  },
  
  updateProfile: (profileData) => {
    return api.put('/api/users/profile', profileData);
  },
  
  uploadProfileImage: (formData) => {
    return api.post('/api/users/profile/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  getFavorites: () => {
    return api.get('/api/users/favorites');
  },
  
  addToFavorites: (artworkId) => {
    return api.post(`/api/users/favorites/${artworkId}`);
  },
  
  removeFromFavorites: (artworkId) => {
    return api.delete(`/api/users/favorites/${artworkId}`);
  },
  
  followUser: (userId) => {
    return api.post(`/api/users/follow/${userId}`);
  },
  
  unfollowUser: (userId) => {
    return api.post(`/api/users/unfollow/${userId}`);
  },
  
  getFollowing: () => {
    return api.get('/api/users/following');
  },
  
  getFollowers: () => {
    return api.get('/api/users/followers');
  }
};

// Artwork API service
export const artworkAPI = {
  getArtworks: (filters = {}) => {
    return api.get('/api/artworks', { params: filters });
  },
  
  getArtworkById: (id) => {
    return api.get(`/api/artworks/${id}`);
  },
  
  createArtwork: (artworkData) => {
    return api.post('/api/artworks', artworkData);
  },
  
  uploadArtworkImages: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    return api.post('/api/artworks/upload', formData, config);
  },
  
  updateArtwork: (id, artworkData) => {
    return api.put(`/api/artworks/${id}`, artworkData);
  },
  
  deleteArtwork: (id) => {
    return api.delete(`/api/artworks/${id}`);
  },
  
  likeArtwork: (id) => {
    return api.post(`/api/artworks/${id}/like`);
  }
};

// Auction API service (now using artwork endpoints)
export const auctionAPI = {
  // Place a bid on an artwork
  placeBid: (artworkId, amount) => {
    return api.post(`/api/artworks/${artworkId}/bid`, { amount });
  },
  
  // Get bid history for an artwork
  getBidHistory: (artworkId, params = {}) => {
    return api.get(`/api/artworks/${artworkId}/bids`, { params });
  },
  
  // Get auction info for an artwork (using regular artwork endpoint)
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

export default api;