// src/components/events/EventFilter/EventFilter.js
import React from 'react';
import './EventFilter.css';

const EventFilter = ({ categories, activeFilter, onFilterChange }) => {
  return (
    <div className="event-filter">
      <div className="filter-label">Filter by:</div>
      <div className="filter-options">
        {categories.map((category) => (
          <button
            key={category}
            className={`filter-option ${activeFilter === category ? 'active' : ''}`}
            onClick={() => onFilterChange(category)}
          >
            {category === 'all' ? 'All Categories' : category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventFilter;