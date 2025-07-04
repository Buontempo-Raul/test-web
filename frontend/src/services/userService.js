// backend/services/userService.js - Updated with follower/following population
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
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('followers', '_id username')
      .populate('following', '_id username');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a user by username - Updated to include followers/following
 * @param {string} username - Username
 * @returns {Promise<Object>} User object with followers/following populated
 */
const getUserByUsername = async (username) => {
  try {
    const user = await User.findOne({ username })
      .select('-password')
      .populate('followers', '_id username profileImage')
      .populate('following', '_id username profileImage');
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
    
    // Check if email or username already exists (if being updated)
    if (updateData.email) {
      const existingUserByEmail = await User.findOne({ 
        email: updateData.email, 
        _id: { $ne: userId } 
      });
      if (existingUserByEmail) {
        throw new Error('Email already in use');
      }
    }
    
    if (updateData.username) {
      const existingUserByUsername = await User.findOne({ 
        username: updateData.username, 
        _id: { $ne: userId } 
      });
      if (existingUserByUsername) {
        throw new Error('Username already taken');
      }
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user (admin only)
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user
 */
const updateUser = async (userId, updateData) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    // Check if email or username already exists (if being updated)
    if (updateData.email) {
      const existingUserByEmail = await User.findOne({ 
        email: updateData.email, 
        _id: { $ne: userId } 
      });
      if (existingUserByEmail) {
        throw new Error('Email already in use');
      }
    }
    
    if (updateData.username) {
      const existingUserByUsername = await User.findOne({ 
        username: updateData.username, 
        _id: { $ne: userId } 
      });
      if (existingUserByUsername) {
        throw new Error('Username already taken');
      }
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const deleteUser = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return;
  } catch (error) {
    throw error;
  }
};

/**
 * Make user an artist
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
const makeUserArtist = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.isArtist) {
      throw new Error('User is already an artist');
    }
    
    user.isArtist = true;
    await user.save();
    
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Add artwork to user's favorites
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
    
    // Check if artwork exists (you might need to import Artwork model)
    // const artwork = await Artwork.findById(artworkId);
    // if (!artwork) {
    //   throw new Error('Artwork not found');
    // }
    
    // Check if artwork is already in favorites
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
 * Remove artwork from user's favorites
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
      .populate('followers', '_id username')
      .populate('following', '_id username')
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
  updateUser,
  deleteUser,
  makeUserArtist,
  addToFavorites,
  removeFromFavorites,
  getAllUsers
};