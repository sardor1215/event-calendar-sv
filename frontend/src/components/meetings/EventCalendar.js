import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../../auth';
import { fetchMeetings, deleteMeeting } from '../../api';

const EventCalendar = ({ refreshTrigger, onEventClick, onDateClick, filters = {} }) => {
  const { token, userRole, userId } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('dayGridMonth');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [goToDateValue, setGoToDateValue] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const calendarRef = useRef(null);

  const getEventColor = (meeting) => {
    try {
      const now = new Date();
      const start = new Date(meeting.start_time);
      const end = new Date(meeting.end_time);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return '#9ca3af'; // Light gray for invalid dates
      }

      // Use different colors based on meeting type or department
      const colors = [
        '#ec4899', // Pink
        '#10b981', // Green  
        '#f59e0b', // Yellow/Orange
        '#3b82f6', // Blue
        '#8b5cf6', // Purple
        '#ef4444', // Red
        '#06b6d4', // Cyan
        '#84cc16'  // Lime
      ];

      // Use meeting ID or title hash to get consistent colors
      const hash = meeting.id ? meeting.id : meeting.title ? meeting.title.length : 0;
      const colorIndex = hash % colors.length;
      
      if (start <= now && now <= end) {
        return colors[colorIndex]; // Use assigned color for ongoing
      } else if (start > now) {
        return colors[colorIndex]; // Use assigned color for upcoming
      } else {
        return '#9ca3af'; // Light gray for past
      }
    } catch (error) {
      console.warn('Error calculating event color:', error);
      return '#9ca3af'; // Default light gray
    }
  };

  const getEventBorderColor = (meeting) => {
    try {
      const now = new Date();
      const start = new Date(meeting.start_time);
      const end = new Date(meeting.end_time);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return '#6b7280'; // Darker gray for invalid dates
      }

      const colors = [
        '#be185d', // Dark pink
        '#059669', // Dark green
        '#d97706', // Dark yellow/orange
        '#2563eb', // Dark blue
        '#7c3aed', // Dark purple
        '#dc2626', // Dark red
        '#0891b2', // Dark cyan
        '#65a30d'  // Dark lime
      ];

      const hash = meeting.id ? meeting.id : meeting.title ? meeting.title.length : 0;
      const colorIndex = hash % colors.length;
      
      if (start <= now && now <= end) {
        return colors[colorIndex]; // Use assigned dark color for ongoing
      } else if (start > now) {
        return colors[colorIndex]; // Use assigned dark color for upcoming
      } else {
        return '#6b7280'; // Darker gray for past
      }
    } catch (error) {
      console.warn('Error calculating event border color:', error);
      return '#6b7280'; // Default darker gray
    }
  };

  const loadMeetings = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = { limit: 1000, ...filters };
      
      // Remove empty filters
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === "" || queryParams[key] === null || queryParams[key] === "all") {
          delete queryParams[key];
        }
      });

      const response = await fetchMeetings(token, queryParams);
      
      if (response.meetings) {
        setMeetings(response.meetings);
      } else {
        setMeetings(response);
      }
    } catch (err) {
      console.error("Error loading meetings:", err);
      setError("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  // Detect screen size to toggle mobile behavior
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-switch calendar view for mobile/desktop
  useEffect(() => {
    const desired = isMobile ? 'timeGridWeek' : 'dayGridMonth';
    setViewMode(desired);
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.changeView(desired);
    }
  }, [isMobile]);

  const formatMeetingsForCalendar = useCallback((meetings) => {
    let filteredMeetings = meetings;

    // Ensure regular users only see related meetings (organizer or participant)
    if (userRole !== 'admin') {
      filteredMeetings = filteredMeetings.filter((m) => {
        try {
          const isOrganizer = m.organizer_id && Number(m.organizer_id) === Number(userId);
          const isParticipant = Array.isArray(m.participants) && m.participants.some((p) => Number(p.id) === Number(userId));
          return isOrganizer || isParticipant;
        } catch {
          return false;
        }
      });
    }

    // Apply client-side search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filteredMeetings = meetings.filter(meeting => {
        try {
          return (
            (meeting.title && meeting.title.toLowerCase().includes(searchTerm)) ||
            (meeting.description && meeting.description.toLowerCase().includes(searchTerm)) ||
            (meeting.location && meeting.location.toLowerCase().includes(searchTerm)) ||
            (meeting.organizer_name && meeting.organizer_surname && 
             `${meeting.organizer_name} ${meeting.organizer_surname}`.toLowerCase().includes(searchTerm)) ||
            (meeting.department_name && meeting.department_name.toLowerCase().includes(searchTerm))
          );
        } catch (error) {
          console.warn('Error filtering meeting by search:', error);
          return false;
        }
      });
    }

    // Apply client-side location filter
    if (filters.location && filters.location.trim()) {
      const locationTerm = filters.location.toLowerCase();
      filteredMeetings = filteredMeetings.filter(meeting => {
        try {
          return meeting.location && meeting.location.toLowerCase().includes(locationTerm);
        } catch (error) {
          console.warn('Error filtering meeting by location:', error);
          return false;
        }
      });
    }

    // Apply client-side status filter
    if (filters.status && filters.status !== 'all') {
      const now = new Date();
      filteredMeetings = filteredMeetings.filter(meeting => {
        try {
          const start = new Date(meeting.start_time);
          const end = new Date(meeting.end_time);
          
          // Skip meetings with invalid dates
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return false;
          }
          
          switch (filters.status) {
            case 'upcoming':
              return start > now;
            case 'ongoing':
              return start <= now && now <= end;
            case 'past':
              return end < now;
            default:
              return true;
          }
        } catch (error) {
          console.warn('Error filtering meeting by status:', error);
          return false;
        }
      });
    }

    return filteredMeetings.map(meeting => ({
      id: meeting.id || Math.random().toString(36).substr(2, 9),
      title: meeting.title || 'Untitled Meeting',
      start: meeting.start_time,
      end: meeting.end_time,
      allDay: false,
      backgroundColor: getEventColor(meeting),
      borderColor: getEventColor(meeting),
      textColor: '#fff',
      extendedProps: {
        description: meeting.description || '',
        location: meeting.location || '',
        organizer: `${meeting.organizer_name || ''} ${meeting.organizer_surname || ''}`.trim() || 'Unknown',
        meeting_number: meeting.meeting_number || '',
        meeting_chair: meeting.meeting_chair || '',
        department: meeting.department_name || '',
        participants: meeting.participants || [],
        files: meeting.files || [],
        canEdit: userRole === "admin" || (meeting.organizer_id && meeting.organizer_id === userId)
      }
    }));
  }, [filters, userRole, userId]);

  useEffect(() => {
    loadMeetings();
  }, [refreshTrigger, filters]);

  // Memoize formatted events for performance
  const formattedEvents = useMemo(() => {
    return formatMeetingsForCalendar(meetings);
  }, [meetings, formatMeetingsForCalendar]);

  const handleEventClick = (clickInfo) => {
    if (onEventClick) {
      onEventClick(clickInfo.event);
    }
  };

  const handleDateClick = (dateClickInfo) => {
    if (onDateClick) {
      onDateClick(dateClickInfo);
    }
  };

  const handleEventDrop = async (dropInfo) => {
    // This would require implementing a move/update API endpoint
  };

  const handleEventResize = async (resizeInfo) => {
    // This would require implementing a resize/update API endpoint
  };

  const changeView = (viewName) => {
    setViewMode(viewName);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(viewName);
    }
  };

  const navigateToToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
      setCurrentDate(new Date());
    }
  };

  const navigateToDate = (date) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(date);
      setCurrentDate(date);
    }
  };

  // Keep the date input in sync with current calendar date
  useEffect(() => {
    const d = currentDate instanceof Date ? currentDate : new Date(currentDate);
    if (!isNaN(d)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setGoToDateValue(`${y}-${m}-${day}`);
    }
  }, [currentDate]);

  const previousPeriod = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
      setCurrentDate(calendarApi.getDate());
    }
  };

  const nextPeriod = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
      setCurrentDate(calendarApi.getDate());
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadMeetings}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-50 border-b border-gray-200">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="meetings" className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-400" defaultChecked />
                <label htmlFor="meetings" className="text-sm font-semibold text-gray-800">Meetings</label>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-xs text-gray-500 font-medium">{meetings.length} events</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Go to date (desktop) */}
            <div className="hidden sm:flex items-center gap-2">
              <input
                type="date"
                value={goToDateValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setGoToDateValue(value);
                  if (value) {
                    navigateToDate(new Date(`${value}T00:00:00`));
                  }
                }}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                onClick={() => goToDateValue && navigateToDate(new Date(`${goToDateValue}T00:00:00`))}
                className="px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-white/70 rounded-md"
              >
                Go
              </button>
            </div>
          </div>
        </div>

        {/* View Mode and Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-2 py-4 space-y-4 sm:space-y-0">
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <button
              onClick={previousPeriod}
              className="p-2.5 text-gray-600 hover:text-gray-800 hover:bg-white/70 rounded-lg transition-all duration-200 hover:shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={navigateToToday}
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white/70 hover:shadow-sm rounded-lg transition-all duration-200"
            >
              Today
            </button>
            <button
              onClick={nextPeriod}
              className="p-2.5 text-gray-600 hover:text-gray-800 hover:bg-white/70 rounded-lg transition-all duration-200 hover:shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {/* Current month/year label */}
            <div className="ml-2 px-3 py-1.5 bg-white/60 rounded-md border border-gray-200 text-sm font-semibold text-gray-800">
              {new Date(currentDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
            {/* Go to date (mobile) */}
            <div className="sm:hidden flex items-center gap-2">
              <input
                type="date"
                value={goToDateValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setGoToDateValue(value);
                  if (value) {
                    navigateToDate(new Date(`${value}T00:00:00`));
                  }
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-end">
            <div className="flex bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
              <button
                onClick={() => changeView('dayGridMonth')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-l-xl transition-all duration-200 whitespace-nowrap ${
                  viewMode === 'dayGridMonth'
                    ? 'bg-yellow-400 text-gray-900 shadow-md'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => changeView('timeGridWeek')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-l border-gray-200 transition-all duration-200 whitespace-nowrap ${
                  viewMode === 'timeGridWeek'
                    ? 'bg-yellow-400 text-gray-900 shadow-md'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => changeView('timeGridDay')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-l border-gray-200 transition-all duration-200 whitespace-nowrap ${
                  viewMode === 'timeGridDay'
                    ? 'bg-yellow-400 text-gray-900 shadow-md'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => changeView('listWeek')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-l border-gray-200 rounded-r-xl transition-all duration-200 whitespace-nowrap ${
                  viewMode === 'listWeek'
                    ? 'bg-yellow-400 text-gray-900 shadow-md'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                Agenda
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="p-4  sm:p-2">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={viewMode}
            headerToolbar={false}
            height="auto"
            events={formattedEvents}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            // Enable editing globally; restrict per-event via eventAllow using extendedProps.canEdit
            editable={true}
            eventAllow={(dropInfo, draggedEvent) => {
              return !!(draggedEvent && draggedEvent.extendedProps && draggedEvent.extendedProps.canEdit);
            }}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={isMobile ? 2 : 4}
            weekends={true}
            nowIndicator={true}
            eventDisplay="block"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            allDaySlot={false}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            slotDuration="00:30:00"
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: '09:00',
              endTime: '17:00',
            }}
            dayHeaderFormat={{
              weekday: 'short'
            }}
            dayCellClassNames="hover:bg-yellow-50/40 transition-colors duration-200"
            eventClassNames="cursor-pointer shadow-sm hover:opacity-85 transition-opacity duration-150"
          />
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center justify-center lg:justify-start space-x-4 sm:space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
                <span className="text-sm font-semibold text-gray-800">Upcoming</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                <span className="text-sm font-semibold text-gray-800">Ongoing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-500 rounded-full shadow-sm"></div>
                <span className="text-sm font-semibold text-gray-800">Past</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-600">Click events for details</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-end space-x-2 sm:space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Click dates to create</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Drag to reschedule</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
