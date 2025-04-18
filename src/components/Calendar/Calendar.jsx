import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import addHours from 'date-fns/addHours';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, 
  FiTarget, 
  FiBookmark, 
  FiStar,
  FiX,
  FiSave
} from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import { enUS } from 'date-fns/locale';

// import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import './Calendar.css';

// const locales = {
//   'en-US': require('date-fns/locale/en-US')
// };
const locales = {
    'en-US': enUS,
  };
  

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const focusAreas = [
  { value: 'clarity', label: 'Clarity', icon: <FiBookmark /> },
  { value: 'coherence', label: 'Coherence', icon: <FiTarget /> },
  { value: 'vocabulary', label: 'Vocabulary', icon: <FiStar /> },
  { value: 'grammar', label: 'Grammar', icon: <FiBookmark /> }
];

const Calendar = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newEvent, setNewEvent] = useState({
    title: '',
    difficulty: 'medium',
    duration: 60,
    goalScore: 80,
    focusArea: 'clarity',
    reminder: true,
    notes: '',
    completed: false,
    score: null
  });
  const [loading, setLoading] = useState(true);

  const difficultyColors = {
    easy: '#4ade80',
    medium: '#fbbf24',
    hard: '#f87171'
  };

  useEffect(() => {
    if (currentUser) {
      fetchEvents();
    }
  }, [currentUser]);

  const fetchEvents = async () => {
    try {
      const q = query(
        collection(db, 'essayPractices'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start: doc.data().start.toDate(),
        end: doc.data().end.toDate()
      }));
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = ({ start }) => {
    setSelectedDate(start);
    setNewEvent({
      ...newEvent,
      start,
      end: addHours(start, 1)
    });
    setShowModal(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    try {
      setLoading(true);
      const eventData = {
        ...newEvent,
        userId: currentUser.uid,
        start: selectedDate,
        end: addHours(selectedDate, newEvent.duration / 60),
        backgroundColor: difficultyColors[newEvent.difficulty]
      };
      
      await addDoc(collection(db, 'essayPractices'), eventData);
      await fetchEvents();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving event: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async () => {
    try {
      setLoading(true);
      const eventRef = doc(db, 'essayPractices', selectedEvent.id);
      await updateDoc(eventRef, {
        completed: true,
        score: selectedEvent.score
      });
      await fetchEvents();
      setShowEventModal(false);
    } catch (error) {
      console.error("Error updating event: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'essayPractices', selectedEvent.id));
      await fetchEvents();
      setShowEventModal(false);
    } catch (error) {
      console.error("Error deleting event: ", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      difficulty: 'medium',
      duration: 60,
      goalScore: 80,
      focusArea: 'clarity',
      reminder: true,
      notes: '',
      completed: false,
      score: null
    });
  };

  const eventStyleGetter = (event) => {
    const backgroundColor = event.completed ? '#d1fae5' : difficultyColors[event.difficulty];
    const borderColor = event.completed ? '#10b981' : difficultyColors[event.difficulty];
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        border: `2px solid ${borderColor}`,
        color: '#1f2937',
        padding: '2px 5px',
        fontSize: '0.85em'
      }
    };
  };

  if (loading && !events.length) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>Essay Practice Calendar</h2>
        <button 
          className="add-event-btn"
          onClick={() => {
            setSelectedDate(new Date());
            setShowModal(true);
          }}
        >
          + Add Practice Session
        </button>
      </div>

      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100vh - 200px)' }}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleEventClick}
        selectable
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day', 'agenda']}
        defaultView="week"
      />

      {/* Add Event Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Schedule Essay Practice</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowModal(false)}
                >
                  <FiX />
                </button>
              </div>

              <div className="form-group">
                {/* <label>Essay Topic</label> */}
                <input
                  type="text"
                  placeholder="Enter essay topic"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="modal-input"
                />
              </div>
              <div className="form-group" style={{ position: 'relative', marginTop: '20px' }}>
  <label style={{ position: 'absolute', top: '-10px', left: '0', fontSize: '14px', color: '#333' }}>
    Difficulty
  </label>
  <select
    value={newEvent.difficulty}
    onChange={(e) => setNewEvent({ ...newEvent, difficulty: e.target.value })}
    className="modal-select"
    style={{ paddingTop: '20px' }} // Optional for spacing below label
  >
    <option value="easy">Easy</option>
    <option value="medium">Medium</option>
    <option value="hard">Hard</option>
  </select>
</div>


<div className="form-group">
  <label style={{ position: 'absolute', top: '-10px', left: '0', fontSize: '14px' }}>
    Duration (minutes)
  </label>
  <input
    type="number"
    value={newEvent.duration}
    onChange={(e) =>
      setNewEvent({ ...newEvent, duration: parseInt(e.target.value) || 0 })
    }
    className="modal-input"
    min="15"
    max="180"
    style={{ paddingTop: '20px' }}
  />
</div>

<div className="form-row">
  <div className="form-group" style={{ position: 'relative', marginTop: '20px' }}>
    <label style={{ position: 'absolute', top: '-10px', left: '0', fontSize: '14px' }}>
      Focus Area
    </label>
    <select
      value={newEvent.focusArea}
      onChange={(e) => setNewEvent({ ...newEvent, focusArea: e.target.value })}
      className="modal-select"
      style={{ paddingTop: '20px' }}
    >
      {focusAreas.map((area) => (
        <option key={area.value} value={area.value}>
          {area.label}
        </option>
      ))}
    </select>
  </div>

  <div className="form-group" style={{ position: 'relative', marginTop: '20px' }}>
    <label style={{ position: 'absolute', top: '-10px', left: '0', fontSize: '14px' }}>
      Goal Score
    </label>
    <input
      type="number"
      value={newEvent.goalScore}
      onChange={(e) =>
        setNewEvent({ ...newEvent, goalScore: parseInt(e.target.value) || 0 })
      }
      className="modal-input"
      min="0"
      max="100"
      style={{ paddingTop: '20px' }}
    />
  </div>
</div>

<div className="form-group" style={{ position: 'relative', marginTop: '20px' }}>
  <label style={{ position: 'absolute', top: '-10px', left: '0', fontSize: '14px' }}>
    Date & Time
  </label>
  <input
    type="datetime-local"
    placeholder="Date"
    value={format(selectedDate, "yyyy-MM-dd'T'HH:mm")}
    onChange={(e) => setSelectedDate(new Date(e.target.value))}
    className="modal-input"
    style={{ paddingTop: '20px' }}
  />
</div>

<div className="form-group" style={{ position: 'relative', marginTop: '20px' }}>
  <label style={{ position: 'absolute', top: '-10px', left: '0', fontSize: '14px' }}>
    Notes
  </label>
  <textarea
    placeholder="Any additional notes..."
    value={newEvent.notes}
    onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
    className="modal-textarea"
    rows={3}
    style={{ paddingTop: '20px' }}
  />
</div>

<div className="form-group checkbox-group" style={{ marginTop: '10px' }}>
  <input
    type="checkbox"
    id="reminder"
    checked={newEvent.reminder}
    onChange={(e) => setNewEvent({ ...newEvent, reminder: e.target.checked })}
  />
  <label htmlFor="reminder" style={{ marginLeft: '8px' }}>
    Set reminder 30 minutes before
  </label>
</div>


              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEvent} 
                  className="save-btn"
                  disabled={!newEvent.title || loading}
                >
                  {loading ? 'Saving...' : 'Save Session'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Details Modal */}
      <AnimatePresence>
        {showEventModal && selectedEvent && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEventModal(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>{selectedEvent.title}</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowEventModal(false)}
                >
                  <FiX />
                </button>
              </div>

              <div className="event-details">
                <div className="detail-item">
                  <FiClock className="detail-icon" />
                  <span>
                    {format(selectedEvent.start, 'MMMM do, yyyy h:mm a')} - {' '}
                    {format(selectedEvent.end, 'h:mm a')}
                  </span>
                </div>

                <div className="detail-item">
                  <div className="difficulty-tag" style={{
                    backgroundColor: difficultyColors[selectedEvent.difficulty]
                  }}>
                    {selectedEvent.difficulty.charAt(0).toUpperCase() + selectedEvent.difficulty.slice(1)}
                  </div>
                </div>

                <div className="detail-item">
                  {focusAreas.find(a => a.value === selectedEvent.focusArea)?.icon}
                  <span>
                    Focus: {focusAreas.find(a => a.value === selectedEvent.focusArea)?.label}
                  </span>
                </div>

                {selectedEvent.goalScore && (
                  <div className="detail-item">
                    <FiTarget className="detail-icon" />
                    <span>Goal Score: {selectedEvent.goalScore}%</span>
                  </div>
                )}

                {selectedEvent.notes && (
                  <div className="detail-item notes-item">
                    <p className="detail-label">Notes:</p>
                    <p>{selectedEvent.notes}</p>
                  </div>
                )}

                {!selectedEvent.completed && (
                  <div className="score-input">
                    <label>Your Score (0-100):</label>
                    <input
                      type="number"
                      value={selectedEvent.score || ''}
                      onChange={(e) => setSelectedEvent({
                        ...selectedEvent,
                        score: parseInt(e.target.value) || null
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                )}

                {selectedEvent.completed && selectedEvent.score && (
                  <div className="result-display">
                    <h4>Result: {selectedEvent.score}%</h4>
                    {selectedEvent.score >= selectedEvent.goalScore ? (
                      <p className="success-text">🎉 You achieved your goal!</p>
                    ) : (
                      <p className="improvement-text">Keep practicing! You'll get there!</p>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                {!selectedEvent.completed && (
                  <button 
                    onClick={handleUpdateEvent} 
                    className="complete-btn"
                    disabled={!selectedEvent.score || loading}
                  >
                    {loading ? 'Updating...' : 'Mark as Completed'}
                  </button>
                )}
                <button 
                  className="delete-btn"
                  onClick={handleDeleteEvent}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete Session'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;