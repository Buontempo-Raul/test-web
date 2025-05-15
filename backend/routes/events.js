// backend/routes/events.js
const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  getUserEvents,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const { protect, admin } = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Get all events
router.get('/', getEvents);

// Get event by ID
router.get('/:id', getEventById);

// Get events by user ID
router.get('/user/:userId', getUserEvents);

// Create new event (admin only)
router.post(
  '/',
  protect,
  admin,
  uploadMiddleware.single('image'),
  uploadMiddleware.handleMulterError,
  createEvent
);

// Update event (admin only)
router.put(
  '/:id',
  protect,
  admin,
  uploadMiddleware.single('image'),
  uploadMiddleware.handleMulterError,
  updateEvent
);

// Delete event (admin only)  
router.delete('/:id', protect, admin, deleteEvent);

module.exports = router;