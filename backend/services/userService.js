// backend/services/userService.js
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async (userData) => {
  try {
    const user = await User.create(userData);
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User object
 */
const getUserById = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a user by username
 * @param {string} username - Username
 * @returns {Promise<Object>} User object
 */
const getUserByUsername = async (username) => {
  try {
    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a user by email
 * @param {string} email - Email address
 * @returns {Promise<Object>} User object
 */
const getUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user
 */
const updateUserProfile = async (userId, updateData) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Find user first to check if it exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If updating email or username, check for uniqueness
    if (updateData.email && updateData.email !== user.email) {
      const emailExists = await User.findOne({ email: updateData.email });
      if (emailExists) {
        throw new Error('Email already in use');
      }
    }

    if (updateData.username && updateData.username !== user.username) {
      const usernameExists = await User.findOne({ username: updateData.username });
      if (usernameExists) {
        throw new Error('Username already taken');
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    return updatedUser;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
const deleteUser = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      throw new Error('User not found');
    }
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Make a user an artist
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
const makeUserArtist = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isArtist: true },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    return updatedUser;
  } catch (error) {
    throw error;
  }
};

/**
 * Add artwork to user favorites
 * @param {string} userId - User ID
 * @param {string} artworkId - Artwork ID
 * @returns {Promise<Object>} Updated user
 */
const addToFavorites = async (userId, artworkId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(artworkId)) {
      throw new Error('Invalid ID format');
    }
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if artwork already in favorites
    if (user.favorites.includes(artworkId)) {
      throw new Error('Artwork already in favorites');
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { favorites: artworkId } },
      { new: true }
    ).select('-password');
    
    return updatedUser;
  } catch (error) {
    throw error;
  }
};

/**
 * Remove artwork from user favorites
 * @param {string} userId - User ID
 * @param {string} artworkId - Artwork ID
 * @returns {Promise<Object>} Updated user
 */
const removeFromFavorites = async (userId, artworkId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(artworkId)) {
      throw new Error('Invalid ID format');
    }
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if artwork is in favorites
    if (!user.favorites.includes(artworkId)) {
      throw new Error('Artwork not in favorites');
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { favorites: artworkId } },
      { new: true }
    ).select('-password');
    
    return updatedUser;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all users (admin only)
 * @param {Object} query - Query parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Users with pagination info
 */
const getAllUsers = async (query = {}, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    return {
      users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      totalUsers
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  updateUserProfile,
  deleteUser,
  makeUserArtist,
  addToFavorites,
  removeFromFavorites,
  getAllUsers
};