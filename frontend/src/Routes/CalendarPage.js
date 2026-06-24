import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import EventCalendar from '../components/events/EventCalendar';
import EditEventModal from '../components/events/EditEventModal';
import EventForm from '../components/events/EventForm';
import Navbar from '../components/Navbar';
import { fetchEvents, deleteEvent } from '../api';

const CalendarPage = () => {
  const { token, userRole, userId } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({
    department_id: '',
    status: 'all',
    search: '',
    location: ''
  });
  const [sidebarEvents, setSidebarEvents] = useState([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  // Format a Date to the "YYYY-MM-DDTHH:MM" string that datetime-local inputs expect (local time, not UTC)
  const toLocalDT = (date) => {
    const d = new Date(date);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // When clicking a day in month-view, FullCalendar gives midnight — default to 09:00 instead
  const withDefaultHour = (date) => {
    const d = new Date(date);
    if (d.getHours() === 0 && d.getMinutes() === 0) d.setHours(9, 0, 0, 0);
    return d;
  };

  const SIDEBAR_COLORS = ['#ec4899','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#84cc16'];
  const sidebarColor = (id) => SIDEBAR_COLORS[(id || 0) % SIDEBAR_COLORS.length];

  const handleSidebarEventClick = (raw) => {
    setSelectedEvent({
      id: raw.id,
      title: raw.title,
      start: new Date(raw.start_time),
      end: new Date(raw.end_time),
      backgroundColor: sidebarColor(raw.id),
      extendedProps: {
        description: raw.description || '',
        location: raw.location || '',
        organizer: `${raw.organizer_name || ''} ${raw.organizer_surname || ''}`.trim() || 'Unknown',
        event_number: raw.event_number || '',
        event_chair: raw.event_chair || '',
        department: raw.department_name || '',
        participants: raw.participants || [],
        files: raw.files || [],
        canEdit: userRole === 'admin' || String(raw.organizer_id) === String(userId),
      },
    });
    setShowEventModal(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDateClick = (dateClickInfo) => {
    setSelectedDate(dateClickInfo.date);
    setShowCreateModal(true);
  };

  const handleCreateEvent = () => {
    setSelectedDate(new Date());
    setShowCreateModal(true);
  };

  const handleCloseModals = () => {
    setShowEventModal(false);
    setShowCreateModal(false);
    setSelectedEvent(null);
    setSelectedDate(null);
    setEditingEventId(null);
  };

  const handleEventSaved = () => {
    setRefreshTrigger(prev => prev + 1);
    handleCloseModals();
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await deleteEvent(token, eventId);
      setRefreshTrigger(prev => prev + 1);
      handleCloseModals();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const clearFilters = () => {
    setFilters({
      department_id: '',
      status: 'all',
      search: '',
      location: ''
    });
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const loadSidebar = async () => {
      try {
        setSidebarLoading(true);
        const response = await fetchEvents(token, { limit: 50 });
        const all = response.events || response;
        const now = new Date();
        const filtered = userRole === 'admin'
          ? all
          : all.filter(e => {
              const isOrg = String(e.organizer_id) === String(userId);
              const isPart = Array.isArray(e.participants) && e.participants.some(p => String(p.id) === String(userId));
              return isOrg || isPart;
            });
        const relevant = filtered
          .filter(e => { try { return new Date(e.end_time) >= now; } catch { return false; } })
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
          .slice(0, 12);
        setSidebarEvents(relevant);
      } catch (e) {
        console.error('Sidebar load failed', e);
      } finally {
        setSidebarLoading(false);
      }
    };
    loadSidebar();
  }, [token, refreshTrigger, userRole, userId]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/"}api/locations`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setLocations(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Failed to load locations', e);
      }
    };
    loadLocations();
  }, [token]);

  const { ongoingEvents, groupedUpcoming } = useMemo(() => {
    const now = new Date();
    const ongoing = [], upcoming = [];
    sidebarEvents.forEach(e => {
      const s = new Date(e.start_time), en = new Date(e.end_time);
      if (s <= now && now <= en) ongoing.push(e);
      else if (s > now) upcoming.push(e);
    });
    const groups = {};
    upcoming.forEach(e => {
      const d = new Date(e.start_time);
      const tod = new Date(), tom = new Date(); tom.setDate(tom.getDate() + 1);
      const label = d.toDateString() === tod.toDateString() ? 'Today'
        : d.toDateString() === tom.toDateString() ? 'Tomorrow'
        : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      if (!groups[label]) groups[label] = [];
      groups[label].push(e);
    });
    return { ongoingEvents: ongoing, groupedUpcoming: Object.entries(groups).map(([label, events]) => ({ label, events })) };
  }, [sidebarEvents]);

  const fmtTime = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const fmtDur = (s, e) => {
    const diff = Math.round((new Date(e) - new Date(s)) / 60000);
    const h = Math.floor(diff / 60), m = diff % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 py-2">
        {/* Header */}
        {/* <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Calendar</h1>
              <p className="mt-2 text-gray-600">
                View and manage your events and events
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
           
              {["admin", "manager", "supervisor", "gm"].includes(userRole) && (
                <Link
                  to="/admin/users"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Users
                </Link>
              )}

              
            </div>
          </div>
        </div> */}

        {/* Simple Filters */}
        <div className="mb-2 bg-white rounded-xl border border-gray-200 shadow-sm px-3 py-2.5 flex flex-wrap gap-2 sm:gap-3 items-center">
          <div className="relative flex-1 min-w-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by title, location, organizer…"
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <select
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
          >
            <option value="">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.name}>{loc.name}</option>
            ))}
          </select>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="past">Past</option>
          </select>
          <button
            onClick={handleCreateEvent}
            className="inline-flex items-center px-3 sm:px-4 py-2 text-sm font-medium text-white bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-md whitespace-nowrap"
          >
            <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden sm:inline">Create Event</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Calendar + Sidebar */}
        <div className="flex gap-4 items-start">
          {/* Calendar */}
          <div className="flex-1 min-w-0">
            <EventCalendar
              refreshTrigger={refreshTrigger}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              filters={filters}
            />
          </div>

          {/* Upcoming Events Sidebar */}
          <div className="hidden xl:flex flex-col w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                  <h3 className="text-sm font-bold text-gray-800">Upcoming</h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 font-medium">
                  {ongoingEvents.length + groupedUpcoming.reduce((s, g) => s + g.events.length, 0)}
                </span>
              </div>

              <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                {sidebarLoading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex gap-3">
                        <div className="w-1 h-14 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                          <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
                          <div className="h-2.5 bg-gray-100 rounded animate-pulse w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : ongoingEvents.length === 0 && groupedUpcoming.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-500">No upcoming events</p>
                    <button onClick={handleCreateEvent} className="mt-3 text-xs text-amber-600 hover:text-amber-700 font-semibold">
                      + Create one
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Ongoing now */}
                    {ongoingEvents.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-green-50 border-b border-green-100 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block flex-shrink-0" />
                          <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Happening Now</span>
                        </div>
                        {ongoingEvents.map(event => (
                          <button key={event.id} onClick={() => handleSidebarEventClick(event)}
                            className="w-full text-left px-4 py-3 hover:bg-green-50/50 transition-colors border-b border-gray-50 group">
                            <div className="flex gap-3 items-start">
                              <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: sidebarColor(event.id), minHeight: '40px' }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">{event.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{fmtTime(event.start_time)} – {fmtTime(event.end_time)}</p>
                                {event.location && <p className="text-xs text-gray-400 truncate mt-0.5">📍 {event.location}</p>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Grouped upcoming */}
                    {groupedUpcoming.map(({ label, events }) => (
                      <div key={label}>
                        <div className="px-4 py-1.5 bg-gray-50 border-y border-gray-100 sticky top-0">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
                        </div>
                        {events.map(event => (
                          <button key={event.id} onClick={() => handleSidebarEventClick(event)}
                            className="w-full text-left px-4 py-3 hover:bg-amber-50/40 transition-colors border-b border-gray-50 group">
                            <div className="flex gap-3 items-start">
                              <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: sidebarColor(event.id), minHeight: '36px' }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-amber-700 transition-colors">{event.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {fmtTime(event.start_time)} – {fmtTime(event.end_time)}
                                  <span className="ml-1.5 text-gray-400">{fmtDur(event.start_time, event.end_time)}</span>
                                </p>
                                {event.location && <p className="text-xs text-gray-400 truncate mt-0.5">📍 {event.location}</p>}
                                {event.department_name && <p className="text-xs text-gray-400 truncate mt-0.5">🏢 {event.department_name}</p>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Footer — create shortcut */}
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60">
                <button onClick={handleCreateEvent}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New event
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Event Details Modal */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-md shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" style={{ borderTop: `4px solid ${selectedEvent.backgroundColor || '#f59e0b'}` }}>
              <div className="bg-white border-b border-gray-100 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Event Details</h3>
                      <p className="text-gray-500 text-sm">Full event information</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModals}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">

                <div className="space-y-6">
                  {/* Event Title */}
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedEvent.title}
                    </h4>
                    <div className="flex items-center justify-center flex-wrap gap-2 text-sm text-gray-600">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(selectedEvent.start).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        {' '}•{' '}
                        {new Date(selectedEvent.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        {' '}-{' '}
                        {new Date(selectedEvent.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                      {(() => {
                        const diffMin = Math.round((new Date(selectedEvent.end) - new Date(selectedEvent.start)) / 60000);
                        const h = Math.floor(diffMin / 60);
                        const m = diffMin % 60;
                        const label = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
                        return (
                          <span className="text-xs font-semibold bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5">{label}</span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Description */}
                  {selectedEvent.extendedProps.description && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Description
                      </h5>
                      <p className="text-gray-700 leading-relaxed">{selectedEvent.extendedProps.description}</p>
                    </div>
                  )}

                  {/* Event Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Event Number */}
                    {selectedEvent.extendedProps.event_number && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                            </svg>
                          </div>
                          <div>
                            <h6 className="font-semibold text-gray-800">Event Number</h6>
                            <p className="text-sm text-gray-600">{selectedEvent.extendedProps.event_number}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Event Chair */}
                    {selectedEvent.extendedProps.event_chair && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <h6 className="font-semibold text-gray-800">Event Chair</h6>
                            <p className="text-sm text-gray-600">{selectedEvent.extendedProps.event_chair}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h6 className="font-semibold text-gray-800">Start Time</h6>
                          <p className="text-sm text-gray-600">{new Date(selectedEvent.start).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h6 className="font-semibold text-gray-800">End Time</h6>
                          <p className="text-sm text-gray-600">{new Date(selectedEvent.end).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                        </div>
                      </div>
                    </div>

                    {selectedEvent.extendedProps.location && (
                      <div className="bg-purple-50 rounded-xl p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <h6 className="font-semibold text-gray-800">Location</h6>
                            <p className="text-sm text-gray-600">{selectedEvent.extendedProps.location}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h6 className="font-semibold text-gray-800">Created by</h6>
                          <p className="text-sm text-gray-600">{selectedEvent.extendedProps.organizer || 'Unknown'}</p>
                        </div>
                      </div>
                    </div>

                    {selectedEvent.extendedProps.department && (
                      <div className="bg-teal-50 rounded-xl p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                            </svg>
                          </div>
                          <div>
                            <h6 className="font-semibold text-gray-800">Department</h6>
                            <p className="text-sm text-gray-600">{selectedEvent.extendedProps.department}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedEvent.extendedProps.participants && selectedEvent.extendedProps.participants.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Participants ({selectedEvent.extendedProps.participants.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.extendedProps.participants.map((participant) => {
                          const initials = `${(participant.name || '').charAt(0)}${(participant.surname || '').charAt(0)}`.toUpperCase() || '?';
                          const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500'];
                          const colorClass = avatarColors[(participant.id || 0) % avatarColors.length];
                          return (
                            <div key={participant.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full pl-1 pr-3 py-1">
                              <div className={`w-6 h-6 ${colorClass} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                {initials}
                              </div>
                              <span className="text-xs text-gray-700 font-medium">{participant.name} {participant.surname}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedEvent.extendedProps.files && selectedEvent.extendedProps.files.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                      <div className="space-y-1">
                        {selectedEvent.extendedProps.files.map((file) => (
                          <a
                            key={file.id}
                            href={`${process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/"}${file.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {file.file_name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  {selectedEvent.extendedProps.canEdit && (
                    <>
                      <button
                        onClick={() => setEditingEventId(selectedEvent.id)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleCloseModals}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-4 sm:pt-10 px-2">
            <div className="relative w-full max-w-2xl shadow-lg rounded-md bg-white p-3 sm:p-5 border">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedEvent ? 'Edit Event' : 'Create New Event'}
                  </h3>
                  <button
                    onClick={handleCloseModals}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <EventForm
                  onClose={handleCloseModals}
                  onCreated={handleEventSaved}
                  initialData={selectedEvent ? {
                    id: selectedEvent.id,
                    title: selectedEvent.title,
                    description: selectedEvent.extendedProps.description,
                    location: selectedEvent.extendedProps.location,
                    start_time: toLocalDT(selectedEvent.start),
                    end_time: toLocalDT(selectedEvent.end),
                    participants: selectedEvent.extendedProps.participants
                  } : (() => {
                    const start = withDefaultHour(selectedDate || new Date());
                    const end = new Date(start.getTime() + 60 * 60 * 1000);
                    return { start_time: toLocalDT(start), end_time: toLocalDT(end) };
                  })()}
                />
              </div>
            </div>
          </div>
        )}

        {editingEventId && (
          <EditEventModal
            eventId={editingEventId}
            onClose={() => setEditingEventId(null)}
            onUpdated={() => {
              setEditingEventId(null);
              setRefreshTrigger(prev => prev + 1);
              setShowEventModal(false);
            }}
          />
        )}

      </div>
    </div>
  );
};

export default CalendarPage;