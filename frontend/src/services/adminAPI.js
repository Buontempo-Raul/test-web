// Enhanced frontend/src/services/adminAPI.js with proper error handling and restore functionality

import api from './api';

export const adminAPI = {
  // Dashboard
  getDashboardStats: () => {
    return api.get('/api/admin/dashboard/stats');
  },
  
  getRecentActivity: (limit = 10) => {
    return api.get(`/api/admin/dashboard/activity?limit=${limit}`);
  },

  // User Management with enhanced error handling
  getAllUsers: async (params = {}) => {
    try {
      const { page = 1, limit = 10, search = '', role = '', status = '' } = params;
      const response = await api.get(`/api/admin/users?page=${page}&limit=${limit}&search=${search}&role=${role}&status=${status}`);
      return response.data;
    } catch (error) {
      console.error('getAllUsers error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch users',
        users: [],
        pagination: { current: 1, pages: 1, total: 0 }
      };
    }
  },

  banUser: async (userId, data) => {
    try {
      const response = await api.put(`/api/admin/users/${userId}/ban`, data);
      return response.data;
    } catch (error) {
      console.error('banUser error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to ban user'
      };
    }
  },

  pauseUser: async (userId, data) => {
    try {
      const response = await api.put(`/api/admin/users/${userId}/pause`, data);
      return response.data;
    } catch (error) {
      console.error('pauseUser error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to pause user'
      };
    }
  },

  // NEW: Fully restore user functionality
  fullyRestoreUser: async (userId, data) => {
    try {
      const response = await api.put(`/api/admin/users/${userId}/restore`, data);
      return response.data;
    } catch (error) {
      console.error('fullyRestoreUser error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to restore user'
      };
    }
  },

  // Post Management
  getAllPosts: async (params = {}) => {
    try {
      const { page = 1, limit = 10, search = '' } = params;
      const response = await api.get(`/api/admin/posts?page=${page}&limit=${limit}&search=${search}`);
      return response.data;
    } catch (error) {
      console.error('getAllPosts error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch posts',
        posts: [],
        pagination: { current: 1, pages: 1, total: 0 }
      };
    }
  },

  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/api/admin/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('deletePost error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete post'
      };
    }
  },

  // Artwork Management
  getAllArtworks: async (params = {}) => {
    try {
      const { page = 1, limit = 10, search = '', category = '', status = '' } = params;
      const response = await api.get(`/api/admin/artworks?page=${page}&limit=${limit}&search=${search}&category=${category}&status=${status}`);
      return response.data;
    } catch (error) {
      console.error('getAllArtworks error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch artworks',
        artworks: [],
        pagination: { current: 1, pages: 1, total: 0 }
      };
    }
  },

  deleteArtwork: async (artworkId) => {
    try {
      const response = await api.delete(`/api/admin/artworks/${artworkId}`);
      return response.data;
    } catch (error) {
      console.error('deleteArtwork error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete artwork'
      };
    }
  },

  // Auction Management
  getAllAuctions: async (params = {}) => {
    try {
      const { page = 1, limit = 10, status = 'all' } = params;
      const response = await api.get(`/api/admin/auctions?page=${page}&limit=${limit}&status=${status}`);
      return response.data;
    } catch (error) {
      console.error('getAllAuctions error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch auctions',
        auctions: [],
        pagination: { current: 1, pages: 1, total: 0 }
      };
    }
  },

  // Artist Requests
  getArtistRequests: async (params = {}) => {
    try {
      const { page = 1, limit = 10, status = 'pending' } = params;
      const response = await api.get(`/api/admin/artist-requests?page=${page}&limit=${limit}&status=${status}`);
      return response.data;
    } catch (error) {
      console.error('getArtistRequests error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch artist requests',
        requests: [],
        pagination: { current: 1, pages: 1, total: 0 }
      };
    }
  },

  approveArtistRequest: async (requestId, comments = '') => {
    try {
      const response = await api.put(`/api/admin/artist-requests/${requestId}/approve`, { comments });
      return response.data;
    } catch (error) {
      console.error('approveArtistRequest error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to approve artist request'
      };
    }
  },

  rejectArtistRequest: async (requestId, comments = '') => {
    try {
      const response = await api.put(`/api/admin/artist-requests/${requestId}/reject`, { comments });
      return response.data;
    } catch (error) {
      console.error('rejectArtistRequest error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reject artist request'
      };
    }
  },

  // Site Settings
  getSiteSettings: async () => {
    try {
      // For now, return empty response since backend endpoint doesn't exist yet
      return { success: true, settings: {} };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch site settings',
        settings: {}
      };
    }
  },

  updateSiteSettings: async (settings) => {
    try {
      // For now, return success response since backend endpoint doesn't exist yet
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update site settings'
      };
    }
  }
};

export default adminAPI;