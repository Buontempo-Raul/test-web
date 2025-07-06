// frontend/src/components/ArtistRequestForm/ArtistRequestForm.js - BUSINESS STEP REMOVED
import React, { useState, useEffect } from 'react';
import artistRequestAPI from '../../services/artistRequestAPI';
import './ArtistRequestForm.css';

const ArtistRequestForm = ({ onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingRequest, setExistingRequest] = useState(null);

  // Form data state - REMOVED BUSINESS FIELDS
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    artistName: '',
    email: '',
    phone: '',
    
    // Professional Information
    artStyle: '',
    experience: '',
    
    // Portfolio
    portfolioImages: [],
    portfolioDescription: '',
    
    // Application Statement
    motivation: '',
    goals: ''
    
    // REMOVED: website, specialties, priceRange, customOrders, shippingInfo, education, exhibitions, awards, socialLinks
  });

  // Portfolio image handling
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Check for existing request on component mount
  useEffect(() => {
    checkExistingRequest();
  }, []);

  const checkExistingRequest = async () => {
    try {
      const result = await artistRequestAPI.getUserArtistRequest();
      if (result.success && result.data.request) {
        setExistingRequest(result.data.request);
        if (result.data.request.status === 'pending') {
          // Pre-fill form with existing data
          setFormData(result.data.request.applicationData);
        }
      }
    } catch (error) {
      console.error('Error checking existing request:', error);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle image uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5;
    
    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    setImageFiles(files);

    // Create previews
    const previews = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          file,
          url: e.target.result,
          title: '',
          description: ''
        });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previews).then(setImagePreviews);
  };

  const updateImageMetadata = (index, field, value) => {
    setImagePreviews(prev => prev.map((img, i) => 
      i === index ? { ...img, [field]: value } : img
    ));
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Form validation - UPDATED FOR 3 STEPS
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.fullName && formData.artistName && formData.email && formData.artStyle && formData.experience;
      case 2:
        return formData.portfolioDescription && imagePreviews.length > 0;
      case 3:
        return formData.motivation && formData.goals;
      default:
        return true;
    }
  };

  // Handle step navigation - UPDATED FOR 3 STEPS
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3)); // Changed from 4 to 3
      setError('');
    } else {
      setError('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  // Handle form submission - UPDATED VALIDATION
  const handleSubmit = async () => {
    if (!validateStep(3)) { // Changed from 4 to 3
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Prepare final form data with portfolio images
      const finalFormData = {
        ...formData,
        portfolioImages: imagePreviews.map(img => ({
          url: img.url,
          title: img.title,
          description: img.description
        }))
      };

      const result = await artistRequestAPI.createArtistRequest(finalFormData);

      if (result.success) {
        onSuccess && onSuccess(result.data);
      } else {
        setError(result.message || 'Failed to submit request');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user already has a request
  if (existingRequest) {
    return (
      <div className="artist-request-overlay">
        <div className="artist-request-modal">
          <div className="modal-header">
            <h2>Artist Application Status</h2>
            <button onClick={onClose} className="close-button">×</button>
          </div>
          <div className="modal-body">
            <div className="request-status">
              <div className={`status-badge ${existingRequest.status}`}>
                {existingRequest.status.charAt(0).toUpperCase() + existingRequest.status.slice(1)}
              </div>
              <p>
                {existingRequest.status === 'pending' && 'Your artist application is being reviewed. We will notify you once a decision is made.'}
                {existingRequest.status === 'approved' && 'Congratulations! Your artist application has been approved. You can now start adding artworks.'}
                {existingRequest.status === 'rejected' && 'Your artist application was not approved at this time. You can submit a new application.'}
              </p>
              {existingRequest.reviewComments && (
                <div className="review-comments">
                  <h4>Admin Comments:</h4>
                  <p>{existingRequest.reviewComments}</p>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={onClose} className="btn btn-secondary">Close</button>
              {existingRequest.status === 'rejected' && (
                <button 
                  onClick={() => setExistingRequest(null)} 
                  className="btn btn-primary"
                >
                  Submit New Application
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const specialtyOptions = [
    'Painting', 'Drawing', 'Sculpture', 'Photography', 'Digital Art', 
    'Mixed Media', 'Printmaking', 'Ceramics', 'Jewelry', 'Textile Art', 'Other'
  ];

  // UPDATED RENDER STEP - REMOVED BUSINESS STEP
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-step">
            <h3>Personal & Professional Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Artist/Display Name *</label>
                <input
                  type="text"
                  name="artistName"
                  value={formData.artistName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Art Style *</label>
                <input
                  type="text"
                  name="artStyle"
                  value={formData.artStyle}
                  onChange={handleInputChange}
                  placeholder="e.g., Abstract, Realism, Modern, etc."
                  required
                />
              </div>
              <div className="form-group">
                <label>Experience Level *</label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select experience level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-step">
            <h3>Portfolio</h3>
            
            <div className="form-group">
              <label>Portfolio Images * (Max 5 images)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
              <p className="help-text">Upload your best artwork images (JPG, PNG, max 5MB each)</p>
            </div>

            {imagePreviews.length > 0 && (
              <div className="image-previews">
                {imagePreviews.map((img, index) => (
                  <div key={index} className="image-preview">
                    <img src={img.url} alt={`Portfolio ${index + 1}`} />
                    <div className="image-metadata">
                      <input
                        type="text"
                        placeholder="Image title"
                        value={img.title}
                        onChange={(e) => updateImageMetadata(index, 'title', e.target.value)}
                      />
                      <textarea
                        placeholder="Image description"
                        value={img.description}
                        onChange={(e) => updateImageMetadata(index, 'description', e.target.value)}
                        rows="2"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-image"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label>Portfolio Description * (Max 1000 characters)</label>
              <textarea
                name="portfolioDescription"
                value={formData.portfolioDescription}
                onChange={handleInputChange}
                maxLength="1000"
                rows="6"
                placeholder="Describe your artistic style, influences, and the work you've included in your portfolio..."
                required
              />
              <span className="char-count">{formData.portfolioDescription.length}/1000</span>
            </div>
          </div>
        );

      case 3: // CHANGED FROM CASE 4
        return (
          <div className="form-step">
            <h3>Application Statement</h3>
            
            <div className="form-group">
              <label>Why do you want to become an artist on our platform? * (Max 500 characters)</label>
              <textarea
                name="motivation"
                value={formData.motivation}
                onChange={handleInputChange}
                maxLength="500"
                rows="5"
                placeholder="Tell us what motivates you and why you'd like to join our community..."
                required
              />
              <span className="char-count">{formData.motivation.length}/500</span>
            </div>

            <div className="form-group">
              <label>What are your goals as an artist? * (Max 500 characters)</label>
              <textarea
                name="goals"
                value={formData.goals}
                onChange={handleInputChange}
                maxLength="500"
                rows="5"
                placeholder="Describe your artistic goals and what you hope to achieve..."
                required
              />
              <span className="char-count">{formData.goals.length}/500</span>
            </div>

            <div className="application-summary">
              <h4>Application Summary</h4>
              <div className="summary-item">
                <strong>Name:</strong> {formData.fullName} ({formData.artistName})
              </div>
              <div className="summary-item">
                <strong>Email:</strong> {formData.email}
              </div>
              <div className="summary-item">
                <strong>Style:</strong> {formData.artStyle}
              </div>
              <div className="summary-item">
                <strong>Experience:</strong> {formData.experience}
              </div>
              <div className="summary-item">
                <strong>Portfolio Images:</strong> {imagePreviews.length} uploaded
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="artist-request-overlay">
      <div className="artist-request-modal">
        <div className="modal-header">
          <h2>Apply to Become an Artist</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {/* UPDATED PROGRESS BAR - 3 STEPS INSTEAD OF 4 */}
        <div className="modal-progress">
          <div className="progress-bar">
            {[1, 2, 3].map(step => (
              <div 
                key={step} 
                className={`progress-step ${currentStep >= step ? 'active' : ''}`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="progress-labels">
            <span>Personal Info</span>
            <span>Portfolio</span>
            <span>Statement</span>
          </div>
        </div>

        <div className="modal-body">
          {renderStep()}
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* UPDATED NAVIGATION - 3 STEPS INSTEAD OF 4 */}
        <div className="modal-actions">
          <button 
            onClick={onClose} 
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          {currentStep > 1 && (
            <button 
              onClick={prevStep} 
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Previous
            </button>
          )}
          
          {currentStep < 3 ? ( // CHANGED FROM 4 TO 3
            <button 
              onClick={nextStep} 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              Next
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistRequestForm;