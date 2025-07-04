// src/components/common/ProtectedRoute/ProtectedRoute.js - Fixed version without external dependencies
import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

// Simple modal component for ban/pause messages (inline to avoid import issues)
const BanPauseModal = ({ show, onClose, accountStatus, onLogout }) => {
  if (!show || !accountStatus || accountStatus.allowed) {
    return null;
  }

  const isBanned = accountStatus.status === 'banned';
  const isPaused = accountStatus.status === 'paused';
  const isInactive = accountStatus.status === 'inactive';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem 2rem 1rem 2rem',
          textAlign: 'center',
          borderBottom: '1px solid #e9ecef',
          background: isBanned ? 'linear-gradient(135deg, #fee, #fcc)' : 
                     isPaused ? 'linear-gradient(135deg, #fff3cd, #ffeaa7)' : 
                     'linear-gradient(135deg, #e2e3e5, #d1ecf1)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {isBanned && '🚫'}
            {isPaused && '⏸️'}
            {isInactive && '🔒'}
          </div>
          <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.5rem' }}>
            {isBanned && 'Account Banned'}
            {isPaused && 'Account Suspended'}
            {isInactive && 'Account Deactivated'}
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: '2rem' }}>
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            borderLeft: '4px solid #007bff'
          }}>
            <p style={{ margin: 0 }}>{accountStatus.message}</p>
          </div>

          {accountStatus.reason && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: '#f8d7da',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#721c24' }}>Reason:</h4>
              <p style={{ margin: 0, color: '#721c24', fontStyle: 'italic' }}>
                {accountStatus.reason}
              </p>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#2c3e50' }}>What can I do?</h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {(isBanned || isPaused) && (
                <li style={{ marginBottom: '0.5rem', color: '#495057' }}>
                  Wait for the {isBanned ? 'ban' : 'suspension'} period to end
                </li>
              )}
              <li style={{ marginBottom: '0.5rem', color: '#495057' }}>
                Contact support if you believe this is a mistake
              </li>
              <li style={{ marginBottom: '0.5rem', color: '#495057' }}>
                Review our community guidelines
              </li>
              {isInactive && (
                <li style={{ marginBottom: '0.5rem', color: '#495057' }}>
                  Contact support to reactivate your account
                </li>
              )}
            </ul>
          </div>

          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#d4edda',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#155724' }}>
              <strong>Need help?</strong> Contact us at:{' '}
              <a href="mailto:support@uncreated.com" style={{ color: '#155724', fontWeight: 'bold' }}>
                support@uncreated.com
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 2rem 2rem 2rem',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button 
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              background: '#6c757d',
              color: 'white'
            }}
            onClick={onLogout}
          >
            Logout
          </button>
          <button 
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              background: '#007bff',
              color: 'white'
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced ProtectedRoute component that handles authentication and ban/pause states
const ProtectedRoute = ({ adminOnly = false, allowBannedReadOnly = false }) => {
  const { isAuthenticated, isAdmin, loading, accountStatus, currentUser, logout } = useAuth();
  const location = useLocation();
  const [showBanPauseModal, setShowBanPauseModal] = useState(false);

  // Check if we should show the ban/pause modal
  useEffect(() => {
    if (!loading && currentUser && accountStatus && !accountStatus.allowed) {
      setShowBanPauseModal(true);
    } else {
      setShowBanPauseModal(false);
    }
  }, [loading, currentUser, accountStatus]);

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <p style={{ color: '#666', margin: 0 }}>Checking authentication...</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Handle ban/pause modal
  const handleCloseBanPauseModal = () => {
    setShowBanPauseModal(false);
  };

  const handleLogout = () => {
    logout();
    setShowBanPauseModal(false);
  };

  // If user is not authenticated at all, redirect to login
  if (!isAuthenticated && !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user exists but account is not allowed (banned/paused)
  if (currentUser && accountStatus && !accountStatus.allowed) {
    // For read-only routes, show a warning but allow access
    if (allowBannedReadOnly) {
      return (
        <>
          <div style={{
            background: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
            borderBottom: '1px solid #faebcc',
            padding: '1rem',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              maxWidth: '1200px',
              margin: '0 auto',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '1.2rem' }}>
                {accountStatus.status === 'banned' ? '🚫' : accountStatus.status === 'paused' ? '⏸️' : '🔒'}
              </span>
              <span style={{
                color: '#856404',
                fontWeight: '600',
                flex: 1,
                textAlign: 'center',
                minWidth: '200px'
              }}>
                Limited access mode: {accountStatus.message}
              </span>
              <button 
                style={{
                  background: '#856404',
                  color: '#fff3cd',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
                onClick={() => setShowBanPauseModal(true)}
                onMouseOver={(e) => e.target.style.background = '#6c5228'}
                onMouseOut={(e) => e.target.style.background = '#856404'}
              >
                Details
              </button>
            </div>
          </div>
          <Outlet />
          <BanPauseModal 
            show={showBanPauseModal}
            onClose={handleCloseBanPauseModal}
            accountStatus={accountStatus}
            onLogout={handleLogout}
          />
        </>
      );
    }

    // For protected routes, show the ban/pause modal and block access
    return (
      <>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '2rem'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {accountStatus.status === 'banned' ? '🚫' : accountStatus.status === 'paused' ? '⏸️' : '🔒'}
            </div>
            <h2 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>Access Restricted</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Your account access has been limited.</p>
            <button 
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setShowBanPauseModal(true)}
              onMouseOver={(e) => {
                e.target.style.background = '#5a6fd8';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#667eea';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              View Details
            </button>
          </div>
        </div>
        
        <BanPauseModal 
          show={showBanPauseModal}
          onClose={handleCloseBanPauseModal}
          accountStatus={accountStatus}
          onLogout={handleLogout}
        />
      </>
    );
  }

  // If route requires admin privileges and user is not admin, redirect to home
  if (adminOnly && !isAdmin) {
    console.log("Access denied: Admin privileges required");
    return <Navigate to="/" replace />;
  }

  // User is authenticated and account is active, render the protected content
  return (
    <>
      <Outlet />
      <BanPauseModal 
        show={showBanPauseModal}
        onClose={handleCloseBanPauseModal}
        accountStatus={accountStatus}
        onLogout={handleLogout}
      />
    </>
  );
};

export default ProtectedRoute;