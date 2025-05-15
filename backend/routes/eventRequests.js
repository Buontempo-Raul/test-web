// backend/routes/eventRequests.js
const express = require('express');
const router = express.Router();
const {
  createEventRequest,
  getAllEventRequests,
  getMyEventRequests,
  getEventRequestById,
  updateEventRequestStatus,
  deleteEventRequest
} = require('../controllers/eventRequestController');
const { protect, admin } = require('../middleware/authMiddleware');

// Create a new event request
router.post('/', protect, createEventRequest);

// Get all event requests (admin only)
router.get('/', protect, admin, getAllEventRequests);

// Get current user's event requests
router.get('/my', protect, getMyEventRequests);

// Get a single event request by ID
router.get('/:id', protect, getEventRequestById);

// Update event request status (admin only)
router.put('/:id/status', protect, admin, updateEventRequestStatus);

// Delete an event request
router.delete('/:id', protect, deleteEventRequest);

module.exports = router;