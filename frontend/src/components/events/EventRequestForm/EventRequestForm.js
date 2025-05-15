// src/components/events/EventRequestForm/EventRequestForm.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './EventRequestForm.css';
import { useAuth } from '../../../hooks/useAuth';

const EventRequestForm = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    organizer: currentUser ? currentUser.username : '',
    category: '',
    price: 0,
    isFree: true,
    image: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        ...(name === 'isFree' && checked ? { price: 0 } : {})
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // In a real app, make API call to create event request
      // For now, we'll simulate an API call
      
      // const response = await fetch('/api/events/requests', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify(formData)
      // });
      
      // const data = await response.json();
      
      // if (data.success) {
      //   setSuccess(true);
      // } else {
      //   setError(data.message || 'Failed to create event request');
      // }

      // Simulating API call
      console.log("Submitting event request:", formData);
      setTimeout(() => {
        setIsLoading(false);
        setSuccess(true);
      }, 1000);
    } catch (err) {
      console.error('Error creating event request:', err);
      setError('An error occurred while creating your event request');
      setIsLoading(false);
    }
  };

  const handleViewRequests = () => {
    navigate('/my-event-requests');
  };

  // Make sure today's date is set as the minimum date for the event
  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();

    // Format month and day to ensure two digits
    month = month < 10 ? `0${month}` : month;
    day = day < 10 ? `0${day}` : day;

    return `${year}-${month}-${day}`;
  };

  if (success) {
    return (
      <div className="event-request-success">
        <div className="success-icon">✓</div>
        <h2>Event Request Submitted!</h2>
        <p>Your event request has been submitted successfully.</p>
        <p>An administrator will review your request soon.</p>
        <div className="success-actions">
          <button onClick={handleViewRequests} className="view-requests-btn">
            View My Requests
          </button>
          <button 
            onClick={() => {
              setSuccess(false);
              setFormData({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                organizer: currentUser ? currentUser.username : '',
                category: '',
                price: 0,
                isFree: true,
                image: ''
              });
            }} 
            className="new-request-btn"
          >
            Create Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-request-form-container">
      <h2>Request to Host an Event</h2>
      <p className="form-description">
        Fill out the form below to request approval for your event. 
        An administrator will review your request and respond shortly.
      </p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="event-request-form">
        <div className="form-group">
          <label htmlFor="title">Event Title*</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Event Description*</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            required
            placeholder="Provide a detailed description of your event, including what attendees can expect"
          ></textarea>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Event Date*</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={getMinDate()}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="time">Event Time*</label>
            <input
              type="text"
              id="time"
              name="time"
              placeholder="e.g. 7:00 PM - 10:00 PM"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Event Location*</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Venue name and address"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="organizer">Event Organizer*</label>
          <input
            type="text"
            id="organizer"
            name="organizer"
            value={formData.organizer}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Event Category*</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            <option value="Art Gallery">Art Gallery</option>
            <option value="Fashion Show">Fashion Show</option>
            <option value="Film Premiere">Film Premiere</option>
            <option value="Workshop">Workshop</option>
            <option value="Concert">Concert</option>
            <option value="Performance">Performance</option>
            <option value="Art Festival">Art Festival</option>
            <option value="Dance Battle">Dance Battle</option>
            <option value="Digital Art">Digital Art</option>
          </select>
        </div>

        <div className="form-row price-section">
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="isFree"
              name="isFree"
              checked={formData.isFree}
              onChange={handleChange}
            />
            <label htmlFor="isFree">This is a free event</label>
          </div>

          {!formData.isFree && (
            <div className="form-group">
              <label htmlFor="price">Ticket Price ($)*</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required={!formData.isFree}
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="image">Event Image URL (optional)</label>
          <input
            type="text"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
          <small>Leave blank to use a default image</small>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit Event Request'}
        </button>
      </form>
    </div>
  );
};

export default EventRequestForm;