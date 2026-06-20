import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth";

const serverIP = process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/";

const rsvpColors = {
  accepted: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  pending: "bg-gray-100 text-gray-600 border-gray-200",
};

const rsvpLabel = { accepted: "✓", declined: "✗", pending: "?" };

const Avatar = ({ name, surname, rsvp }) => {
  const initials = `${(name || "").charAt(0)}${(surname || "").charAt(0)}`.toUpperCase();
  const bgColors = {
    accepted: "bg-green-400 text-white",
    declined: "bg-red-300 text-white",
    pending: "bg-gray-200 text-gray-700",
  };
  return (
    <div className="relative flex-shrink-0" title={`${name} ${surname} — ${rsvp || "pending"}`}>
      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold ${bgColors[rsvp] || bgColors.pending}`}>
        {initials}
      </div>
      <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border border-white flex items-center justify-center text-[8px] font-bold ${rsvpColors[rsvp] || rsvpColors.pending}`}>
        {rsvpLabel[rsvp] || "?"}
      </span>
    </div>
  );
};

const formatDateTime = (dt) => {
  if (!dt) return "";
  return new Date(dt).toLocaleString("en-GB", {
    weekday: "short", day: "2-digit", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  });
};

const formatDuration = (start, end) => {
  const diff = new Date(end) - new Date(start);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}` : `${m}m`;
};

export default function MeetingDetailPanel({ meetingId, onClose, onEdit, onCancel, onRsvp }) {
  const { token, userId, userRole } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [attendance, setAttendance] = useState({}); // { [user_id]: true|false|null }
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  const fetchMeeting = useCallback(async () => {
    if (!meetingId) return;
    setLoading(true);
    try {
      const res = await fetch(`${serverIP}api/meetings/${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
        setNotes(data.notes || "");
        // Seed attendance state from existing data
        if (data.participants) {
          const map = {};
          data.participants.forEach((p) => { map[p.id] = p.attended ?? null; });
          setAttendance(map);
        }
      }
    } catch (_) {}
    setLoading(false);
  }, [meetingId, token]);

  useEffect(() => { fetchMeeting(); }, [fetchMeeting]);

  const saveNotes = async () => {
    if (!meeting) return;
    setNotesSaving(true);
    try {
      await fetch(`${serverIP}api/meetings/${meetingId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (_) {}
    setNotesSaving(false);
  };

  const saveAttendance = async () => {
    if (!meeting) return;
    setAttendanceSaving(true);
    try {
      const payload = Object.entries(attendance).map(([user_id, attended]) => ({ user_id: parseInt(user_id), attended }));
      await fetch(`${serverIP}api/meetings/${meetingId}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ attendance: payload }),
      });
      setAttendanceSaved(true);
      setTimeout(() => setAttendanceSaved(false), 2500);
    } catch (_) {}
    setAttendanceSaving(false);
  };

  const canEdit = meeting && (userRole === "admin" || String(meeting.organizer_id) === String(userId));
  const isCancelled = meeting?.status === "cancelled";
  const isOngoing = meeting && new Date(meeting.start_time) <= new Date() && new Date() <= new Date(meeting.end_time);
  const isUpcoming = meeting && new Date(meeting.start_time) > new Date();
  const isPast = meeting && new Date(meeting.end_time) < new Date();
  const isParticipant = meeting?.participants?.some((p) => String(p.id) === String(userId));
  const myRsvp = meeting?.participants?.find((p) => String(p.id) === String(userId))?.rsvp_status;

  const acceptedCount = meeting?.participants?.filter((p) => p.rsvp_status === "accepted").length || 0;
  const declinedCount = meeting?.participants?.filter((p) => p.rsvp_status === "declined").length || 0;
  const pendingCount = meeting?.participants?.filter((p) => p.rsvp_status === "pending" || !p.rsvp_status).length || 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            {loading ? (
              <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {isCancelled && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Cancelled</span>
                  )}
                  {isOngoing && !isCancelled && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                      Live
                    </span>
                  )}
                  {isUpcoming && !isCancelled && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Upcoming</span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">{meeting?.title}</h2>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${70 + i * 5}%` }} />
              ))}
            </div>
          ) : meeting ? (
            <>
              {/* Date / Time / Duration */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{formatDateTime(meeting.start_time)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 pl-6">
                  <span>→ {formatDateTime(meeting.end_time)}</span>
                  <span className="ml-auto px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full text-xs font-semibold">
                    {formatDuration(meeting.start_time, meeting.end_time)}
                  </span>
                </div>
              </div>

              {/* Meta row */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {meeting.location && (
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Location</p>
                      <p className="text-gray-800 font-medium">{meeting.location}</p>
                    </div>
                  </div>
                )}
                {meeting.meeting_chair && (
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Chair</p>
                      <p className="text-gray-800 font-medium">{meeting.meeting_chair}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Organizer</p>
                    <p className="text-gray-800 font-medium">{meeting.organizer_name} {meeting.organizer_surname}</p>
                  </div>
                </div>
                {meeting.department_name && (
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Department</p>
                      <p className="text-gray-800 font-medium">{meeting.department_name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {meeting.description && (
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1.5">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{meeting.description}</p>
                </div>
              )}

              {/* Participants */}
              {meeting.participants && meeting.participants.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                      Attendees ({meeting.participants.length})
                    </p>
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-600 font-medium">{acceptedCount} ✓</span>
                      <span className="text-red-500 font-medium">{declinedCount} ✗</span>
                      <span className="text-gray-400">{pendingCount} ?</span>
                    </div>
                  </div>
                  {/* Avatar stack */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {meeting.participants.map((p) => (
                      <Avatar key={p.id} name={p.name} surname={p.surname} rsvp={p.rsvp_status} />
                    ))}
                  </div>
                  {/* Detailed list */}
                  <div className="space-y-1.5">
                    {meeting.participants.map((p) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                          {`${(p.name || "").charAt(0)}${(p.surname || "").charAt(0)}`.toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700 flex-1">{p.name} {p.surname}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${rsvpColors[p.rsvp_status] || rsvpColors.pending}`}>
                          {p.rsvp_status || "pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {meeting.files && meeting.files.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Attachments</p>
                  <div className="space-y-1.5">
                    {meeting.files.map((f) => (
                      <a
                        key={f.id}
                        href={`${serverIP}${f.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="truncate">{f.file_name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance — only shown after the meeting has ended */}
              {isPast && meeting.participants && meeting.participants.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Attendance</p>
                    {canEdit && (
                      <button
                        onClick={saveAttendance}
                        disabled={attendanceSaving}
                        className="text-xs text-yellow-700 hover:text-yellow-900 font-medium disabled:opacity-50"
                      >
                        {attendanceSaved ? "Saved ✓" : attendanceSaving ? "Saving…" : "Save"}
                      </button>
                    )}
                  </div>

                  {/* Stats row */}
                  {(() => {
                    const total = meeting.participants.length;
                    const markedAttended = Object.values(attendance).filter((v) => v === true).length;
                    const markedAbsent = Object.values(attendance).filter((v) => v === false).length;
                    const unmarked = total - markedAttended - markedAbsent;
                    const rsvpAccepted = meeting.participants.filter((p) => p.rsvp_status === "accepted").length;
                    const attendanceRate = total > 0 ? Math.round((markedAttended / total) * 100) : 0;
                    return (
                      <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Attended</span>
                          <span className="font-bold text-green-700">{markedAttended} / {total}</span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-400 rounded-full transition-all duration-500"
                            style={{ width: `${attendanceRate}%` }}
                          />
                        </div>
                        <div className="flex gap-3 text-xs text-gray-500 pt-0.5">
                          <span className="text-green-600 font-medium">{markedAttended} attended</span>
                          <span className="text-red-500">{markedAbsent} absent</span>
                          {unmarked > 0 && <span className="text-gray-400">{unmarked} not marked</span>}
                          {rsvpAccepted > 0 && (
                            <span className="ml-auto text-gray-400">
                              RSVP'd: {rsvpAccepted}
                              {markedAttended !== rsvpAccepted && (
                                <span className="ml-1 text-orange-500">
                                  ({markedAttended > rsvpAccepted ? "+" : ""}{markedAttended - rsvpAccepted} vs RSVP)
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Per-person checklist */}
                  <div className="space-y-1.5">
                    {meeting.participants.map((p) => {
                      const attended = attendance[p.id];
                      return (
                        <div key={p.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${attended === true ? "bg-green-50 border-green-200" : attended === false ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                          {/* Avatar */}
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${attended === true ? "bg-green-400 text-white" : attended === false ? "bg-red-300 text-white" : "bg-gray-200 text-gray-600"}`}>
                            {`${(p.name || "").charAt(0)}${(p.surname || "").charAt(0)}`.toUpperCase()}
                          </div>
                          {/* Name + RSVP */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 font-medium truncate">{p.name} {p.surname}</p>
                            <p className="text-xs text-gray-400">RSVP: {p.rsvp_status || "pending"}</p>
                          </div>
                          {/* Toggle buttons (organizer/admin) or read-only badge */}
                          {canEdit ? (
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => setAttendance((prev) => ({ ...prev, [p.id]: prev[p.id] === true ? null : true }))}
                                title="Mark attended"
                                className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${attended === true ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-700"}`}
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setAttendance((prev) => ({ ...prev, [p.id]: prev[p.id] === false ? null : false }))}
                                title="Mark absent"
                                className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${attended === false ? "bg-red-400 text-white" : "bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600"}`}
                              >
                                ✗
                              </button>
                            </div>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${attended === true ? "bg-green-100 text-green-700" : attended === false ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"}`}>
                              {attended === true ? "Attended" : attended === false ? "Absent" : "—"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {canEdit && (
                    <button
                      onClick={saveAttendance}
                      disabled={attendanceSaving}
                      className="mt-3 w-full py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 transition-colors disabled:opacity-50"
                    >
                      {attendanceSaved ? "Attendance Saved ✓" : attendanceSaving ? "Saving…" : "Save Attendance"}
                    </button>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Meeting Notes</p>
                  {canEdit && (
                    <button
                      onClick={saveNotes}
                      disabled={notesSaving}
                      className="text-xs text-yellow-700 hover:text-yellow-900 font-medium disabled:opacity-50"
                    >
                      {notesSaved ? "Saved ✓" : notesSaving ? "Saving…" : "Save"}
                    </button>
                  )}
                </div>
                {canEdit ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={saveNotes}
                    placeholder="Add meeting notes, decisions, or action items…"
                    rows={4}
                    className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none text-gray-700 placeholder-gray-400"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line min-h-[60px]">
                    {notes || <span className="text-gray-400 italic">No notes yet</span>}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Meeting not found</p>
          )}
        </div>

        {/* Footer actions */}
        {meeting && (
          <div className="border-t border-gray-100 p-4 flex gap-2 flex-shrink-0 bg-white">
            {/* RSVP for participants */}
            {isParticipant && !canEdit && !isCancelled && (
              <>
                <button
                  onClick={() => { onRsvp && onRsvp(meeting.id, "accepted"); fetchMeeting(); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${myRsvp === "accepted" ? "bg-green-500 text-white" : "bg-green-100 text-green-800 hover:bg-green-200"}`}
                >
                  ✓ Accept
                </button>
                <button
                  onClick={() => { onRsvp && onRsvp(meeting.id, "declined"); fetchMeeting(); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${myRsvp === "declined" ? "bg-red-500 text-white" : "bg-red-100 text-red-800 hover:bg-red-200"}`}
                >
                  ✗ Decline
                </button>
              </>
            )}
            {/* Organizer actions */}
            {canEdit && (
              <>
                {!isCancelled && (
                  <button
                    onClick={() => { onEdit && onEdit(meeting.id); onClose(); }}
                    className="flex-1 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 transition-colors"
                  >
                    Edit
                  </button>
                )}
                {!isCancelled && isUpcoming && (
                  <button
                    onClick={() => { onCancel && onCancel(meeting.id, meeting.title); onClose(); }}
                    className="flex-1 py-2 bg-orange-100 text-orange-800 font-semibold rounded-lg text-sm hover:bg-orange-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
