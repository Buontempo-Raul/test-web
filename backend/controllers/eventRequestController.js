// backend/controllers/eventRequestController.js
const EventRequest = require('../models/EventRequest');
const Event = require('../models/Event');
const fs = require('fs');
const path = require('path');

// @desc    Create a new event request
// @route   POST /api/eventRequests
// @access  Private
const createEventRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      organizer,
      category,
      price,
      isFree
    } = req.body;
    
    // Get image path if uploaded
    const image = req.file ? req.file.path : 'uploads/events/default-event.jpg';

    const eventRequest = new EventRequest({
      title,
      description,
      date,
      time,
      location,
      organizer: organizer || req.user.username,
      category,
      price: isFree === 'true' ? 0 : price,
      isFree: isFree === 'true',
      image,
      user: req.user._id,
      status: 'pending'
    });

    const createdEventRequest = await eventRequest.save();

    res.status(201).json({
      success: true,
      eventRequest: createdEventRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all event requests
// @route   GET /api/eventRequests
// @access  Private/Admin
const getAllEventRequests = async (req, res) => {
  try {
    const eventRequests = await EventRequest.find({})
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    
    // Format image URLs
    const formattedRequests = eventRequests.map(request => {
      const requestObj = request.toObject();
      if (requestObj.image) {
        requestObj.image = `${req.protocol}://${req.get('host')}/${requestObj.image}`;
      }
      return requestObj;
    });
    
    res.json({
      success: true,
      eventRequests: formattedRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get logged in user's event requests
// @route   GET /api/eventRequests/my
// @access  Private
const getMyEventRequests = async (req, res) => {
  try {
    const eventRequests = await EventRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    // Format image URLs
    const formattedRequests = eventRequests.map(request => {
      const requestObj = request.toObject();
      if (requestObj.image) {
        requestObj.image = `${req.protocol}://${req.get('host')}/${requestObj.image}`;
      }
      return requestObj;
    });
    
    res.json({
      success: true,
      eventRequests: formattedRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get event request by ID
// @route   GET /api/eventRequests/:id
// @access  Private
const getEventRequestById = async (req, res) => {
  try {
    const eventRequest = await EventRequest.findById(req.params.id).populate('user', 'username email');
    
    if (!eventRequest) {
      return res.status(404).json({
        success: false,
        message: 'Event request not found'
      });
    }

    // Check if the user is the creator or an admin
    if (eventRequest.user._id.toString() !== req.user._id.toString() && !req.user.admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this event request'
      });
    }
    
    res.json({
      success: true,
      eventRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update event request status
// @route   PUT /api/eventRequests/:id/status
// @access  Private/Admin
const updateEventRequestStatus = async (req, res) => {
  try {
    const { status, adminFeedback } = req.body;
    
    const eventRequest = await EventRequest.findById(req.params.id);
    
    if (!eventRequest) {
      return res.status(404).json({
        success: false,
        message: 'Event request not found'
      });
    }
    
    eventRequest.status = status;
    eventRequest.adminFeedback = adminFeedback || '';
    eventRequest.reviewedAt = Date.now();
    eventRequest.reviewedBy = req.user._id;
    
    const updatedEventRequest = await eventRequest.save();
    
    // If approved, create a new event
    if (status === 'approved') {
      const newEvent = new Event({
        title: eventRequest.title,
        description: eventRequest.description,
        date: eventRequest.date,
        time: eventRequest.time,
        location: eventRequest.location,
        organizer: eventRequest.organizer,
        category: eventRequest.category,
        price: eventRequest.price,
        isFree: eventRequest.isFree,
        image: eventRequest.image,
        createdBy: eventRequest.user,
        isActive: true
      });
      
      await newEvent.save();
    }
    
    res.json({
      success: true,
      eventRequest: updatedEventRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete event request
// @route   DELETE /api/eventRequests/:id
// @access  Private
const deleteEventRequest = async (req, res) => {
  try {
    const eventRequest = await EventRequest.findById(req.params.id);
    
    if (!eventRequest) {
      return res.status(404).json({
        success: false,
        message: 'Event request not found'
      });
    }
    
    // Check if the user is the creator or an admin
    if (eventRequest.user.toString() !== req.user._id.toString() && !req.user.admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event request'
      });
    }
    
    await eventRequest.deleteOne();
    
    res.json({
      success: true,
      message: 'Event request removed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createEventRequest,
  getAllEventRequests,
  getMyEventRequests,
  getEventRequestById,
  updateEventRequestStatus,
  deleteEventRequest
};