// src/components/events/EventCard/EventCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './EventCard.css';
// Fix the import path to correctly point to the EventTicketModal component
import EventTicketModal from '../EventTicketModal/EventTicketModal';

const EventCard = ({ event }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <>
      <motion.div 
        className="event-card"
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
      >
        <div className="event-card-image">
          <img src={event.image} alt={event.title} />
          <div className="event-category">{event.category}</div>
        </div>
        <div className="event-card-content">
          <h3>{event.title}</h3>
          <div className="event-info">
            <div className="event-date-time">
              <span className="event-date">{formatDate(event.date)}</span>
              <span className="event-time">{event.time}</span>
            </div>
            <div className="event-location">{event.location}</div>
            <div className="event-organizer">By {event.organizer}</div>
          </div>
          <p className="event-description">{event.description}</p>
          
          <div className="event-footer">
            <div className="event-price">
              {event.isFree ? (
                <span className="free-event">Free</span>
              ) : (
                <span>${event.price}</span>
              )}
            </div>
            <div className="event-actions">
              <Link to={`/events/${event.id}`} className="view-details-btn">Details</Link>
              {!event.isFree && (
                <button 
                  className="buy-ticket-btn"
                  onClick={() => setIsModalOpen(true)}
                >
                  Buy Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {isModalOpen && (
        <EventTicketModal 
          event={event} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
};

export default EventCard;