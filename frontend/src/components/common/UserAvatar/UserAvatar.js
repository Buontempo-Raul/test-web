// frontend/src/components/common/UserAvatar/UserAvatar.js
import React, { useState } from 'react';
import './UserAvatar.css';

const UserAvatar = ({ 
  user, 
  size = 40, 
  className = '', 
  onClick = null,
  showBorder = true 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Get user info with fallbacks
  const username = user?.username || 'User';
  const profileImage = user?.profileImage;
  
  // Generate initials (first letter of username)
  const getInitials = (name) => {
    return name.charAt(0).toUpperCase();
  };
  
  // Generate a consistent color based on username
  const getAvatarColor = (name) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#F4D03F'
    ];
    
    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const shouldShowInitials = !profileImage || imageError;
  const initials = getInitials(username);
  const backgroundColor = getAvatarColor(username);

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size * 0.4}px`, // Font size scales with avatar size
    backgroundColor: shouldShowInitials ? backgroundColor : 'transparent'
  };

  return (
    <div 
      className={`user-avatar ${className} ${shouldShowInitials ? 'initials' : 'image'} ${showBorder ? 'with-border' : ''} ${onClick ? 'clickable' : ''}`}
      style={style}
      onClick={onClick}
      title={username}
    >
      {shouldShowInitials ? (
        <span className="user-avatar-initials">
          {initials}
        </span>
      ) : (
        <img
          src={profileImage}
          alt={username}
          className="user-avatar-image"
          onError={handleImageError}
        />
      )}
    </div>
  );
};

export default UserAvatar;