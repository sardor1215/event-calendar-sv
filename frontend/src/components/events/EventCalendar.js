import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../../auth';
import { fetchEvents, deleteEvent } from '../../api';

const EventCalendar = ({ refreshTrigger, onEventClick, onDateClick, filters = {} }) => {
  const { token, userRole, userId } = useAuth();
  const [events, setEvents] = useState([]);
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
  const [tooltip, setTooltip] = useState(null);
  const tooltipTimeoutRef = useRef(null);

  const getEventColor = (event) => {
    try {
      const now = new Date();
      const end = new Date(event.end_time);
      const start = new Date(event.start_time);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return '#9ca3af';
      }

      // Past events are always gray regardless of custom color
      if (end < now) return '#9ca3af';

      // Use user-chosen color if set
      if (event.color) return event.color;

      const colors = [
        '#ec4899', '#10b981', '#f59e0b', '#3b82f6',
        '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'
      ];
      const hash = event.id ? event.id : event.title ? event.title.length : 0;
      return colors[hash % colors.length];
    } catch (error) {
      console.warn('Error calculating event color:', error);
      return '#9ca3af';
    }
  };

  const getEventBorderColor = (event) => {
    try {
      const now = new Date();
      const end = new Date(event.end_time);
      const start = new Date(event.start_time);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return '#6b7280';
      }

      if (end < now) return '#6b7280';

      if (event.color) return event.color;

      const colors = [
        '#be185d', '#059669', '#d97706', '#2563eb',
        '#7c3aed', '#dc2626', '#0891b2', '#65a30d'
      ];
      const hash = event.id ? event.id : event.title ? event.title.length : 0;
      return colors[hash % colors.length];
    } catch (error) {
      console.warn('Error calculating event border color:', error);
      return '#6b7280';
    }
  };

  const handleEventMouseEnter = (info) => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    const rect = info.el.getBoundingClientRect();
    const TW = 296, TH = 260;
    const vw = window.innerWidth, vh = window.innerHeight;
    let x = rect.right + 14;
    let y = rect.top;
    if (x + TW > vw - 8) x = rect.left - TW - 14;
    if (x < 8) x = 8;
    if (y + TH > vh - 8) y = vh - TH - 8;
    if (y < 8) y = 8;
    setTooltip({ event: info.event, x, y });
  };

  const handleEventMouseLeave = () => {
    tooltipTimeoutRef.current = setTimeout(() => setTooltip(null), 180);
  };

  const handleTooltipMouseEnter = () => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
  };

  useEffect(() => () => { if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current); }, []);

  const loadEvents = async () => {
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

      const response = await fetchEvents(token, queryParams);
      
      if (response.events) {
        setEvents(response.events);
      } else {
        setEvents(response);
      }
    } catch (err) {
      console.error("Error loading events:", err);
      setError("Failed to load events");
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

  const formatEventsForCalendar = useCallback((events) => {
    let filteredEvents = events;

    // Ensure regular users only see related events (organizer or participant)
    if (userRole !== 'admin') {
      filteredEvents = filteredEvents.filter((m) => {
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
      filteredEvents = events.filter(event => {
        try {
          return (
            (event.title && event.title.toLowerCase().includes(searchTerm)) ||
            (event.description && event.description.toLowerCase().includes(searchTerm)) ||
            (event.location && event.location.toLowerCase().includes(searchTerm)) ||
            (event.organizer_name && event.organizer_surname && 
             `${event.organizer_name} ${event.organizer_surname}`.toLowerCase().includes(searchTerm)) ||
            (event.department_name && event.department_name.toLowerCase().includes(searchTerm))
          );
        } catch (error) {
          console.warn('Error filtering event by search:', error);
          return false;
        }
      });
    }

    // Apply client-side location filter
    if (filters.location && filters.location.trim()) {
      const locationTerm = filters.location.toLowerCase();
      filteredEvents = filteredEvents.filter(event => {
        try {
          return event.location && event.location.toLowerCase().includes(locationTerm);
        } catch (error) {
          console.warn('Error filtering event by location:', error);
          return false;
        }
      });
    }

    // Apply client-side status filter
    if (filters.status && filters.status !== 'all') {
      const now = new Date();
      filteredEvents = filteredEvents.filter(event => {
        try {
          const start = new Date(event.start_time);
          const end = new Date(event.end_time);
          
          // Skip events with invalid dates
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
          console.warn('Error filtering event by status:', error);
          return false;
        }
      });
    }

    // Detect location conflicts: same location + overlapping time
    const conflictIds = new Set();
    for (let i = 0; i < filteredEvents.length; i++) {
      for (let j = i + 1; j < filteredEvents.length; j++) {
        const a = filteredEvents[i], b = filteredEvents[j];
        if (!a.location || !b.location) continue;
        if (a.location.trim().toLowerCase() !== b.location.trim().toLowerCase()) continue;
        const aS = new Date(a.start_time), aE = new Date(a.end_time);
        const bS = new Date(b.start_time), bE = new Date(b.end_time);
        if (!isNaN(aS) && !isNaN(aE) && !isNaN(bS) && !isNaN(bE) && aS < bE && aE > bS) {
          conflictIds.add(Number(a.id));
          conflictIds.add(Number(b.id));
        }
      }
    }

    return filteredEvents.map(event => ({
      id: event.id || Math.random().toString(36).substr(2, 9),
      title: event.title || 'Untitled Event',
      start: event.start_time,
      end: event.end_time,
      allDay: false,
      backgroundColor: getEventColor(event),
      borderColor: getEventColor(event),
      textColor: '#fff',
      extendedProps: {
        description: event.description || '',
        location: event.location || '',
        organizer: `${event.organizer_name || ''} ${event.organizer_surname || ''}`.trim() || 'Unknown',
        event_number: event.event_number || '',
        event_chair: event.event_chair || '',
        department: event.department_name || '',
        participants: event.participants || [],
        files: event.files || [],
        canEdit: userRole === "admin" || (event.organizer_id && event.organizer_id === userId),
        isRecurring: !!event.recurring_group_id,
        hasConflict: conflictIds.has(Number(event.id)),
        color: event.color || '',
      }
    }));
  }, [filters, userRole, userId]);

  useEffect(() => {
    loadEvents();
  // Search is client-side only — don't re-fetch on every keystroke
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, filters.status, filters.location, filters.department_id]);

  // Memoize formatted events for performance
  const formattedEvents = useMemo(() => {
    return formatEventsForCalendar(events);
  }, [events, formatEventsForCalendar]);

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
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-8 w-36 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-50 rounded-lg animate-pulse border border-gray-100" />
            ))}
          </div>
        </div>
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
                onClick={loadEvents}
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
      <div className="bg-gradient-to-r from-amber-50 to-white border-b border-gray-200">
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
                <input type="checkbox" id="events" className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-400" defaultChecked />
                <label htmlFor="events" className="text-sm font-semibold text-gray-800">Events</label>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-xs text-gray-500 font-medium">{events.length} events</span>
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
            firstDay={1}
            height="auto"
            events={formattedEvents}
            eventClick={(info) => { setTooltip(null); handleEventClick(info); }}
            dateClick={handleDateClick}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
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
            eventContent={(arg) => {
              const now = new Date();
              const start = arg.event.start;
              const end = arg.event.end;
              const isOngoing = start && end && start <= now && now <= end;
              const isMonth = arg.view.type === 'dayGridMonth';
              // FullCalendar sets isStart/isEnd per rendered segment
              const segStart = arg.isStart;
              const segEnd = arg.isEnd;
              const isSingleDay = segStart && segEnd;
              const location = arg.event.extendedProps.location;
              const organizer = arg.event.extendedProps.organizer;
              const isRecurring = arg.event.extendedProps.isRecurring;
              const hasConflict = arg.event.extendedProps.hasConflict;

              const fmt = (d) =>
                d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : null;

              if (isMonth) {
                const startTime = fmt(start);
                const endTime = fmt(end);

                // ── Middle continuation segment ────────────────────────────
                if (!segStart && !segEnd) {
                  return (
                    <div style={{ padding: '3px 6px', overflow: 'hidden', width: '100%', display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: '500', color: 'rgba(255,255,255,0.88)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {arg.event.title}
                      </span>
                    </div>
                  );
                }

                // ── End-only segment ──────────────────────────────────────
                if (!segStart && segEnd) {
                  return (
                    <div style={{ padding: '3px 8px 3px 6px', overflow: 'hidden', width: '100%' }}>
                      <div style={{ fontSize: '10px', fontWeight: '600', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.4' }}>
                        {arg.event.title}
                      </div>
                      {endTime && (
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.68)', whiteSpace: 'nowrap', marginTop: '1px' }}>
                          ends {endTime}
                        </div>
                      )}
                    </div>
                  );
                }

                // ── Start segment (single-day or multi-day start) ─────────
                return (
                  <div style={{ padding: '3px 5px', overflow: 'hidden', width: '100%' }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', overflow: 'hidden', minWidth: 0 }}>
                        {isOngoing && (
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.4' }}>
                          {arg.event.title}
                        </span>
                      </div>
                      {/* Right-side badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                        {hasConflict && <span title="Location conflict" style={{ fontSize: '11px', lineHeight: 1 }}>⚠</span>}
                        {isRecurring && <span title="Recurring event" style={{ fontSize: '11px', lineHeight: 1, opacity: 0.85 }}>↺</span>}
                        {!isSingleDay && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>→</span>}
                      </div>
                    </div>
                    {/* Meta row: time + location */}
                    {(startTime || location) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px', overflow: 'hidden' }}>
                        {startTime && (
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            🕐 {startTime}
                          </span>
                        )}
                        {location && (
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📍 {location}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // ── Week / Day (timeGrid) view ─────────────────────────────
              return (
                <div style={{ padding: '3px 6px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {isOngoing && (
                    <div style={{ fontSize: '9px', fontWeight: '800', color: 'rgba(255,255,255,0.95)', letterSpacing: '0.07em' }}>
                      ● LIVE
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.3' }}>
                      {arg.event.title}
                    </div>
                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                      {hasConflict && <span title="Location conflict" style={{ fontSize: '11px', lineHeight: 1 }}>⚠</span>}
                      {isRecurring && <span title="Recurring" style={{ fontSize: '11px', lineHeight: 1, opacity: 0.85 }}>↺</span>}
                    </div>
                  </div>
                  {location && (
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.78)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📍 {location}
                    </div>
                  )}
                  {organizer && organizer !== 'Unknown' && (
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 'auto' }}>
                      👤 {organizer}
                    </div>
                  )}
                </div>
              );
            }}
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
            eventClassNames={(arg) => {
              const now = new Date();
              const start = arg.event.start;
              const end = arg.event.end;
              const classes = ['cursor-pointer', 'hover:opacity-90', 'transition-opacity', 'duration-150'];
              if (start && end && start <= now && now <= end) classes.push('fc-event-ongoing');
              if (arg.event.extendedProps.hasConflict) classes.push('fc-event-conflict');
              if (arg.event.extendedProps.isRecurring) classes.push('fc-event-recurring');
              return classes;
            }}
          />
        </div>
      </div>

      {/* Hover Tooltip */}
      {tooltip && (
        <div
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={() => setTooltip(null)}
          style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, zIndex: 9999, width: '296px', pointerEvents: 'auto' }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in"
        >
          {/* Event-color accent bar */}
          <div style={{ height: '4px', background: tooltip.event.backgroundColor || '#f59e0b' }} />

          <div className="px-4 pt-3 pb-3">
            {/* Title + status badge */}
            {(() => {
              const now = new Date();
              const s = tooltip.event.start;
              const e = tooltip.event.end;
              const isOngoing = s && e && s <= now && now <= e;
              const isPast = e && e < now;
              return (
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="text-sm font-bold text-gray-900 leading-snug">{tooltip.event.title}</h4>
                  {isOngoing ? (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                      Live
                    </span>
                  ) : isPast ? (
                    <span className="flex-shrink-0 text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Past</span>
                  ) : (
                    <span className="flex-shrink-0 text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">Upcoming</span>
                  )}
                </div>
              );
            })()}

            <div className="space-y-2">
              {/* Date */}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{tooltip.event.start && new Date(tooltip.event.start).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>

              {/* Time + duration */}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {tooltip.event.start && tooltip.event.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  {' – '}
                  {tooltip.event.end && tooltip.event.end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
                {tooltip.event.start && tooltip.event.end && (() => {
                  const diff = Math.round((tooltip.event.end - tooltip.event.start) / 60000);
                  const h = Math.floor(diff / 60), m = diff % 60;
                  return <span className="ml-auto bg-gray-100 rounded-full px-1.5 py-0.5 text-gray-500 font-medium flex-shrink-0">{h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`}</span>;
                })()}
              </div>

              {/* Location */}
              {tooltip.event.extendedProps.location && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{tooltip.event.extendedProps.location}</span>
                </div>
              )}

              {/* Organizer */}
              {tooltip.event.extendedProps.organizer && tooltip.event.extendedProps.organizer !== 'Unknown' && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="truncate">{tooltip.event.extendedProps.organizer}</span>
                </div>
              )}

              {/* Department */}
              {tooltip.event.extendedProps.department && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="truncate">{tooltip.event.extendedProps.department}</span>
                </div>
              )}

              {/* Recurring badge */}
              {tooltip.event.extendedProps.isRecurring && (
                <div className="flex items-center gap-2 text-xs text-indigo-600">
                  <span className="text-base leading-none">↺</span>
                  <span className="font-medium">Recurring event</span>
                </div>
              )}

              {/* Conflict warning */}
              {tooltip.event.extendedProps.hasConflict && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1.5">
                  <span className="text-base leading-none">⚠</span>
                  <span className="font-semibold">Location conflict with another event</span>
                </div>
              )}

              {/* Participants */}
              {tooltip.event.extendedProps.participants && tooltip.event.extendedProps.participants.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{tooltip.event.extendedProps.participants.length} participant{tooltip.event.extendedProps.participants.length !== 1 ? 's' : ''}</span>
                  {/* Show up to 3 avatar initials */}
                  <div className="flex -space-x-1 ml-auto">
                    {tooltip.event.extendedProps.participants.slice(0, 3).map((p, i) => {
                      const initials = `${(p.name || '').charAt(0)}${(p.surname || '').charAt(0)}`.toUpperCase() || '?';
                      const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];
                      return (
                        <div key={p.id || i} className={`w-5 h-5 ${colors[(p.id || i) % colors.length]} rounded-full flex items-center justify-center text-white border border-white`} style={{ fontSize: '8px', fontWeight: 700 }}>
                          {initials}
                        </div>
                      );
                    })}
                    {tooltip.event.extendedProps.participants.length > 3 && (
                      <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center border border-white text-gray-500" style={{ fontSize: '8px', fontWeight: 700 }}>
                        +{tooltip.event.extendedProps.participants.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Click to open full details</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gradient-to-r from-gray-50 to-amber-50/30 border-t border-gray-100">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shadow-sm"></div>
                <span className="text-xs font-semibold text-gray-700">Active</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-200 shadow-sm"></div>
                <span className="text-xs font-semibold text-gray-700">Live now</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-400 shadow-sm"></div>
                <span className="text-xs font-semibold text-gray-700">Past</span>
              </div>
            </div>
            <div className="flex items-center gap-x-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
                <span>Click to view</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Click date to create</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
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
