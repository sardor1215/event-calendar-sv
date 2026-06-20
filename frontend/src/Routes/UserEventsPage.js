import React, { useState } from "react";
import { useAuth } from "../auth";
import EventForm from "../components/events/EventForm";
import EventsList from "../components/events/EventsList";
import UserDashboard from "../components/events/UserDashboard";
import EventDetailPanel from "../components/events/EventDetailPanel";

const UserEventsPage = () => {
  const { userRole, userName } = useAuth();
  const [showEventForm, setShowEventForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [detailEventId, setDetailEventId] = useState(null);

  const handleEventCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {userName ? `Hello, ${userName}` : "Your Events"}
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">Here's what's on your calendar</p>
            </div>
            <button
              onClick={() => setShowEventForm(true)}
              className="inline-flex items-center self-start sm:self-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-semibold text-gray-900 bg-yellow-400 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 whitespace-nowrap transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Event
            </button>
          </div>
        </div>

        {/* Dashboard */}
        <UserDashboard onEventClick={(id) => setDetailEventId(id)} />

        {/* Full Events List */}
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-4">All Events</h2>
          <EventsList refreshTrigger={refreshTrigger} />
        </div>

        {/* Event Form Modal */}
        {showEventForm && (
          <EventForm
            onClose={() => setShowEventForm(false)}
            onCreated={handleEventCreated}
          />
        )}

        {/* Detail Panel from dashboard clicks */}
        {detailEventId && (
          <EventDetailPanel
            eventId={detailEventId}
            onClose={() => setDetailEventId(null)}
            onEdit={() => setDetailEventId(null)}
          />
        )}
      </div>
    </div>
  );
};

export default UserEventsPage;
