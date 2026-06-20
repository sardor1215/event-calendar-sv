import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth";
import { fetchEvents, deleteEvent, serverIP } from "../../api";
import EventCalendar from "./EventCalendar";
import EditEventModal from "./EditEventModal";
import EventDetailPanel from "./EventDetailPanel";

const EventsList = ({ refreshTrigger }) => {
  const { token, userRole, userId } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({
    department_id: "",
    from: "",
    to: "",
    location: "",
    search: ""
  });
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'calendar'
  const [editingEventId, setEditingEventId] = useState(null);
  const [detailEventId, setDetailEventId] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    loadEvents();
    loadLocations();
  }, [currentPage, refreshTrigger]);

  // Tick every minute so countdowns update live
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

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

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        page: currentPage,
        limit: 10,
        ...filters
      };

      // Remove empty filters
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === "" || queryParams[key] === null) {
          delete queryParams[key];
        }
      });

      const response = await fetchEvents(token, queryParams);
      
      if (response.events) {
        setEvents(response.events);
        setPagination(response.pagination);
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

  const handleDelete = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      await deleteEvent(token, eventId);
      loadEvents();
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event");
    }
  };

  const handleCancel = async (eventId, title) => {
    if (!window.confirm(`Cancel the event "${title}"? Participants will be notified.`)) return;
    try {
      const res = await fetch(`${serverIP}api/events/${eventId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadEvents();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel event');
      }
    } catch (err) {
      console.error("Error cancelling event:", err);
      alert("Failed to cancel event");
    }
  };

  const handleRsvp = async (eventId, status) => {
    try {
      const res = await fetch(`${serverIP}api/events/${eventId}/rsvp`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        loadEvents();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update RSVP');
      }
    } catch (err) {
      console.error("Error updating RSVP:", err);
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
    setCurrentPage(1);
    loadEvents();
  };

  const clearFilters = () => {
    setFilters({
      department_id: "",
      from: "",
      to: "",
      location: "",
      search: ""
    });
    setCurrentPage(1);
  };

  const formatDateTime = (dateTime) => {
    try {
      return new Date(dateTime).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (_) {
      return String(dateTime);
    }
  };

  const formatDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const isEventUpcoming = (startTime) => {
    return new Date(startTime) > new Date();
  };

  const isEventPast = (endTime) => {
    return new Date(endTime) < new Date();
  };

  const isEventOngoing = (startTime, endTime) => {
    const now = new Date();
    return new Date(startTime) <= now && now <= new Date(endTime);
  };

  const getCountdown = (startTime) => {
    const diff = new Date(startTime) - now;
    if (diff <= 0) return null;
    const totalMins = Math.floor(diff / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (totalMins < 60) return { label: `${totalMins}m`, urgent: true };
    if (h < 24) return { label: `${h}h ${m > 0 ? m + "m" : ""}`, urgent: false };
    const days = Math.floor(h / 24);
    const remH = h % 24;
    if (days < 2) return { label: `${days}d ${remH > 0 ? remH + "h" : ""}`, urgent: false };
    return null; // show date instead for far-future events
  };

  const getEventStatus = (event) => {
    if (event.status === 'cancelled') {
      return { text: "Cancelled", color: "bg-red-100 text-red-800" };
    }
    if (isEventOngoing(event.start_time, event.end_time)) {
      return { text: "Ongoing", color: "bg-green-100 text-green-800" };
    } else if (isEventUpcoming(event.start_time)) {
      return { text: "Upcoming", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { text: "Past", color: "bg-gray-100 text-gray-800" };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
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
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Events</h2>
        <div className="inline-flex bg-white border border-gray-200 rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 text-sm ${viewMode === 'list' ? 'bg-yellow-400 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 text-sm border-l border-gray-200 ${viewMode === 'calendar' ? 'bg-yellow-400 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-3 sm:mb-4">Filters</h3>
        <div className="mb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by title or description..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="datetime-local"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="datetime-local"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-md hover:bg-yellow-300 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white p-2 rounded-lg shadow">
          <EventCalendar
            refreshTrigger={currentPage /* use page as trigger to allow manual refresh via filters */}
            onEventClick={() => {}}
            onDateClick={() => {}}
            filters={{
              location: filters.location,
            }}
          />
        </div>
      ) : (
      /* Events List */
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
          </div>
        ) : (
          events.map((event) => {
            const status = getEventStatus(event);
            const canEdit = userRole === "admin" || event.organizer_id === userId;
            
            return (
              <div key={event.id} className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-3 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-1">
                        <button
                          onClick={() => setDetailEventId(event.id)}
                          className="text-lg font-semibold text-gray-900 hover:text-yellow-700 transition-colors text-left"
                        >
                          {event.title}
                        </button>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.text === "Ongoing" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1" />}
                          {status.text}
                        </span>
                        {(() => {
                          const cd = getCountdown(event.start_time);
                          if (!cd || isEventOngoing(event.start_time, event.end_time) || isEventPast(event.end_time)) return null;
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cd.urgent ? "bg-orange-100 text-orange-700" : "bg-blue-50 text-blue-700"}`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Starts in {cd.label}
                            </span>
                          );
                        })()}
                      </div>
                      
                      {event.description && (
                        <p className="text-gray-600 mb-3">{event.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">Start:</span>
                            <span className="ml-1">{formatDateTime(event.start_time)}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">End:</span>
                            <span className="ml-1">{formatDateTime(event.end_time)}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Duration:</span>
                            <span className="ml-1">{formatDuration(event.start_time, event.end_time)}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {event.location && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="font-medium">Location:</span>
                              <span className="ml-1">{event.location}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">Organizer:</span>
                            <span className="ml-1">{event.organizer_name} {event.organizer_surname}</span>
                          </div>
                          
                          {event.department_name && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="font-medium">Department:</span>
                              <span className="ml-1">{event.department_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Attendance summary for past events */}
                      {isEventPast(event.end_time) && event.status !== 'cancelled' && parseInt(event.participant_count) > 0 && (
                        <div className="mt-2 mb-1">
                          {parseInt(event.attended_count) > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                                <div
                                  className="h-full bg-green-400 rounded-full"
                                  style={{ width: `${Math.round((parseInt(event.attended_count) / parseInt(event.participant_count)) * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-green-700 font-medium">
                                {event.attended_count}/{event.participant_count} attended
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Attendance not marked</span>
                          )}
                        </div>
                      )}

                      {/* Participants */}
                      {event.participants && event.participants.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center mb-2">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Participants:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {event.participants.map((participant) => (
                              <span
                                key={participant.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {participant.name} {participant.surname}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Files */}
                      {event.files && event.files.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center mb-2">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Attachments:</span>
                          </div>
                          <div className="space-y-1">
                            {event.files.map((file) => (
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

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-2 flex-shrink-0">
                      {/* RSVP for participants (non-organizers) */}
                      {event.status !== 'cancelled' && event.participants?.some(p => String(p.id) === String(userId)) && String(event.organizer_id) !== String(userId) && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRsvp(event.id, 'accepted')}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded hover:bg-green-200 transition-colors"
                            title="Accept"
                          >✓ Accept</button>
                          <button
                            onClick={() => handleRsvp(event.id, 'declined')}
                            className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded hover:bg-red-200 transition-colors"
                            title="Decline"
                          >✗ Decline</button>
                        </div>
                      )}
                      {canEdit && event.status !== 'cancelled' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditingEventId(event.id)}
                            className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 p-2 rounded transition-colors"
                            title="Edit event"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {isEventUpcoming(event.start_time) && (
                            <button
                              onClick={() => handleCancel(event.id, event.title)}
                              className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 p-2 rounded transition-colors"
                              title="Cancel event"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                            title="Delete event"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md">
              {currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {editingEventId && (
        <EditEventModal
          eventId={editingEventId}
          onClose={() => setEditingEventId(null)}
          onUpdated={() => {
            setEditingEventId(null);
            loadEvents();
          }}
        />
      )}

      {detailEventId && (
        <EventDetailPanel
          eventId={detailEventId}
          onClose={() => setDetailEventId(null)}
          onEdit={(id) => { setDetailEventId(null); setEditingEventId(id); }}
          onCancel={handleCancel}
          onRsvp={handleRsvp}
        />
      )}
    </div>
  );
};

export default EventsList;
