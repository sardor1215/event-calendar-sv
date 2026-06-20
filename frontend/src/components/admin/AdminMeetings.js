import React, { useState } from "react";
import { useAuth } from "../../auth";
import MeetingsList from "../meetings/MeetingsList";
import MeetingForm from "../meetings/MeetingForm";
import EventCalendar from "../meetings/EventCalendar";
import { Link } from "react-router-dom";

const AdminMeetings = () => {
  const { userRole } = useAuth();
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  const handleMeetingCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEventClick = (event) => {
    // Handle event click - could open a modal or navigate to event details
  };

  const handleDateClick = (dateClickInfo) => {
    // Handle date click - open meeting form with pre-filled date
    setShowMeetingForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Meetings</h1>
              <p className="mt-2 text-gray-600">
                Manage all meetings across the organization
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              {/* Navigation Links */}
              <Link
                to="/calendar"
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Calendar
              </Link>
              <Link
                to="/admin/users"
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Users
              </Link>
              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === 'list'
                      ? 'bg-yellow-400 text-gray-900 font-semibold'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-2 text-sm font-medium border-l border-gray-300 ${
                    viewMode === 'calendar'
                      ? 'bg-yellow-400 text-gray-900 font-semibold'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Calendar View
                </button>
              </div>
              
              <Link
                to="/calendar"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Full Calendar
              </Link>
              
              <button
                onClick={() => setShowMeetingForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 font-semibold bg-yellow-400 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Meeting
              </button>
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'list' ? (
          <MeetingsList refreshTrigger={refreshTrigger} />
        ) : (
          <EventCalendar
            refreshTrigger={refreshTrigger}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        )}

        {/* Meeting Form Modal */}
        {showMeetingForm && (
          <MeetingForm
            onClose={() => setShowMeetingForm(false)}
            onCreated={handleMeetingCreated}
          />
        )}
      </div>
    </div>
  );
};

export default AdminMeetings;
