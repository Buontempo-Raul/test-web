// src/pages/Events/EventDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
// Fix the import path to correctly point to the EventTicketModal component
import EventTicketModal from '../../components/events/EventTicketModal/EventTicketModal';
import './EventDetail.css';

// Mock data - replace with actual API calls in production
import { mockEvents } from '../../data/mockEvents';

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [similarEvents, setSimilarEvents] = useState([]);

  useEffect(() => {
    // Simulating API call
    const fetchEvent = async () => {
      try {
        // In a real application, you would fetch from your API
        // const response = await fetch(`/api/events/${id}`);
        // const data = await response.json();
        
        // Using mock data for now
        setTimeout(() => {
          const foundEvent = mockEvents.find(e => e.id === parseInt(id));
          
          if (foundEvent) {
            setEvent(foundEvent);
            
            // Find similar events (same category, excluding current event)
            const similar = mockEvents
              .filter(e => e.category === foundEvent.category && e.id !== foundEvent.id)
              .slice(0, 3);
            
            setSimilarEvents(similar);
          }
          
          setIsLoading(false);
        }, 800); // Simulate network delay
      } catch (error) {
        console.error('Error fetching event:', error);
        setIsLoading(false);
      }
    };

    window.scrollTo(0, 0);
    fetchEvent();
  }, [id]);

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="event-detail-loading">
        <div className="spinner"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-not-found">
        <h2>Event Not Found</h2>
        <p>The event you're looking for doesn't exist or has been removed.</p>
        <Link to="/events" className="back-to-events">Back to Events</Link>
      </div>
    );
  }

  return (
    <div className="event-detail-page">
      <div 
        className="event-detail-hero" 
        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${event.image})` }}
      >
        <motion.div 
          className="event-detail-hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="event-category-badge">{event.category}</div>
          <h1>{event.title}</h1>
          <div className="event-meta">
            <div className="event-meta-item">
              <i className="meta-icon date-icon"></i>
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="event-meta-item">
              <i className="meta-icon time-icon"></i>
              <span>{event.time}</span>
            </div>
            <div className="event-meta-item">
              <i className="meta-icon location-icon"></i>
              <span>{event.location}</span>
            </div>
            <div className="event-meta-item">
              <i className="meta-icon organizer-icon"></i>
              <span>By {event.organizer}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="event-detail-container">
        <div className="event-detail-main">
          <motion.div 
            className="event-detail-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h2>About This Event</h2>
            <p className="event-description">{event.description}</p>
            
            {/* Extended description - In a real app, this would come from the API */}
            <p className="event-description">
              Join us for this spectacular event that brings together artists and art enthusiasts 
              from around the world. This is an opportunity to experience creativity in its purest form 
              and connect with like-minded individuals who share your passion for art and culture.
            </p>
            <p className="event-description">
              Whether you're a seasoned art connoisseur or just beginning to explore the world of 
              artistic expression, this event offers something for everyone. Come prepared to be 
              inspired, challenged, and moved by the incredible works on display.
            </p>
          </motion.div>

          <motion.div 
            className="event-detail-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <h2>Event Details</h2>
            <div className="event-details-list">
              <div className="event-detail-item">
                <h3>Date and Time</h3>
                <p>{formatDate(event.date)}</p>
                <p>{event.time}</p>
              </div>
              <div className="event-detail-item">
                <h3>Location</h3>
                <p>{event.location}</p>
                <p>View on map</p>
              </div>
              <div className="event-detail-item">
                <h3>Organizer</h3>
                <p>{event.organizer}</p>
                <p>View profile</p>
              </div>
              <div className="event-detail-item">
                <h3>Refund Policy</h3>
                <p>Refunds available up to 7 days before the event</p>
              </div>
            </div>
          </motion.div>

          {similarEvents.length > 0 && (
            <motion.div 
              className="event-detail-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <h2>Similar Events You Might Like</h2>
              <div className="similar-events">
                {similarEvents.map(similarEvent => (
                  <Link 
                    to={`/events/${similarEvent.id}`} 
                    key={similarEvent.id}
                    className="similar-event-card"
                  >
                    <div className="similar-event-image">
                      <img src={similarEvent.image} alt={similarEvent.title} />
                    </div>
                    <div className="similar-event-info">
                      <h3>{similarEvent.title}</h3>
                      <p>{formatDate(similarEvent.date)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <motion.div 
          className="event-detail-sidebar"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="sidebar-card">
            <div className="ticket-pricing">
              {event.isFree ? (
                <div className="event-price free">Free Entry</div>
              ) : (
                <div className="event-price">${event.price.toFixed(2)}</div>
              )}
            </div>
            
            <div className="ticket-actions">
              {!event.isFree && (
                <button 
                  className="buy-tickets-btn"
                  onClick={() => setIsModalOpen(true)}
                >
                  Buy Tickets
                </button>
              )}
              <button className="save-event-btn">Save Event</button>
            </div>
            
            <div className="event-share">
              <p>Share with friends</p>
              <div className="share-buttons">
                <button className="share-btn facebook">Facebook</button>
                <button className="share-btn twitter">Twitter</button>
                <button className="share-btn email">Email</button>
              </div>
            </div>
          </div>
          
          <div className="sidebar-card organizer-card">
            <h3>Organizer</h3>
            <div className="organizer-info">
              <div className="organizer-avatar"></div>
              <div className="organizer-details">
                <h4>{event.organizer}</h4>
                <p>Event Organizer</p>
                <button className="contact-organizer-btn">Contact</button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {isModalOpen && (
        <EventTicketModal 
          event={event} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default EventDetail;