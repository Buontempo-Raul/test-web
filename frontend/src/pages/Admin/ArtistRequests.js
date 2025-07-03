import React, { useState, useEffect } from 'react';

// Import the admin API service
const adminAPI = {
  getArtistRequests: (params = {}) => {
    const { page = 1, limit = 10, status = 'pending' } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status
    });
    
    return fetch(`/api/admin/artist-requests?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
  },

  approveArtistRequest: (requestId, comments = '') => {
    return fetch(`/api/admin/artist-requests/${requestId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comments })
    }).then(res => res.json());
  },

  rejectArtistRequest: (requestId, comments = '') => {
    return fetch(`/api/admin/artist-requests/${requestId}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comments })
    }).then(res => res.json());
  }
};

const AdminArtistRequests = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [adminComments, setAdminComments] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchRequests();
  }, [filterStatus, pagination.current]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      
      const response = await adminAPI.getArtistRequests({
        page: pagination.current,
        limit: 10,
        status: filterStatus
      });

      if (response.success) {
        setRequests(response.requests);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch artist requests');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching artist requests:', error);
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#f39c12', text: 'Pending' },
      approved: { color: '#27ae60', text: 'Approved' },
      rejected: { color: '#e74c3c', text: 'Rejected' }
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const getExperienceLevel = (level) => {
    const levels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate', 
      advanced: 'Advanced',
      professional: 'Professional'
    };
    return levels[level] || level;
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setActionType('approve');
    setAdminComments('');
    setShowActionModal(true);
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setActionType('reject');
    setAdminComments('');
    setShowActionModal(true);
  };

  const handleActionSubmit = async () => {
    try {
      let response;
      
      if (actionType === 'approve') {
        response = await adminAPI.approveArtistRequest(selectedRequest._id, adminComments);
      } else {
        response = await adminAPI.rejectArtistRequest(selectedRequest._id, adminComments);
      }

      if (response.success) {
        console.log(`${actionType} action successful:`, response);
        
        // Update local state
        setRequests(requests.map(request => 
          request._id === selectedRequest._id 
            ? response.request
            : request
        ));
        
        setShowActionModal(false);
        setSelectedRequest(null);
        setAdminComments('');
      } else {
        throw new Error(response.message || `Failed to ${actionType} request`);
      }
    } catch (error) {
      console.error(`Error with ${actionType} action:`, error);
      // You could show an error message to the user here
    }
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading artist requests...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Artist Requests</h1>
        <p>Review and manage user applications to become artists</p>
      </div>

      <div className="admin-filters">
        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="pending">Pending Requests</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Requests</option>
          </select>
        </div>

        <div className="requests-stats">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{requests.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pending:</span>
            <span className="stat-value pending">{requests.filter(r => r.status === 'pending').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Approved:</span>
            <span className="stat-value approved">{requests.filter(r => r.status === 'approved').length}</span>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Artist Name</th>
              <th>Style & Experience</th>
              <th>Price Range</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(request => {
              const status = getStatusBadge(request.status);
              return (
                <tr key={request._id}>
                  <td>
                    <div className="applicant-info">
                      <div className="applicant-avatar">
                        {request.user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="applicant-name">{request.applicationData.fullName}</div>
                        <div className="applicant-username">@{request.user.username}</div>
                        <div className="applicant-email">{request.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="artist-name-info">
                      <div className="artist-name">{request.applicationData.artistName}</div>
                      {request.applicationData.website && (
                        <div className="artist-website">{request.applicationData.website}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="style-experience">
                      <div className="art-style">{request.applicationData.artStyle}</div>
                      <div className="experience-level">
                        {getExperienceLevel(request.applicationData.experience)}
                      </div>
                      <div className="specialties">
                        {request.applicationData.specialties?.slice(0, 2).map(specialty => (
                          <span key={specialty} className="specialty-tag">{specialty}</span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="price-range">
                      <div className="price-min-max">
                        ${request.applicationData.priceRange.min} - ${request.applicationData.priceRange.max}
                      </div>
                      {request.applicationData.customOrders && (
                        <div className="custom-orders">Custom orders available</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.text}
                    </span>
                  </td>
                  <td>{formatDate(request.submittedAt)}</td>
                  <td className="action-buttons">
                    <button
                      className="view-button"
                      onClick={() => handleViewRequest(request)}
                    >
                      View
                    </button>
                    {request.status === 'pending' && (
                      <>
                        <button
                          className="approve-button"
                          onClick={() => handleApproveClick(request)}
                        >
                          Approve
                        </button>
                        <button
                          className="reject-button"
                          onClick={() => handleRejectClick(request)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Request Details Modal */}
      {showRequestModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Artist Application Details</h3>
              <button onClick={() => setShowRequestModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <div className="request-detail">
                <div className="request-detail-left">
                  <div className="applicant-section">
                    <h4>Applicant Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Full Name:</span>
                        <span className="detail-value">{selectedRequest.applicationData.fullName}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Username:</span>
                        <span className="detail-value">@{selectedRequest.user.username}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{selectedRequest.applicationData.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{selectedRequest.applicationData.phone || 'Not provided'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Website:</span>
                        <span className="detail-value">{selectedRequest.applicationData.website || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="artistic-info-section">
                    <h4>Artistic Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Artist Name:</span>
                        <span className="detail-value">{selectedRequest.applicationData.artistName}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Art Style:</span>
                        <span className="detail-value">{selectedRequest.applicationData.artStyle}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Experience:</span>
                        <span className="detail-value">{getExperienceLevel(selectedRequest.applicationData.experience)}</span>
                      </div>
                      <div className="detail-item full-width">
                        <span className="detail-label">Specialties:</span>
                        <div className="specialties-list">
                          {selectedRequest.applicationData.specialties?.map(specialty => (
                            <span key={specialty} className="specialty-tag">{specialty}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="business-info-section">
                    <h4>Business Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Price Range:</span>
                        <span className="detail-value">
                          ${selectedRequest.applicationData.priceRange.min} - ${selectedRequest.applicationData.priceRange.max}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Custom Orders:</span>
                        <span className="detail-value">
                          {selectedRequest.applicationData.customOrders ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="detail-item full-width">
                        <span className="detail-label">Shipping:</span>
                        <span className="detail-value">{selectedRequest.applicationData.shippingInfo || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="request-detail-right">
                  <div className="portfolio-section">
                    <h4>Portfolio ({selectedRequest.applicationData.portfolioImages?.length || 0} images)</h4>
                    <div className="portfolio-grid">
                      {selectedRequest.applicationData.portfolioImages?.map((image, index) => (
                        <div key={index} className="portfolio-item">
                          <img 
                            src={image.url} 
                            alt={image.title}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0xMDAgMTM3LjVDMTIwLjcxMSAxMzcuNSAxMzcuNSAxMjAuNzExIDEzNy41IDEwMEMxMzcuNSA3OS4yODkzIDEyMC43MTEgNjIuNSAxMDAgNjIuNUM3OS4yODkzIDYyLjUgNjIuNSA3OS4yODkzIDYyLjUgMTAwQzYyLjUgMTIwLjcxMSA3OS4yODkzIDEzNy41IDEwMCAxMzcuNVoiIGZpbGw9IiM2Qzc1N0QiLz4KPC9zdmc+';
                            }}
                          />
                          <div className="portfolio-info">
                            <div className="portfolio-title">{image.title}</div>
                            <div className="portfolio-description">{image.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="description-section">
                    <h4>Portfolio Description</h4>
                    <p>{selectedRequest.applicationData.portfolioDescription}</p>
                  </div>

                  <div className="background-section">
                    <h4>Professional Background</h4>
                    <div className="background-item">
                      <strong>Education:</strong>
                      <p>{selectedRequest.applicationData.education || 'Not provided'}</p>
                    </div>
                    <div className="background-item">
                      <strong>Exhibitions:</strong>
                      <p>{selectedRequest.applicationData.exhibitions || 'Not provided'}</p>
                    </div>
                    <div className="background-item">
                      <strong>Awards:</strong>
                      <p>{selectedRequest.applicationData.awards || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="motivation-section">
                    <h4>Application Statement</h4>
                    <div className="statement-item">
                      <strong>Motivation:</strong>
                      <p>{selectedRequest.applicationData.motivation}</p>
                    </div>
                    <div className="statement-item">
                      <strong>Goals:</strong>
                      <p>{selectedRequest.applicationData.goals}</p>
                    </div>
                  </div>

                  {selectedRequest.reviewComments && (
                    <div className="review-section">
                      <h4>Admin Review</h4>
                      <div className="review-info">
                        <div className="review-status">
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusBadge(selectedRequest.status).color }}
                          >
                            {getStatusBadge(selectedRequest.status).text}
                          </span>
                        </div>
                        <div className="review-details">
                          <p><strong>Reviewed by:</strong> {selectedRequest.reviewedBy?.username}</p>
                          <p><strong>Reviewed on:</strong> {formatDate(selectedRequest.reviewedAt)}</p>
                          <p><strong>Comments:</strong> {selectedRequest.reviewComments}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Approve/Reject) */}
      {showActionModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{actionType === 'approve' ? 'Approve' : 'Reject'} Artist Request</h3>
              <button onClick={() => setShowActionModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to <strong>{actionType}</strong> the artist application from{' '}
                <strong>{selectedRequest.applicationData.fullName}</strong>?
              </p>
              
              <div className="form-group">
                <label>Admin Comments:</label>
                <textarea
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  className="form-textarea"
                  placeholder={`Enter your feedback for the ${actionType === 'approve' ? 'approval' : 'rejection'}...`}
                  rows="4"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  onClick={handleActionSubmit} 
                  className={`submit-button ${actionType}`}
                >
                  {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
                </button>
                <button 
                  onClick={() => setShowActionModal(false)} 
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-page {
          padding: 0;
        }

        .admin-header {
          margin-bottom: 2rem;
        }

        .admin-header h1 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
        }

        .admin-header p {
          margin: 0;
          color: #7f8c8d;
        }

        .admin-filters {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .filter-group {
          min-width: 200px;
        }

        .filter-select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: #667eea;
        }

        .requests-stats {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stat-label {
          color: #7f8c8d;
          font-weight: 500;
        }

        .stat-value {
          font-weight: 600;
          color: #2c3e50;
        }

        .stat-value.pending {
          color: #f39c12;
        }

        .stat-value.approved {
          color: #27ae60;
        }

        .admin-table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          background: #f8f9fa;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 2px solid #e9ecef;
        }

        .admin-table td {
          padding: 1rem;
          border-bottom: 1px solid #e9ecef;
          vertical-align: middle;
        }

        .admin-table tr:hover {
          background-color: #f8f9fa;
        }

        .applicant-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          max-width: 250px;
        }

        .applicant-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          flex-shrink: 0;
        }

        .applicant-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .applicant-username {
          font-size: 0.9rem;
          color: #6c757d;
        }

        .applicant-email {
          font-size: 0.8rem;
          color: #7f8c8d;
        }

        .artist-name-info {
          max-width: 200px;
        }

        .artist-name {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }

        .artist-website {
          font-size: 0.9rem;
          color: #3498db;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .style-experience {
          max-width: 180px;
        }

        .art-style {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }

        .experience-level {
          font-size: 0.9rem;
          color: #6c757d;
          margin-bottom: 0.5rem;
        }

        .specialties {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .specialty-tag {
          background: #e9ecef;
          color: #6c757d;
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
        }

        .price-range {
          text-align: right;
        }

        .price-min-max {
          font-weight: 600;
          color: #27ae60;
          margin-bottom: 0.25rem;
        }

        .custom-orders {
          font-size: 0.8rem;
          color: #7f8c8d;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .view-button,
        .approve-button,
        .reject-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-button {
          background: #3498db;
          color: white;
        }

        .view-button:hover {
          background: #2980b9;
        }

        .approve-button {
          background: #27ae60;
          color: white;
        }

        .approve-button:hover {
          background: #229954;
        }

        .reject-button {
          background: #e74c3c;
          color: white;
        }

        .reject-button:hover {
          background: #c0392b;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-content.large {
          max-width: 1200px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e9ecef;
        }

        .modal-header h3 {
          margin: 0;
          color: #2c3e50;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #7f8c8d;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.3s ease;
        }

        .close-button:hover {
          background: #f8f9fa;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .request-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .applicant-section,
        .artistic-info-section,
        .business-info-section,
        .portfolio-section,
        .description-section,
        .background-section,
        .motivation-section,
        .review-section {
          margin-bottom: 2rem;
        }

        .applicant-section h4,
        .artistic-info-section h4,
        .business-info-section h4,
        .portfolio-section h4,
        .description-section h4,
        .background-section h4,
        .motivation-section h4,
        .review-section h4 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.1rem;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 0.5rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f8f9fa;
        }

        .detail-item.full-width {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .detail-label {
          color: #6c757d;
          font-weight: 500;
          min-width: 120px;
        }

        .detail-value {
          font-weight: 600;
          color: #2c3e50;
          text-align: right;
        }

        .specialties-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .portfolio-item {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .portfolio-item img {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }

        .portfolio-info {
          padding: 0.75rem;
          background: #f8f9fa;
        }

        .portfolio-title {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
        }

        .portfolio-description {
          font-size: 0.8rem;
          color: #6c757d;
          line-height: 1.4;
        }

        .description-section p,
        .background-item p,
        .statement-item p {
          line-height: 1.6;
          color: #495057;
          margin: 0.5rem 0;
        }

        .background-item,
        .statement-item {
          margin-bottom: 1rem;
        }

        .background-item strong,
        .statement-item strong {
          color: #2c3e50;
          display: block;
          margin-bottom: 0.25rem;
        }

        .review-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          border-left: 4px solid #3498db;
        }

        .review-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .review-details p {
          margin: 0.25rem 0;
          line-height: 1.5;
        }

        .form-group {
          margin: 1.5rem 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
          resize: vertical;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .submit-button,
        .cancel-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-button.approve {
          background: #27ae60;
          color: white;
        }

        .submit-button.approve:hover {
          background: #229954;
        }

        .submit-button.reject {
          background: #e74c3c;
          color: white;
        }

        .submit-button.reject:hover {
          background: #c0392b;
        }

        .cancel-button {
          background: #e9ecef;
          color: #6c757d;
        }

        .cancel-button:hover {
          background: #dee2e6;
        }

        .admin-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .admin-filters {
            flex-direction: column;
            align-items: stretch;
          }

          .requests-stats {
            justify-content: space-between;
          }

          .admin-table-container {
            overflow-x: auto;
          }

          .admin-table {
            min-width: 1000px;
          }

          .modal-content {
            width: 95%;
            margin: 1rem;
          }

          .request-detail {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .portfolio-grid {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminArtistRequests;