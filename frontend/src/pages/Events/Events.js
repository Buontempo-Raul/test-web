// src/pages/Events/Events.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import EventCard from '../../components/events/EventCard/EventCard';
import EventFilter from '../../components/events/EventFilter/EventFilter';
import SearchBar from '../../components/events/SearchBar/SearchBar';
import './Events.css';
import { useAuth } from '../../hooks/useAuth';

// Mock data - replace with actual API calls in production
import { mockEvents } from '../../data/mockEvents';

const Events = () => {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulating API call
    const fetchEvents = async () => {
      try {
        // In a real application, you would fetch from your API
        // const response = await fetch('/api/events');
        // const data = await response.json();
        
        // Using mock data for now
        setTimeout(() => {
          setEvents(mockEvents);
          setFilteredEvents(mockEvents);
          
          // Extract unique categories from events
          const uniqueCategories = [...new Set(mockEvents.map(event => event.category))];
          setCategories(uniqueCategories);
          
          setIsLoading(false);
        }, 800); // Simulate network delay
      } catch (error) {
        console.error('Error fetching events:', error);
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    // Filter events based on category and search query
    let results = events;
    
    // Apply category filter
    if (activeFilter !== 'all') {
      results = results.filter(event => event.category === activeFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.organizer.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    }
    
    setFilteredEvents(results);
  }, [activeFilter, searchQuery, events]);

  const handleFilterChange = (category) => {
    setActiveFilter(category);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className="events-page">
      <div className="events-hero">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="events-hero-content"
        >
          <h1>Discover Art Events</h1>
          <p>Explore and attend the most exciting art events in your area</p>
          
          {isAuthenticated && (
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/request-event" className="request-event-button">
                Request to Host an Event
              </Link>
              <Link to="/my-event-requests" className="request-event-button" style={{ marginLeft: '1rem', backgroundColor: '#6c757d' }}>
                My Event Requests
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      <div className="events-container">
        <div className="events-search-container">
          <SearchBar onSearch={handleSearch} />
          <EventFilter 
            categories={['all', ...categories]} 
            activeFilter={activeFilter} 
            onFilterChange={handleFilterChange} 
          />
        </div>

        {isLoading ? (
          <div className="events-loading">
            <div className="spinner"></div>
            <p>Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="events-grid">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="no-events">
            <p>No events found matching your criteria.</p>
            <button onClick={() => {
              setActiveFilter('all');
              setSearchQuery('');
            }}>Reset Filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;