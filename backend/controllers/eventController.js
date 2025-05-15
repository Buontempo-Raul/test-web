// backend/controllers/eventController.js
const Event = require('../models/Event');
const EventRequest = require('../models/EventRequest');
const fs = require('fs');
const path = require('path');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { isActive: true };
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Search in title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter past events
    if (req.query.upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .sort({ date: 1 })
      .populate('createdBy', 'username');

    // Generate full URLs for images
    const eventsWithImageUrls = events.map(event => {
      const eventObj = event.toObject();
      if (eventObj.image) {
        eventObj.image = `${req.protocol}://${req.get('host')}/${eventObj.image}`;
      }
      return eventObj;
    });

    res.json({
      success: true,
      count: eventsWithImageUrls.length,
      events: eventsWithImageUrls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Generate full URL for image
    const eventObj = event.toObject();
    if (eventObj.image) {
      eventObj.image = `${req.protocol}://${req.get('host')}/${eventObj.image}`;
    }

    res.json({
      success: true,
      event: eventObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get events created by a user
// @route   GET /api/events/user/:userId
// @access  Public
const getUserEvents = async (req, res) => {
  try {
    const events = await Event.find({ 
      createdBy: req.params.userId,
      isActive: true 
    })
      .sort({ date: 1 })
      .populate('createdBy', 'username');

    // Generate full URLs for images
    const eventsWithImageUrls = events.map(event => {
      const eventObj = event.toObject();
      if (eventObj.image) {
        eventObj.image = `${req.protocol}://${req.get('host')}/${eventObj.image}`;
      }
      return eventObj;
    });

    res.json({
      success: true,
      count: eventsWithImageUrls.length,
      events: eventsWithImageUrls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
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

    const event = new Event({
      title,
      description,
      date,
      time,
      location,
      organizer,
      category,
      price: isFree ? 0 : price,
      isFree: isFree === 'true',
      image,
      createdBy: req.user._id
    });

    const createdEvent = await event.save();

    res.status(201).json({
      success: true,
      event: createdEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Handle image upload if present
    if (req.file) {
      // Delete old image if it exists and it's not the default
      if (event.image && event.image !== 'uploads/events/default-event.jpg') {
        const fullPath = path.join(__dirname, '..', '..', event.image);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      
      // Set new image path
      req.body.image = req.file.path;
    }

    // Update the event
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      event: updatedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Soft delete - set inactive
    event.isActive = false;
    await event.save();

    res.json({
      success: true,
      message: 'Event removed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getEvents,
  getEventById,
  getUserEvents,
  createEvent,
  updateEvent,
  deleteEvent
};