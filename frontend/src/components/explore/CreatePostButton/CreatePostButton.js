// src/components/explore/CreatePostButton/CreatePostButton.js
import React from 'react';
import './CreatePostButton.css';

const CreatePostButton = ({ onClick }) => {
  return (
    <button className="create-post-button" onClick={onClick}>
      <i className="create-icon"></i>
      <span>Create Post</span>
    </button>
  );
};

export default CreatePostButton;