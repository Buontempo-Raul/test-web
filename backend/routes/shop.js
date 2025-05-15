// backend/routes/shop.js
const express = require('express');
const router = express.Router();
const { 
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  updateOrderToDelivered,
  getFeaturedArtworks
} = require('../controllers/shopController');
const { protect } = require('../middleware/authMiddleware');

// Get featured artworks for shop
router.get('/featured', getFeaturedArtworks);

// Create new order
router.post('/orders', protect, createOrder);

// Get order by ID
router.get('/orders/:id', protect, getOrderById);

// Get logged in user orders
router.get('/myorders', protect, getMyOrders);

// Update order to paid
router.put('/orders/:id/pay', protect, updateOrderToPaid);

// Update order to delivered
router.put('/orders/:id/deliver', protect, updateOrderToDelivered);

module.exports = router;