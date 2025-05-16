// frontend/src/services/api.js
import axios from 'axios';

// Create an axios instance with default configs
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add auth token to all requests
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

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401 && 
        error.response.data && error.response.data.message === 'Token expired') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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

// Removed event-related API services

export default api;