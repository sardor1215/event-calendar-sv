import React, { useEffect, useState } from "react";
import { fetchMeetingById, updateMeeting } from "../../api";
import { useAuth } from "../../auth";
import { useToast } from "../../hooks/useToast";
import { useDropzone } from "react-dropzone";
import FloatingInput from "../common/FloatingInput";

const EditMeetingModal = ({ meetingId, onClose, onUpdated }) => {
  const { token } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    meeting_chair: "",
    start_time: "",
    end_time: "",
  });
  const [participants, setParticipants] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [fileIdsToRemove, setFileIdsToRemove] = useState([]);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailParticipants, setEmailParticipants] = useState([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailErrors, setEmailErrors] = useState({});

  const onDrop = (acceptedFiles) => {
    setFilesToUpload(prev => [...prev, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchMeetingById(token, meetingId);
        setFormData({
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          meeting_chair: data.meeting_chair || "",
          start_time: data.start_time ? toLocalInputValue(data.start_time) : "",
          end_time: data.end_time ? toLocalInputValue(data.end_time) : "",
        });
        setParticipants(Array.isArray(data.participants) ? data.participants.map(p => String(p.id)) : []);
        setExistingFiles(Array.isArray(data.files) ? data.files : []);
        // preload users and locations
        try {
          const [usersRes, locsRes] = await Promise.all([
            fetch(`${process.env.REACT_APP_SERVER_IP || 'http://localhost:5000/'}api/users`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }),
            fetch(`${process.env.REACT_APP_SERVER_IP || 'http://localhost:5000/'}api/locations`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }),
          ]);
          if (usersRes.ok) {
            const users = await usersRes.json();
            setAllUsers(users.filter(u => u.role !== 'admin'));
          }
          if (locsRes.ok) {
            const locs = await locsRes.json();
            setLocations(locs);
          }
        } catch {}
      } catch (e) {
        showError("Failed to load meeting details");
        onClose?.();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [meetingId, token]);

  const toLocalInputValue = (iso) => {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const formatDateTime = (localStr) => {
    if (!localStr) return "TBD";
    const d = new Date(localStr);
    return d.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const initializeEmailPopup = () => {
    setEmailParticipants([...participants]);
    setEmailSubject(`Meeting Update: ${formData.title}`);
    setEmailMessage(`Dear Participant,

The following meeting has been updated:

📅 Meeting Details:
• Title: ${formData.title}
• Start Time: ${formatDateTime(formData.start_time)}
• End Time: ${formatDateTime(formData.end_time)}
• Location: ${formData.location || "To be determined"}
${formData.meeting_chair ? `• Meeting Chair: ${formData.meeting_chair}` : ""}

${formData.description ? `📋 Notes:\n${formData.description}` : ""}

Please take note of these changes.

Best regards,
Meeting Organizer`);
    setEmailErrors({});
    setShowEmailPopup(true);
  };

  const sendEmailNotifications = async () => {
    const newErrors = {};
    if (!emailSubject.trim()) newErrors.subject = "Subject is required";
    if (!emailMessage.trim()) newErrors.message = "Message is required";
    if (emailParticipants.length === 0) newErrors.participants = "Please select at least one participant";
    setEmailErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSendingEmail(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVER_IP || "http://localhost:5000/"}api/meetings/send-notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          meetingId,
          participants: emailParticipants,
          subject: emailSubject,
          message: emailMessage,
          meetingTitle: formData.title,
          startTime: formData.start_time,
          endTime: formData.end_time,
          location: formData.location,
          description: formData.description,
        }),
      });
      if (response.ok) {
        showSuccess("Update notification sent successfully!");
      } else {
        const err = await response.json();
        showError("Failed to send: " + (err.error || "Unknown error"));
        return;
      }
    } catch (err) {
      showError("Failed to send: " + (err.message || "Unknown error"));
      return;
    } finally {
      setSendingEmail(false);
    }
    setShowEmailPopup(false);
    onUpdated?.();
    onClose?.();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    // Basic validation
    if (!formData.title?.trim()) {
      showError("Title is required");
      return;
    }
    if (!formData.start_time || !formData.end_time) {
      showError("Start and end time are required");
      return;
    }
    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      showError("End time must be after start time");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("description", formData.description);
      fd.append("location", formData.location);
      fd.append("meeting_chair", formData.meeting_chair);
      fd.append("start_time", formData.start_time);
      fd.append("end_time", formData.end_time);
      // participants
      fd.append('participants', JSON.stringify(participants.map(id => Number(id)).filter(n => Number.isFinite(n))));
      // files to remove
      fd.append('remove_file_ids', JSON.stringify(fileIdsToRemove));
      // new files
      filesToUpload.forEach(f => fd.append('files', f));

      await updateMeeting(token, meetingId, fd);
      showSuccess("Meeting updated successfully!");
      if (participants.length > 0) {
        initializeEmailPopup();
      } else {
        onUpdated?.();
        onClose?.();
      }
    } catch (err) {
      console.error("Failed to update meeting", err);
      showError("Failed to update meeting");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white shadow-xl max-w-xl w-full p-6 text-center">
          <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white shadow-2xl max-w-2xl w-full max-h-[98vh] overflow-hidden">
        <div className="bg-white border-b-2 border-yellow-400 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Meeting</h2>
              <p className="text-gray-500 text-sm">Update meeting details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl p-1 hover:bg-gray-100 rounded-lg transition-colors">×</button>
        </div>

        <form onSubmit={handleSave} className="p-3 sm:p-6 space-y-6 sm:space-y-7 overflow-y-auto max-h-[calc(98vh-80px)]">
          <FloatingInput label="Title *" id="title" name="title" value={formData.title} onChange={handleChange} required />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FloatingInput label="Start Time *" id="start_time" name="start_time" type="datetime-local" value={formData.start_time} onChange={handleChange} required />
            <FloatingInput label="End Time *" id="end_time" name="end_time" type="datetime-local" value={formData.end_time} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FloatingInput label="Location" id="location" name="location" value={formData.location} onChange={handleChange} />
            <FloatingInput label="Meeting Chair" id="meeting_chair" name="meeting_chair" value={formData.meeting_chair} onChange={handleChange} />
          </div>

          <FloatingInput label="Description" id="description" name="description" value={formData.description} onChange={handleChange} rows={3} />

          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Participants</label>
              <span className="text-xs text-gray-500">{participants.length} selected</span>
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-200">
              {allUsers.map(u => (
                <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={participants.includes(String(u.id))}
                    onChange={() => setParticipants(prev => prev.includes(String(u.id)) ? prev.filter(id => id !== String(u.id)) : [...prev, String(u.id)])}
                    className="text-yellow-600"
                  />
                  <div className="flex-1 text-sm">
                    {u.name} {u.surname} {u.email ? <span className="text-gray-500 text-xs">({u.email})</span> : null}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Files */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Attachments</label>
            {existingFiles.length > 0 && (
              <div className="space-y-2 mb-3">
                {existingFiles.map(f => (
                  <div key={f.id} className="flex items-center justify-between border border-gray-200 p-2">
                    <div className="text-sm text-gray-700">{f.file_name}</div>
                    <div className="flex items-center gap-2">
                      {!fileIdsToRemove.includes(f.id) ? (
                        <button type="button" onClick={() => setFileIdsToRemove(prev => [...prev, f.id])} className="text-red-600 text-xs hover:text-red-800">Remove</button>
                      ) : (
                        <button type="button" onClick={() => setFileIdsToRemove(prev => prev.filter(id => id !== f.id))} className="text-gray-600 text-xs hover:text-gray-800">Undo</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? "border-yellow-400 bg-yellow-50"
                  : "border-gray-300 hover:border-yellow-400 hover:bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <p className="text-sm text-gray-600">
                {isDragActive ? "Drop files here..." : "Drag & drop files here, or click to select"}
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Images up to 10MB each</p>
            </div>
            {filesToUpload.length > 0 && (
              <div className="mt-3 space-y-2">
                {filesToUpload.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 p-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700 truncate">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{file.name}</span>
                      <span className="text-gray-400 flex-shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFilesToUpload(prev => prev.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700 text-xs ml-2 flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-8 py-2 bg-yellow-400 text-gray-900 hover:bg-yellow-300 font-semibold disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>

      {/* Email Notification Popup */}
      {showEmailPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-white border-b-2 border-yellow-400 px-6 py-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Notify Participants About Update</h2>
                    <p className="text-gray-500 text-sm">Send an email about the meeting changes</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowEmailPopup(false); onUpdated?.(); onClose?.(); }}
                  className="text-gray-400 hover:text-gray-700 text-2xl transition-colors p-1 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-5">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Subject *</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => { setEmailSubject(e.target.value); if (emailErrors.subject) setEmailErrors(p => ({ ...p, subject: "" })); }}
                    className={`w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors ${emailErrors.subject ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"}`}
                    placeholder="Enter email subject"
                  />
                  {emailErrors.subject && <p className="text-red-500 text-sm mt-1">{emailErrors.subject}</p>}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Message *</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => { setEmailMessage(e.target.value); if (emailErrors.message) setEmailErrors(p => ({ ...p, message: "" })); }}
                    rows={14}
                    className={`w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors resize-none ${emailErrors.message ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"}`}
                    placeholder="Enter your message..."
                  />
                  {emailErrors.message && <p className="text-red-500 text-sm mt-1">{emailErrors.message}</p>}
                </div>

                {/* Participants */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">Select Participants</label>
                    <span className="text-sm text-gray-500">{emailParticipants.length} of {participants.length} selected</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 p-3 space-y-2 bg-gray-50">
                    {participants.map(pid => {
                      const user = allUsers.find(u => String(u.id) === String(pid));
                      if (!user) return null;
                      return (
                        <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-white cursor-pointer border border-transparent hover:border-yellow-200 hover:shadow-sm transition-all">
                          <input
                            type="checkbox"
                            checked={emailParticipants.includes(String(user.id))}
                            onChange={() => {
                              const id = String(user.id);
                              setEmailParticipants(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                            }}
                            className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-400"
                          />
                          <div className="w-8 h-8 bg-yellow-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-yellow-700 font-semibold text-sm">{user.name?.charAt(0)}{user.surname?.charAt(0)}</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{user.name} {user.surname}</div>
                            {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
                          </div>
                          {emailParticipants.includes(String(user.id)) && (
                            <div className="w-5 h-5 bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {emailErrors.participants && <p className="text-red-500 text-sm mt-1">{emailErrors.participants}</p>}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {emailParticipants.length > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Ready to notify {emailParticipants.length} participant(s)
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowEmailPopup(false); onUpdated?.(); onClose?.(); }}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={sendEmailNotifications}
                    disabled={sendingEmail || emailParticipants.length === 0}
                    className="px-8 py-2 bg-yellow-400 text-gray-900 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                  >
                    {sendingEmail ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Update Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditMeetingModal;


