// src/components/events/SearchBar/SearchBar.js
import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit}>
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search events, organizers, locations..."
            value={searchQuery}
            onChange={handleInputChange}
            className="search-input"
          />
          {searchQuery && (
            <button 
              type="button"
              className="clear-button"
              onClick={handleClear}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <button type="submit" className="search-button">Search</button>
      </form>
    </div>
  );
};

export default SearchBar;