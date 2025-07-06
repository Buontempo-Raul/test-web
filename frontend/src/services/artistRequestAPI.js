// frontend/src/services/artistRequestAPI.js
import api from './api';

const artistRequestAPI = {
  // Create new artist request
  createArtistRequest: async (requestData) => {
    try {
      const response = await api.post('/api/artist-requests', requestData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('createArtistRequest error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit artist request'
      };
    }
  },

  // Get user's own artist request
  getUserArtistRequest: async () => {
    try {
      const response = await api.get('/api/artist-requests/me');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('getUserArtistRequest error:', error);
      if (error.response?.status === 404) {
        return {
          success: true,
          data: { request: null }
        };
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch artist request'
      };
    }
  },

  // Update artist request (before review)
  updateArtistRequest: async (requestId, requestData) => {
    try {
      const response = await api.put(`/api/artist-requests/${requestId}`, requestData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('updateArtistRequest error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update artist request'
      };
    }
  },

  // Delete artist request (before review)
  deleteArtistRequest: async (requestId) => {
    try {
      const response = await api.delete(`/api/artist-requests/${requestId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('deleteArtistRequest error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete artist request'
      };
    }
  },

  // Upload portfolio images
  uploadPortfolioImages: async (files) => {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('portfolioImages', file);
      });

      const response = await api.post('/api/uploads/portfolio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('uploadPortfolioImages error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload images'
      };
    }
  }
};

export default artistRequestAPI;