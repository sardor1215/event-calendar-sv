import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import EventCalendar from '../components/meetings/EventCalendar';
import EditMeetingModal from '../components/meetings/EditMeetingModal';
import MeetingForm from '../components/meetings/MeetingForm';
import Navbar from '../components/Navbar';
import { fetchMeetings, deleteMeeting } from '../api';

const CalendarPage = () => {
  const { token, userRole, userId } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({
    department_id: '',
    status: 'all', // all, upcoming, ongoing, past
    search: '',
    location: ''
  });

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
    setEditingMeetingId(null);
  };

  const handleEventSaved = () => {
    setRefreshTrigger(prev => prev + 1);
    handleCloseModals();
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) {
      return;
    }

    try {
      await deleteMeeting(token, eventId);
      setRefreshTrigger(prev => prev + 1);
      handleCloseModals();
    } catch (err) {
      console.error('Error deleting meeting:', err);
      alert('Failed to delete meeting');
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
                View and manage your meetings and events
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
        <div className="mb-2 flex flex-wrap gap-2 sm:gap-4 items-center">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search meetings..."
            className="flex-1 min-w-0 px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
          />
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
            <option value="all">All Meetings</option>
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
            <span className="hidden sm:inline">Create Meeting</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Calendar */}
        <EventCalendar
          refreshTrigger={refreshTrigger}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          filters={filters}
        />

        {/* Enhanced Event Details Modal */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-md shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="bg-white border-b-2 border-yellow-400 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Meeting Details</h3>
                      <p className="text-gray-500 text-sm">Full meeting information</p>
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
                  {/* Meeting Title */}
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedEvent.title}
                    </h4>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(selectedEvent.start).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        {' '}•{' '}
                        {new Date(selectedEvent.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        {' '}-
                        {' '}{new Date(selectedEvent.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
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

                  {/* Meeting Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Meeting Number */}
                    {selectedEvent.extendedProps.meeting_number && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                            </svg>
                          </div>
                          <div>
                            <h6 className="font-semibold text-gray-800">Meeting Number</h6>
                            <p className="text-sm text-gray-600">{selectedEvent.extendedProps.meeting_number}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Meeting Chair */}
                    {selectedEvent.extendedProps.meeting_chair && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <h6 className="font-semibold text-gray-800">Meeting Chair</h6>
                            <p className="text-sm text-gray-600">{selectedEvent.extendedProps.meeting_chair}</p>
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
                      <p className="text-sm font-medium text-gray-700 mb-2">Participants:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.extendedProps.participants.map((participant) => (
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
                        onClick={() => setEditingMeetingId(selectedEvent.id)}
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

                <MeetingForm
                  onClose={handleCloseModals}
                  onCreated={handleEventSaved}
                  initialData={selectedEvent ? {
                    id: selectedEvent.id,
                    title: selectedEvent.title,
                    description: selectedEvent.extendedProps.description,
                    location: selectedEvent.extendedProps.location,
                    start_time: selectedEvent.start,
                    end_time: selectedEvent.end,
                    participants: selectedEvent.extendedProps.participants
                  } : {
                    start_time: selectedDate ? selectedDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                    end_time: selectedDate ? new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) : new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {editingMeetingId && (
          <EditMeetingModal
            meetingId={editingMeetingId}
            onClose={() => setEditingMeetingId(null)}
            onUpdated={() => {
              setEditingMeetingId(null);
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