import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth";

const serverIP = process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/";

const formatTime = (dt) =>
  new Date(dt).toLocaleString("en-GB", {
    weekday: "short", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

const formatDuration = (start, end) => {
  const diff = new Date(end) - new Date(start);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h${m > 0 ? " " + m + "m" : ""}` : `${m}m`;
};

// Big countdown for the hero card — updates from parent `now`
const Countdown = ({ startTime, now }) => {
  const diff = new Date(startTime) - now;
  if (diff <= 0) return <span className="text-green-400 font-bold">Now</span>;
  const totalSecs = Math.floor(diff / 1000);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);

  if (d > 0) {
    return (
      <span>
        <span className="text-4xl font-black">{d}</span>
        <span className="text-xl font-medium text-yellow-300 ml-1">d</span>{" "}
        <span className="text-4xl font-black">{h}</span>
        <span className="text-xl font-medium text-yellow-300 ml-1">h</span>
      </span>
    );
  }
  if (h > 0) {
    return (
      <span>
        <span className="text-4xl font-black">{h}</span>
        <span className="text-xl font-medium text-yellow-300 ml-1">h</span>{" "}
        <span className="text-4xl font-black">{m}</span>
        <span className="text-xl font-medium text-yellow-300 ml-1">m</span>
      </span>
    );
  }
  return (
    <span>
      <span className="text-4xl font-black">{m}</span>
      <span className="text-xl font-medium text-yellow-300 ml-1">min</span>
    </span>
  );
};

export default function UserDashboard({ onEventClick }) {
  const { token, userName, userId } = useAuth();
  const [now, setNow] = useState(new Date());
  const [nextEvent, setNextEvent] = useState(null);
  const [todayEvents, setTodayEvents] = useState([]);
  const [pendingRsvps, setPendingRsvps] = useState([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, thisWeek: 0 });
  const [loading, setLoading] = useState(true);

  // Tick every second for the hero countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const nowISO = new Date().toISOString();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const weekEnd = new Date(Date.now() + 7 * 86400000);

      const [upcomingRes, todayRes, totalRes, weekRes] = await Promise.all([
        fetch(`${serverIP}api/events?from=${nowISO}&limit=10&page=1`, { headers }),
        fetch(`${serverIP}api/events?from=${todayStart.toISOString()}&to=${todayEnd.toISOString()}&limit=20`, { headers }),
        fetch(`${serverIP}api/events?limit=1`, { headers }),
        fetch(`${serverIP}api/events?from=${nowISO}&to=${weekEnd.toISOString()}&limit=1`, { headers }),
      ]);

      const [upcomingData, todayData, totalData, weekData] = await Promise.all([
        upcomingRes.ok ? upcomingRes.json() : {},
        todayRes.ok ? todayRes.json() : {},
        totalRes.ok ? totalRes.json() : {},
        weekRes.ok ? weekRes.json() : {},
      ]);

      const upcoming = upcomingData.events || [];
      const today = todayData.events || [];

      setNextEvent(upcoming[0] || null);
      setTodayEvents(today);
      setStats({
        total: totalData.pagination?.total || 0,
        upcoming: upcomingData.pagination?.total || 0,
        thisWeek: weekData.pagination?.total || 0,
      });

      // Find pending RSVPs — events where user is participant with rsvp_status = 'pending'
      const pending = upcoming.filter(
        (m) =>
          String(m.organizer_id) !== String(userId) &&
          m.participants?.some(
            (p) => String(p.id) === String(userId) && (!p.rsvp_status || p.rsvp_status === "pending")
          )
      );
      setPendingRsvps(pending.slice(0, 5));
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    }
    setLoading(false);
  }, [token, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isOngoing = (m) => new Date(m.start_time) <= now && now <= new Date(m.end_time);

  return (
    <div className="space-y-6 mb-8">
      {/* Hero: Next Event */}
      <div className={`relative overflow-hidden rounded-2xl p-6 text-white ${nextEvent ? "bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800" : "bg-gradient-to-br from-gray-700 to-gray-800"}`}>
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-yellow-400 opacity-10" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-yellow-400 opacity-5" />

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-40 bg-white/20 rounded" />
            <div className="h-8 w-64 bg-white/20 rounded" />
            <div className="h-4 w-32 bg-white/20 rounded" />
          </div>
        ) : nextEvent ? (
          <div className="relative">
            <p className="text-yellow-300 text-xs font-semibold uppercase tracking-widest mb-1">
              {isOngoing(nextEvent) ? "🟢 Happening Now" : "Next Event"}
            </p>
            <button
              onClick={() => onEventClick && onEventClick(nextEvent.id)}
              className="text-xl font-bold hover:text-yellow-300 transition-colors text-left block mb-3"
            >
              {nextEvent.title}
            </button>
            <div className="flex items-end gap-6 flex-wrap">
              {!isOngoing(nextEvent) && (
                <div>
                  <p className="text-white/50 text-xs mb-0.5">Starts in</p>
                  <Countdown startTime={nextEvent.start_time} now={now} />
                </div>
              )}
              <div className="space-y-0.5">
                <p className="text-white/50 text-xs">When</p>
                <p className="text-sm font-medium">{formatTime(nextEvent.start_time)}</p>
              </div>
              {nextEvent.location && (
                <div className="space-y-0.5">
                  <p className="text-white/50 text-xs">Where</p>
                  <p className="text-sm font-medium">📍 {nextEvent.location}</p>
                </div>
              )}
              <div className="space-y-0.5">
                <p className="text-white/50 text-xs">Duration</p>
                <p className="text-sm font-medium">⏱ {formatDuration(nextEvent.start_time, nextEvent.end_time)}</p>
              </div>
              {nextEvent.participants?.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-white/50 text-xs">Attendees</p>
                  <div className="flex -space-x-1">
                    {nextEvent.participants.slice(0, 5).map((p, i) => (
                      <div
                        key={p.id || i}
                        title={`${p.name} ${p.surname}`}
                        className="h-6 w-6 rounded-full bg-yellow-400 text-gray-900 border-2 border-gray-800 flex items-center justify-center text-[9px] font-bold"
                      >
                        {`${(p.name || "").charAt(0)}${(p.surname || "").charAt(0)}`.toUpperCase()}
                      </div>
                    ))}
                    {nextEvent.participants.length > 5 && (
                      <div className="h-6 w-6 rounded-full bg-gray-600 text-white border-2 border-gray-800 flex items-center justify-center text-[9px] font-bold">
                        +{nextEvent.participants.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            <p className="text-yellow-300 text-xs font-semibold uppercase tracking-widest mb-2">Next Event</p>
            <p className="text-2xl font-bold mb-1">You're all clear!</p>
            <p className="text-white/60 text-sm">No upcoming events scheduled.</p>
          </div>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-yellow-200 p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{loading ? "—" : stats.upcoming}</p>
          <p className="text-xs text-gray-500 mt-0.5">Upcoming</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4 text-center">
          <p className="text-2xl font-black text-green-700">{loading ? "—" : todayEvents.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Today</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4 text-center">
          <p className="text-2xl font-black text-blue-700">{loading ? "—" : stats.thisWeek}</p>
          <p className="text-xs text-gray-500 mt-0.5">This Week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's events */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            Today's Schedule
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : todayEvents.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No events today</p>
          ) : (
            <div className="space-y-2">
              {todayEvents.map((m) => {
                const ongoing = isOngoing(m);
                const cancelled = m.status === "cancelled";
                return (
                  <button
                    key={m.id}
                    onClick={() => onEventClick && onEventClick(m.id)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group ${ongoing ? "border border-green-200 bg-green-50" : "border border-gray-100"}`}
                  >
                    <div className={`w-1 h-8 rounded-full flex-shrink-0 ${cancelled ? "bg-red-300" : ongoing ? "bg-green-500" : "bg-yellow-400"}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${cancelled ? "line-through text-gray-400" : "text-gray-900"}`}>{m.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(m.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} –{" "}
                        {new Date(m.end_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        {m.location && ` · ${m.location}`}
                      </p>
                    </div>
                    {ongoing && <span className="text-xs text-green-600 font-semibold flex-shrink-0">Live</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending RSVPs */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
            Pending RSVPs
            {pendingRsvps.length > 0 && (
              <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingRsvps.length}</span>
            )}
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : pendingRsvps.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No pending invitations</p>
          ) : (
            <div className="space-y-2">
              {pendingRsvps.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onEventClick && onEventClick(m.id)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border border-orange-100 bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    ?
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                    <p className="text-xs text-gray-500">{formatTime(m.start_time)}</p>
                  </div>
                  <span className="text-xs text-orange-600 font-semibold flex-shrink-0">RSVP →</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
