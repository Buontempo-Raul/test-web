// src/pages/Events/MyEventRequests.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MyEventRequests.css';
import { useAuth } from '../../hooks/useAuth';

const MyEventRequests = () => {
  const { currentUser } = useAuth();
  const [eventRequests, setEventRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventRequests = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // In a real app, fetch from your API
        // const response = await fetch('/api/events/requests/my', {
        //   headers: {
        //     'Authorization': `Bearer ${localStorage.getItem('token')}`
        //   }
        // });
        // const data = await response.json();
        
        // if (data.success) {
        //   setEventRequests(data.eventRequests);
        // } else {
        //   setError(data.message || 'Failed to load event requests');
        // }

        // Simulating API call with mock data
        setTimeout(() => {
          const mockRequests = [
            {
              _id: '1',
              title: 'Modern Art Workshop',
              description: 'A workshop on modern art techniques and appreciation.',
              date: '2025-06-15',
              location: 'City Art Center',
              status: 'pending',
              createdAt: '2025-04-10'
            },
            {
              _id: '2',
              title: 'Digital Photography Exhibition',
              description: 'Showcase of contemporary digital photography works.',
              date: '2025-07-20',
              location: 'Metropolitan Gallery',
              status: 'approved',
              createdAt: '2025-04-05',
              adminFeedback: 'Approved! We look forward to hosting this exhibition.'
            },
            {
              _id: '3',
              title: 'Abstract Art Symposium',
              description: 'Join leading abstract artists for talks and demonstrations.',
              date: '2025-08-10',
              location: 'Contemporary Arts Building',
              status: 'rejected',
              adminFeedback: 'The venue is not available on this date. Please resubmit with alternative dates.',
              createdAt: '2025-04-01'
            }
          ];
          
          setEventRequests(mockRequests);
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error fetching event requests:', err);
        setError('An error occurred while loading your event requests');
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchEventRequests();
    }
  }, [currentUser]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your event requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <Link to="/request-event" className="action-button">Create New Request</Link>
      </div>
    );
  }

  return (
    <div className="my-requests-container">
      <div className="my-requests-header">
        <h1>My Event Requests</h1>
        <Link to="/request-event" className="new-request-button">
          + New Request
        </Link>
      </div>

      {eventRequests.length === 0 ? (
        <div className="no-requests">
          <p>You haven't made any event requests yet.</p>
          <Link to="/request-event" className="action-button">Create Your First Request</Link>
        </div>
      ) : (
        <div className="requests-list">
          {eventRequests.map(request => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <h2>{request.title}</h2>
                <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              
              <div className="request-details">
                <p><strong>Date:</strong> {formatDate(request.date)}</p>
                <p><strong>Location:</strong> {request.location}</p>
                <p><strong>Submitted:</strong> {formatDate(request.createdAt)}</p>
              </div>
              
              <p className="request-description">{request.description}</p>
              
              {request.status === 'rejected' && request.adminFeedback && (
                <div className="admin-feedback">
                  <h3>Admin Feedback:</h3>
                  <p>{request.adminFeedback}</p>
                </div>
              )}
              
              {request.status === 'approved' && request.adminFeedback && (
                <div className="admin-feedback">
                  <h3>Admin Feedback:</h3>
                  <p>{request.adminFeedback}</p>
                </div>
              )}
              
              <div className="request-actions">
                <Link to={`/event-requests/${request._id}`} className="view-details-button">
                  View Details
                </Link>
                
                {request.status === 'rejected' && (
                  <Link to={`/request-event?edit=${request._id}`} className="resubmit-button">
                    Resubmit
                  </Link>
                )}
                
                {request.status === 'approved' && (
                  <Link to={`/events`} className="view-event-button">
                    View Event
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEventRequests;