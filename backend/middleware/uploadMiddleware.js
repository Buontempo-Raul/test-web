// backend/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage for different types of uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/'; // Default upload path
    
    // Determine upload directory based on file type (from route)
    if (req.originalUrl.includes('/artworks')) {
      uploadPath = 'uploads/artworks/';
    } else if (req.originalUrl.includes('/users')) {
      uploadPath = 'uploads/profiles/';
    } else if (req.originalUrl.includes('/posts')) {
      uploadPath = 'uploads/posts/';
    }
    // Removed events upload path
    
    // Create directory if it doesn't exist
    createDirIfNotExists(uploadPath);
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to validate uploaded files
const fileFilter = (req, file, cb) => {
  // Accept images only
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: JPEG, PNG, GIF, WebP. Received: ${file.mimetype}`), false);
  }
};

// Create the multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: fileFilter
});

// @desc    Upload profile image
// @route   POST /api/users/profile/upload
// @access  Private
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get the user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile image if it exists and it's not the default
    if (user.profileImage && 
        user.profileImage !== 'default-profile.jpg' && 
        user.profileImage.startsWith('uploads/')) {
      const fullPath = path.join(__dirname, '..', '..', user.profileImage);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    // Update user with new profile image
    user.profileImage = req.file.path;
    await user.save();

    res.json({
      success: true,
      message: 'Profile image updated',
      profileImage: `${req.protocol}://${req.get('host')}/${req.file.path}`
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile image'
    });
  }
};

// Export different upload middleware configurations
module.exports = {
  // For single file uploads
  single: (fieldName = 'image') => upload.single(fieldName),
  
  // For multiple file uploads (up to 5 files)
  array: (fieldName = 'images', maxCount = 5) => upload.array(fieldName, maxCount),
  
  // For multiple fields with different file counts
  fields: (fields) => upload.fields(fields),
  
  // Handle multer errors
  handleMulterError: (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  }
};