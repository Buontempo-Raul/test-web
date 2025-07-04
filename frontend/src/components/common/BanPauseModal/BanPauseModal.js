import React, { useState, useEffect } from 'react';

const DifferentiatedBanPauseModal = ({ show, onClose, accountStatus, onLogout, onRefresh }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    if (!accountStatus || accountStatus.allowed) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(accountStatus.banUntil || accountStatus.pauseUntil);
      
      if (endDate > now) {
        const diff = endDate - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeRemaining(`${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`);
        } else {
          setTimeRemaining(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        }
      } else {
        setTimeRemaining('Expired');
        if (onRefresh) onRefresh();
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [accountStatus, onRefresh]);

  if (!show || !accountStatus || accountStatus.allowed) {
    return null;
  }

  const isBanned = accountStatus.status === 'banned';
  const isPaused = accountStatus.status === 'paused';
  const isInactive = accountStatus.status === 'inactive';

  // Different styling and content for each status
  const getStatusConfig = () => {
    if (isBanned) {
      return {
        title: 'Account Banned',
        icon: '🚫',
        severity: 'SEVERE',
        color: '#dc3545',
        bgGradient: 'linear-gradient(135deg, #fee, #fcc)',
        borderColor: '#f5c6cb',
        description: 'Complete platform restriction for policy violations',
        restrictions: [
          'No login access',
          'All content blocked',
          'No interactions allowed',
          'Profile hidden from search'
        ],
        allowedActions: [],
        appealAllowed: true,
        autoRemoval: false
      };
    } else if (isPaused) {
      return {
        title: 'Account Suspended',
        icon: '⏸️',
        severity: 'MODERATE',
        color: '#ffc107',
        bgGradient: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
        borderColor: '#faebcc',
        description: 'Temporary suspension - limited access available',
        restrictions: [
          'No posting or commenting',
          'No artwork uploads',
          'Limited interactions'
        ],
        allowedActions: [
          'View public content',
          'Access profile settings',
          'Change password',
          'Contact support'
        ],
        appealAllowed: true,
        autoRemoval: true
      };
    } else {
      return {
        title: 'Account Deactivated',
        icon: '🔒',
        severity: 'ADMINISTRATIVE',
        color: '#6c757d',
        bgGradient: 'linear-gradient(135deg, #e2e3e5, #d1ecf1)',
        borderColor: '#bee5eb',
        description: 'Account deactivated by administration',
        restrictions: [
          'No platform access',
          'Profile deactivated',
          'Content archived'
        ],
        allowedActions: ['Contact support'],
        appealAllowed: true,
        autoRemoval: false
      };
    }
  };

  const config = getStatusConfig();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: `0 25px 50px rgba(0, 0, 0, 0.4)`,
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: `3px solid ${config.color}`
      }}>
        {/* Header */}
        <div style={{
          background: config.bgGradient,
          borderBottom: `2px solid ${config.borderColor}`,
          padding: '2rem',
          textAlign: 'center',
          borderRadius: '16px 16px 0 0'
        }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '1rem',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
          }}>
            {config.icon}
          </div>
          <h2 style={{ 
            margin: 0, 
            color: '#2c3e50', 
            fontSize: '1.8rem',
            fontWeight: 'bold'
          }}>
            {config.title}
          </h2>
          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            display: 'inline-block',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: config.color,
            border: `2px solid ${config.color}`
          }}>
            SEVERITY: {config.severity}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '2rem' }}>
          {/* Main Message */}
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: '#f8f9fa',
            borderRadius: '12px',
            borderLeft: `6px solid ${config.color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
              {config.description}
            </h4>
            <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.5' }}>
              {accountStatus.message}
            </p>
          </div>

          {/* Time Remaining (for temporary restrictions) */}
          {(isBanned || isPaused) && timeRemaining && timeRemaining !== 'Expired' && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: isBanned ? '#fee' : '#fff3cd',
              borderRadius: '12px',
              textAlign: 'center',
              border: `2px solid ${config.color}`
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: config.color }}>
                {isBanned ? 'Ban expires in:' : 'Suspension expires in:'}
              </h4>
              <p style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: config.color,
                margin: 0,
                fontFamily: 'monospace'
              }}>
                {timeRemaining}
              </p>
              {isPaused && config.autoRemoval && (
                <p style={{ 
                  fontSize: '0.9rem', 
                  margin: '0.5rem 0 0 0', 
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  Will be automatically lifted
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          {accountStatus.reason && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: isBanned ? '#f8d7da' : isPaused ? '#d1ecf1' : '#e2e3e5',
              borderRadius: '12px',
              border: `2px solid ${config.color}`
            }}>
              <h4 style={{ 
                margin: '0 0 0.75rem 0', 
                color: isBanned ? '#721c24' : isPaused ? '#0c5460' : '#495057'
              }}>
                Reason for {isBanned ? 'Ban' : isPaused ? 'Suspension' : 'Deactivation'}:
              </h4>
              <p style={{ 
                margin: 0, 
                fontStyle: 'italic',
                fontSize: '1.1rem',
                color: isBanned ? '#721c24' : isPaused ? '#0c5460' : '#495057'
              }}>
                "{accountStatus.reason}"
              </p>
            </div>
          )}

          {/* Restrictions and Allowed Actions */}
          <div style={{
            marginBottom: '2rem',
            display: 'grid',
            gridTemplateColumns: config.allowedActions.length > 0 ? '1fr 1fr' : '1fr',
            gap: '1rem'
          }}>
            {/* Restrictions */}
            <div style={{
              padding: '1.5rem',
              background: '#ffe6e6',
              borderRadius: '12px',
              border: '2px solid #ff4d4d'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#cc0000' }}>
                ❌ Restrictions:
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {config.restrictions.map((restriction, index) => (
                  <li key={index} style={{ 
                    marginBottom: '0.5rem', 
                    color: '#cc0000',
                    fontWeight: '500'
                  }}>
                    {restriction}
                  </li>
                ))}
              </ul>
            </div>

            {/* Allowed Actions */}
            {config.allowedActions.length > 0 && (
              <div style={{
                padding: '1.5rem',
                background: '#e6f7e6',
                borderRadius: '12px',
                border: '2px solid #4CAF50'
              }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#2e7d32' }}>
                  ✅ Still Available:
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  {config.allowedActions.map((action, index) => (
                    <li key={index} style={{ 
                      marginBottom: '0.5rem', 
                      color: '#2e7d32',
                      fontWeight: '500'
                    }}>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Contact and Appeal Section */}
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: '#d4edda',
            borderRadius: '12px',
            border: '2px solid #28a745'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#155724' }}>
              📞 Need Help?
            </h4>
            <p style={{ margin: '0 0 1rem 0', color: '#155724' }}>
              <strong>Support Email:</strong>{' '}
              <a href="mailto:support@uncreated.com" style={{ 
                color: '#155724', 
                fontWeight: 'bold',
                textDecoration: 'none'
              }}>
                support@uncreated.com
              </a>
            </p>
            {config.appealAllowed && (
              <button
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                onClick={() => setShowAppealForm(!showAppealForm)}
              >
                {showAppealForm ? 'Hide Appeal Form' : 'Submit Appeal'}
              </button>
            )}
          </div>

          {/* Appeal Form */}
          {showAppealForm && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '2px solid #6c757d'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
                Submit Appeal
              </h4>
              <textarea
                placeholder="Explain why you believe this restriction should be reviewed..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '0.75rem',
                  border: '2px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  Send Appeal
                </button>
                <button 
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowAppealForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Technical Details Toggle */}
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <button 
              style={{
                background: 'none',
                border: `2px solid ${config.color}`,
                color: config.color,
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
            </button>
          </div>

          {/* Technical Details */}
          {showDetails && (
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#495057' }}>
                Technical Information:
              </h4>
              <div style={{ fontSize: '0.9rem', color: '#495057' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Status:</strong> {accountStatus.status}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Severity Level:</strong> {config.severity}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Block Level:</strong> {accountStatus.blockLevel || 'N/A'}
                </div>
                {accountStatus.banUntil && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Ban End:</strong> {new Date(accountStatus.banUntil).toLocaleString()}
                  </div>
                )}
                {accountStatus.pauseUntil && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Suspension End:</strong> {new Date(accountStatus.pauseUntil).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 2rem 2rem 2rem',
          borderTop: '1px solid #dee2e6',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {onRefresh && (
            <button 
              style={{
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              onClick={onRefresh}
            >
              🔄 Check Status
            </button>
          )}
          <button 
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={onLogout}
          >
            🚪 Logout
          </button>
          {onClose && (
            <button 
              style={{
                background: config.color,
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              onClick={onClose}
            >
              ❌ Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DifferentiatedBanPauseModal;