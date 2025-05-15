// src/pages/Admin/EventRequests.js
import React, { useState, useEffect } from 'react';
import './Admin.css';
import { useAuth } from '../../hooks/useAuth';

const AdminEventRequests = () => {
  const { currentUser } = useAuth();
  const [eventRequests, setEventRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    // Fetch event requests
    const fetchEventRequests = async () => {
      try {
        // Simulating API call with mock data
        setTimeout(() => {
          const mockRequests = [
            {
              _id: '1',
              title: 'Modern Art Workshop',
              description: 'A workshop on modern art techniques and appreciation. This interactive session will explore various modern art styles, techniques, and their historical context. Participants will get hands-on experience with different materials and leave with their own creation.',
              date: '2025-06-15',
              time: '1:00 PM - 4:00 PM',
              location: 'City Art Center',
              organizer: 'John Smith',
              category: 'Workshop',
              price: 25,
              isFree: false,
              status: 'pending',
              createdAt: '2025-04-10',
              user: {
                _id: '101',
                username: 'johnsmith',
                email: 'john@example.com'
              }
            },
            {
              _id: '2',
              title: 'Digital Photography Exhibition',
              description: 'Showcase of contemporary digital photography works. The exhibition will feature works from emerging photographers exploring modern urban environments through digital lenses. Special focus on post-processing techniques and creative digital manipulation.',
              date: '2025-07-20',
              time: '10:00 AM - 6:00 PM',
              location: 'Metropolitan Gallery',
              organizer: 'Photo Club',
              category: 'Art Gallery',
              price: 0,
              isFree: true,
              status: 'pending',
              createdAt: '2025-04-05',
              user: {
                _id: '102',
                username: 'photoclub',
                email: 'contact@photoclub.com'
              }
            },
            {
              _id: '3',
              title: 'Abstract Art Symposium',
              description: 'Join leading abstract artists for talks and demonstrations. This day-long symposium will feature panel discussions, live demonstrations, and networking opportunities with established abstract artists from around the country.',
              date: '2025-08-10',
              time: '9:00 AM - 5:00 PM',
              location: 'Contemporary Arts Building',
              organizer: 'Abstract Artists Alliance',
              category: 'Art Festival',
              price: 40,
              isFree: false,
              status: 'approved',
              createdAt: '2025-04-01',
              reviewedAt: '2025-04-02',
              adminFeedback: 'Approved. Great concept and well-organized proposal. We look forward to hosting this event.',
              user: {
                _id: '103',
                username: 'artistalliance',
                email: 'info@artistalliance.org'
              }
            },
            {
              _id: '4',
              title: 'Street Dance Competition',
              description: 'Annual street dance battle with cash prizes. Dancers from all styles including breaking, popping, locking, and hip-hop will compete for recognition and cash prizes. Open to all skill levels with separate novice and advanced categories.',
              date: '2025-06-25',
              time: '6:00 PM - 11:00 PM',
              location: 'Urban Center Plaza',
              organizer: 'Street Dance Crew',
              category: 'Dance Battle',
              price: 15,
              isFree: false,
              status: 'rejected',
              adminFeedback: 'The venue is already booked for this date. Please submit with an alternative location or date.',
              createdAt: '2025-03-25',
              reviewedAt: '2025-03-30',
              user: {
                _id: '104',
                username: 'dancecrew',
                email: 'dance@example.com'
              }
            }
          ];
          
          setEventRequests(mockRequests);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching event requests:', error);
        setIsLoading(false);
      }
    };

    fetchEventRequests();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setFeedbackText(request.adminFeedback || '');
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
    setFeedbackText('');
  };

  const handleFeedbackChange = (e) => {
    setFeedbackText(e.target.value);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      // In a real app, make API call to update status
      // const response = await fetch(`/api/events/requests/${selectedRequest._id}/status`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify({
      //     status: 'approved',
      //     adminFeedback: feedbackText
      //   })
      // });
      
      // const data = await response.json();
      
      // if (data.success) {
      //   // Update the requests list
      // }

      // Simulating API call
      const updatedRequests = eventRequests.map(req => 
        req._id === selectedRequest._id 
          ? { 
              ...req, 
              status: 'approved', 
              adminFeedback: feedbackText,
              reviewedAt: new Date().toISOString() 
            } 
          : req
      );
      
      setEventRequests(updatedRequests);
      
      // Show success message
      alert('Event request approved successfully!');
      
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request. Please try again.');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    // Require feedback for rejection
    if (!feedbackText.trim()) {
      alert('Please provide feedback for the rejection');
      return;
    }

    try {
      // In a real app, make API call to update status
      // const response = await fetch(`/api/events/requests/${selectedRequest._id}/status`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify({
      //     status: 'rejected',
      //     adminFeedback: feedbackText
      //   })
      // });
      
      // const data = await response.json();
      
      // if (data.success) {
      //   // Update the requests list
      // }

      // Simulating API call
      const updatedRequests = eventRequests.map(req => 
        req._id === selectedRequest._id 
          ? { 
              ...req, 
              status: 'rejected', 
              adminFeedback: feedbackText,
              reviewedAt: new Date().toISOString() 
            } 
          : req
      );
      
      setEventRequests(updatedRequests);
      
      // Show success message
      alert('Event request rejected successfully!');
      
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request. Please try again.');
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Filter event requests based on search term and status filter
  const filteredRequests = eventRequests.filter(request => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.user && request.user.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filter === 'all' || request.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return <div className="admin-loading">Loading event requests...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Event Requests</h1>
        <div className="filter-container">
          <select 
            value={filter} 
            onChange={handleFilterChange}
            className="status-filter"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="admin-search">
        <input
          type="text"
          placeholder="Search by title, organizer, or username..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {selectedRequest ? (
        <div className="event-request-details">
          <div className="request-details-header">
            <h2>Event Request Details</h2>
            <button className="admin-button secondary" onClick={handleCloseDetails}>
              Back to Requests
            </button>
          </div>
          
          <div className="request-info-grid">
            <div className="request-info-card">
              <h3>Event Information</h3>
              <p><strong>Title:</strong> {selectedRequest.title}</p>
              <p><strong>Description:</strong> {selectedRequest.description}</p>
              <p><strong>Category:</strong> {selectedRequest.category}</p>
              <p><strong>Date:</strong> {formatDate(selectedRequest.date)}</p>
              <p><strong>Time:</strong> {selectedRequest.time}</p>
              <p><strong>Location:</strong> {selectedRequest.location}</p>
              <p><strong>Organizer:</strong> {selectedRequest.organizer}</p>
              <p><strong>Price:</strong> {selectedRequest.isFree ? 'Free' : `$${selectedRequest.price}`}</p>
            </div>
            
            <div className="request-info-card">
              <h3>Request Information</h3>
              <p><strong>Submitted By:</strong> {selectedRequest.user.username} ({selectedRequest.user.email})</p>
              <p><strong>Submitted On:</strong> {formatDate(selectedRequest.createdAt)}</p>
              <p>
                <strong>Status:</strong> 
                <span className={`status-badge ${getStatusClass(selectedRequest.status)}`}>
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </span>
              </p>
              {selectedRequest.reviewedAt && (
                <p><strong>Reviewed On:</strong> {formatDate(selectedRequest.reviewedAt)}</p>
              )}
              
              {selectedRequest.status === 'pending' && (
                <div className="admin-feedback-input">
                  <h4>Admin Feedback</h4>
                  <textarea
                    rows="4"
                    value={feedbackText}
                    onChange={handleFeedbackChange}
                    placeholder="Enter feedback for the organizer (required for rejection)"
                  ></textarea>
                  
                  <div className="request-actions">
                    <button 
                      className="approve-button"
                      onClick={handleApprove}
                    >
                      Approve Request
                    </button>
                    <button 
                      className="reject-button"
                      onClick={handleReject}
                    >
                      Reject Request
                    </button>
                  </div>
                </div>
              )}
              
              {selectedRequest.status !== 'pending' && selectedRequest.adminFeedback && (
                <div className="admin-feedback-display">
                  <h4>Admin Feedback</h4>
                  <p>{selectedRequest.adminFeedback}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Organizer</th>
                <th>Date</th>
                <th>Submitted By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map(request => (
                  <tr key={request._id}>
                    <td>{request._id}</td>
                    <td>{request.title}</td>
                    <td>{request.organizer}</td>
                    <td>{formatDate(request.date)}</td>
                    <td>{request.user.username}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button
                        className="view-button"
                        onClick={() => handleViewDetails(request)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-results">
                    No event requests found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminEventRequests;