// src/components/explore/ExploreFilters/ExploreFilters.js
import React, { useState } from 'react';
import './ExploreFilters.css';

// Common art-related categories to filter by
const categories = [
  { id: 'all', label: 'All' },
  { id: 'painting', label: 'Painting' },
  { id: 'sculpture', label: 'Sculpture' },
  { id: 'photography', label: 'Photography' },
  { id: 'digital', label: 'Digital Art' },
  { id: 'mixed', label: 'Mixed Media' },
  { id: 'drawing', label: 'Drawing' },
  { id: 'illustration', label: 'Illustration' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'conceptual', label: 'Conceptual' }
];

const ExploreFilters = ({ 
  activeFilter, 
  onFilterChange, 
  searchQuery, 
  onSearch, 
  followingOnly, 
  onToggleFollowing, 
  isAuthenticated 
}) => {
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  // Display only the first 5 categories by default
  const visibleCategories = showAllCategories 
    ? categories 
    : categories.slice(0, 5);

  const handleFilterClick = (category) => {
    onFilterChange(category);
  };

  const handleSearchChange = (e) => {
    onSearch(e.target.value);
  };

  const toggleCategories = () => {
    setShowAllCategories(!showAllCategories);
  };

  return (
    <div className="explore-filters-container">
      <div className="filters-row">
        <div className="filter-categories">
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              className={`filter-category ${activeFilter === category.id ? 'active' : ''}`}
              onClick={() => handleFilterClick(category.id)}
            >
              {category.label}
            </button>
          ))}
          
          {categories.length > 5 && (
            <button 
              className="more-categories-button"
              onClick={toggleCategories}
            >
              {showAllCategories ? 'Show Less' : 'More'}
            </button>
          )}
        </div>
        
        {isAuthenticated && (
          <button 
            className={`following-toggle ${followingOnly ? 'active' : ''}`}
            onClick={onToggleFollowing}
          >
            <i className={`following-icon ${followingOnly ? 'active' : ''}`}></i>
            <span>Following</span>
          </button>
        )}
      </div>
      
      <div className="search-container">
        <div className="search-bar">
          <i className="search-icon"></i>
          <input
            type="text"
            placeholder="Search by tags, captions, or creators..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => onSearch('')}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExploreFilters;