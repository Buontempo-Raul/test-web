// backend/controllers/artistRequestController.js
const ArtistRequest = require('../models/ArtistRequest');
const User = require('../models/User');

// @desc    Create new artist request
// @route   POST /api/artist-requests
// @access  Private
const createArtistRequest = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user already has a pending request
    const existingRequest = await ArtistRequest.hasUserPendingRequest(userId);
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending artist request'
      });
    }

    // Check if user is already an artist
    if (req.user.isArtist) {
      return res.status(400).json({
        success: false,
        message: 'You are already an artist'
      });
    }

    const artistRequest = await ArtistRequest.create({
      user: userId,
      applicationData: req.body
    });

    await artistRequest.populate('user', 'username email profileImage createdAt');

    res.status(201).json({
      success: true,
      request: artistRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all artist requests (admin)
// @route   GET /api/admin/artist-requests
// @access  Private/Admin
const getAllArtistRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'pending' } = req.query;

    const query = status === 'all' ? {} : { status };

    const requests = await ArtistRequest.find(query)
      .populate('user', 'username email profileImage createdAt')
      .populate('reviewedBy', 'username')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ArtistRequest.countDocuments(query);

    res.json({
      success: true,
      requests,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single artist request (admin)
// @route   GET /api/admin/artist-requests/:requestId
// @access  Private/Admin
const getArtistRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await ArtistRequest.findById(requestId)
      .populate('user', 'username email profileImage createdAt')
      .populate('reviewedBy', 'username');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Artist request not found'
      });
    }

    res.json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve artist request
// @route   PUT /api/admin/artist-requests/:requestId/approve
// @access  Private/Admin
const approveArtistRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { comments = '' } = req.body;

    const request = await ArtistRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Artist request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been reviewed'
      });
    }

    // Approve the request and make user an artist
    await request.approve(req.user._id, comments);

    // Populate the updated request
    await request.populate('user', 'username email profileImage createdAt');
    await request.populate('reviewedBy', 'username');

    res.json({
      success: true,
      message: 'Artist request approved successfully',
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject artist request
// @route   PUT /api/admin/artist-requests/:requestId/reject
// @access  Private/Admin
const rejectArtistRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { comments = '' } = req.body;

    const request = await ArtistRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Artist request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been reviewed'
      });
    }

    // Reject the request
    await request.reject(req.user._id, comments);

    // Populate the updated request
    await request.populate('user', 'username email profileImage createdAt');
    await request.populate('reviewedBy', 'username');

    res.json({
      success: true,
      message: 'Artist request rejected',
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's own artist request
// @route   GET /api/artist-requests/me
// @access  Private
const getUserArtistRequest = async (req, res) => {
  try {
    const request = await ArtistRequest.findOne({ 
      user: req.user._id 
    })
      .populate('reviewedBy', 'username')
      .sort({ submittedAt: -1 });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'No artist request found'
      });
    }

    res.json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update artist request (before review)
// @route   PUT /api/artist-requests/:requestId
// @access  Private
const updateArtistRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await ArtistRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Artist request not found'
      });
    }

    // Check if user owns this request
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own requests'
      });
    }

    // Check if request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a request that has been reviewed'
      });
    }

    // Update the application data
    request.applicationData = { ...request.applicationData, ...req.body };
    await request.save();

    res.json({
      success: true,
      message: 'Artist request updated successfully',
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete artist request (before review)
// @route   DELETE /api/artist-requests/:requestId
// @access  Private
const deleteArtistRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await ArtistRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Artist request not found'
      });
    }

    // Check if user owns this request or is admin
    if (request.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own requests'
      });
    }

    // Check if request is still pending (users can only delete pending requests)
    if (request.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a request that has been reviewed'
      });
    }

    await ArtistRequest.findByIdAndDelete(requestId);

    res.json({
      success: true,
      message: 'Artist request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get artist request statistics (admin)
// @route   GET /api/admin/artist-requests/stats
// @access  Private/Admin
const getArtistRequestStats = async (req, res) => {
  try {
    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      recentRequests
    ] = await Promise.all([
      ArtistRequest.countDocuments(),
      ArtistRequest.countDocuments({ status: 'pending' }),
      ArtistRequest.countDocuments({ status: 'approved' }),
      ArtistRequest.countDocuments({ status: 'rejected' }),
      ArtistRequest.find({ status: 'pending' })
        .populate('user', 'username email')
        .sort({ submittedAt: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      stats: {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests,
        recent: recentRequests
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createArtistRequest,
  getAllArtistRequests,
  getArtistRequest,
  approveArtistRequest,
  rejectArtistRequest,
  getUserArtistRequest,
  updateArtistRequest,
  deleteArtistRequest,
  getArtistRequestStats
};