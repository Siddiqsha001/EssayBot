import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getCalendarEvents, createCalendarEvent } from '../firebase';
import AddEventModal from '../components/Calendar/AddEventModal';
import AIScheduleModal from '../components/Calendar/AIScheduleModal';
import '../styles/Calendar.css';

const locales = { 'en-US': require('date-fns/locale/en-US') };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CalendarPage = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [currentUser]);

  const loadEvents = async () => {
    if (currentUser?.uid) {
      const userEvents = await getCalendarEvents(currentUser.uid);
      setEvents(userEvents);
    }
  };

  const handleSelectSlot = ({ start }) => {
    setSelectedDate(start);
    setShowAddModal(true);
  };

  const handleEventAdd = async (eventData) => {
    if (currentUser?.uid) {
      await createCalendarEvent(currentUser.uid, eventData);
      await loadEvents();
    }
  };

  return (
    <div className={`calendar-page ${darkMode ? 'dark' : ''}`}>
      <div className="calendar-header">
        <h1>Essay Practice Calendar</h1>
        <div className="calendar-actions">
          <button onClick={() => setShowAIModal(true)}>
            🤖 AI Schedule Generator
          </button>
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={event => ({
          className: `event-${event.difficulty} event-${event.status}`
        })}
      />

      <AnimatePresence>
        {showAddModal && (
          <AddEventModal
            date={selectedDate}
            onClose={() => setShowAddModal(false)}
            onSave={handleEventAdd}
          />
        )}
        {showAIModal && (
          <AIScheduleModal
            onClose={() => setShowAIModal(false)}
            onGenerate={handleEventAdd}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarPage;
