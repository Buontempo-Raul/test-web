// frontend/src/services/adminAPI.js
import api from './api';

export const adminAPI = {
  // Dashboard
  getDashboardStats: () => {
    return api.get('/api/admin/dashboard/stats');
  },
  
  getRecentActivity: (limit = 10) => {
    return api.get(`/api/admin/dashboard/activity?limit=${limit}`);
  },

  // User Management
  getAllUsers: (params = {}) => {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = params;
    return api.get(`/api/admin/users?page=${page}&limit=${limit}&search=${search}&role=${role}&status=${status}`);
  },

  banUser: (userId, data) => {
    return api.put(`/api/admin/users/${userId}/ban`, data);
  },

  pauseUser: (userId, data) => {
    return api.put(`/api/admin/users/${userId}/pause`, data);
  },

  // Post Management
  getAllPosts: (params = {}) => {
    const { page = 1, limit = 10, search = '' } = params;
    return api.get(`/api/admin/posts?page=${page}&limit=${limit}&search=${search}`);
  },

  deletePost: (postId) => {
    return api.delete(`/api/admin/posts/${postId}`);
  },

  // Artwork Management
  getAllArtworks: (params = {}) => {
    const { page = 1, limit = 10, search = '', category = '', status = '' } = params;
    return api.get(`/api/admin/artworks?page=${page}&limit=${limit}&search=${search}&category=${category}&status=${status}`);
  },

  deleteArtwork: (artworkId) => {
    return api.delete(`/api/admin/artworks/${artworkId}`);
  },

  // Auction Management
  getAllAuctions: (params = {}) => {
    const { page = 1, limit = 10, status = 'all' } = params;
    return api.get(`/api/admin/auctions?page=${page}&limit=${limit}&status=${status}`);
  },

  // Artist Requests (to be implemented later)
  getArtistRequests: (params = {}) => {
    const { page = 1, limit = 10, status = 'pending' } = params;
    return api.get(`/api/admin/artist-requests?page=${page}&limit=${limit}&status=${status}`);
  },

  approveArtistRequest: (requestId, comments = '') => {
    return api.put(`/api/admin/artist-requests/${requestId}/approve`, { comments });
  },

  rejectArtistRequest: (requestId, comments = '') => {
    return api.put(`/api/admin/artist-requests/${requestId}/reject`, { comments });
  },

  // Site Settings (to be implemented later)
  getSiteSettings: () => {
    // For now, return empty response since backend endpoint doesn't exist yet
    return Promise.resolve({ data: { success: true, settings: {} } });
  },

  updateSiteSettings: (settings) => {
    // For now, return success response since backend endpoint doesn't exist yet
    return Promise.resolve({ data: { success: true } });
  }
};

export default adminAPI;