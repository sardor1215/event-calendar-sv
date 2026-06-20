import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth";
import { createMeeting, fetchDepartments } from "../../api";
import { useDropzone } from "react-dropzone";
import FloatingInput from "../common/FloatingInput";
import { useToast } from "../../hooks/useToast";
import { validateMeetingData, sanitizeMeetingData } from "../../utils/validation";

const MeetingForm = ({ onClose, onCreated }) => {
  // Meeting form component for creating new meetings
  const { token, userId, userRole, userDepartment } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersByDeptId, setUsersByDeptId] = useState({});
  const [usersNoDept, setUsersNoDept] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [expandedDepartments, setExpandedDepartments] = useState({});
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantFilter, setParticipantFilter] = useState({
    department: 'all',
    role: 'all',
    showSelected: false
  });
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailParticipants, setEmailParticipants] = useState([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailErrors, setEmailErrors] = useState({});
  const [showFileNotifyPopup, setShowFileNotifyPopup] = useState(false);
  const [fileNotifyParticipants, setFileNotifyParticipants] = useState([]);
  const [fileNotifySubject, setFileNotifySubject] = useState("");
  const [fileNotifyMessage, setFileNotifyMessage] = useState("");
  const [sendingFileNotify, setSendingFileNotify] = useState(false);
  const [fileNotifyErrors, setFileNotifyErrors] = useState({});
  const [recurringOptions, setRecurringOptions] = useState({
    isRecurring: false,
    frequency: 'weekly',
    interval: 1,
    endDate: '',
    occurrences: 5
  });
  const [conflictWarnings, setConflictWarnings] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showTemplateSave, setShowTemplateSave] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    meeting_number: "",
    meeting_chair: "",
    start_time: "",
    end_time: "",
    participants: []
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchDepartmentsAndUsers();
    // Fetch available templates
    fetch(`${process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/"}api/templates`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.ok ? r.json() : []).then(data => setTemplates(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (dataLoading || departments.length === 0) return;
    const map = {};
    const noDept = [];
    users.forEach(u => {
      // Use department_id (integer FK) if present; fall back to name lookup
      let deptId = u.department_id != null ? u.department_id : undefined;
      if (deptId == null && typeof u.department === 'string' && u.department) {
        const found = departments.find(d => d.name.trim() === u.department.trim());
        if (found) deptId = found.id;
      }
      if (deptId != null) {
        const key = String(deptId);
        if (!map[key]) map[key] = [];
        map[key].push(u);
      } else {
        noDept.push(u);
      }
    });
    console.log('usersByDeptId keys:', Object.keys(map), 'noDept:', noDept.length);
    setUsersByDeptId(map);
    setUsersNoDept(noDept);
  }, [dataLoading, users, departments]);

  // Check conflicts when location or times change
  useEffect(() => {
    const { start_time, end_time, location } = formData;
    if (start_time && end_time && location) {
      const timeout = setTimeout(async () => {
        try {
          const params = new URLSearchParams({
            start: new Date(start_time).toISOString(),
            end: new Date(end_time).toISOString(),
            location,
          });
          const res = await fetch(
            `${process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/"}api/meetings/conflicts?${params}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.ok) {
            const data = await res.json();
            setConflictWarnings(data.conflicts || []);
          }
        } catch (e) {
          console.error('Conflict check failed:', e);
        }
      }, 600);
      return () => clearTimeout(timeout);
    } else {
      setConflictWarnings([]);
    }
  }, [formData.start_time, formData.end_time, formData.location, token]);

  // Ensure end time is always valid when form data changes
  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const startDate = new Date(formData.start_time);
      const endDate = new Date(formData.end_time);
      
      if (endDate <= startDate) {
        // Auto-correct invalid end time
        const correctedEndDate = new Date(startDate.getTime() + 30 * 60 * 1000);
        const correctedEndTimeString = formatDateTimeLocal(correctedEndDate);
        
        setFormData(prev => ({
          ...prev,
          end_time: correctedEndTimeString
        }));
      }
    }
  }, [formData.start_time, formData.end_time]);

  const fetchDepartmentsAndUsers = async () => {
    try {
      setDataLoading(true);
      
      // Fetch all data in parallel
      const [deptResponse, usersResponse, locationsResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/"}api/departments`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/"}api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-user-role": userRole,
            "x-user-department": userDepartment || "",
          },
        }),
        fetch(`${process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/"}api/locations`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      ]);

      // Process responses
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        console.log('Departments data:', deptData);
        setDepartments(deptData);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Users data:', usersData);
        setUsers(usersData);
      } else {
        console.error('Users API error:', usersResponse.status, usersResponse.statusText);
        const errorText = await usersResponse.text();
        console.error('Users API error response:', errorText);
      }

      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        setLocations(locationsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showError("Failed to load form data. Please try again.");
    } finally {
      setDataLoading(false);
    }
  };

  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateTimeGB = (date) => {
    try {
      const d = new Date(date);
      return d.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (_) {
      return String(date);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If start_time is being changed, automatically set end_time to 30 minutes later
    if (name === 'start_time' && value) {
      const startDate = new Date(value);
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // Add 30 minutes
      const endTimeString = formatDateTimeLocal(endDate);
      
      console.log('Start time changed:', value);
      console.log('Start date object:', startDate);
      console.log('End date object:', endDate);
      console.log('Formatted end time:', endTimeString);
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        end_time: endTimeString
      }));
    } else if (name === 'end_time' && value) {
      // If end_time is being changed, validate it's after start_time
      const startDate = new Date(formData.start_time);
      const endDate = new Date(value);
      
      console.log('End time changed:', value);
      console.log('Start time from form:', formData.start_time);
      console.log('Start date object:', startDate);
      console.log('End date object:', endDate);
      console.log('Is end <= start?', endDate <= startDate);
      
      if (formData.start_time && endDate <= startDate) {
        // If end time is before or equal to start time, auto-correct it
        const correctedEndDate = new Date(startDate.getTime() + 30 * 60 * 1000);
        const correctedEndTimeString = formatDateTimeLocal(correctedEndDate);
        
        console.log('Auto-correcting end time to:', correctedEndTimeString);
        
        setFormData(prev => ({
          ...prev,
          [name]: correctedEndTimeString
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const normalizeId = (val) => (val === undefined || val === null ? "" : String(val));

  const handleParticipantChange = (userId) => {
    const idStr = normalizeId(userId);
    setFormData(prev => ({
      ...prev,
      participants: (prev.participants || []).includes(idStr)
        ? (prev.participants || []).filter(id => id !== idStr)
        : [...(prev.participants || []), idStr]
    }));
  };

  const getUserDepartmentId = (user) => {
    // Prefer the explicit department_id integer field from the backend
    if (user.department_id !== undefined && user.department_id !== null) return user.department_id;
    if (user.departmentId !== undefined && user.departmentId !== null) return user.departmentId;
    // If department is an integer (raw FK value), use it directly
    if (typeof user.department === 'number') return user.department;
    if (user.department && typeof user.department === 'object') {
      if (user.department.id !== undefined && user.department.id !== null) return user.department.id;
      if (user.department.name) {
        const dept = departments.find(d => d.name === user.department.name);
        return dept ? dept.id : undefined;
      }
    }
    // String: try name lookup, then try parsing as integer ID
    if (user.department && typeof user.department === 'string') {
      const byName = departments.find(d => d.name === user.department);
      if (byName) return byName.id;
      const parsed = parseInt(user.department, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return undefined;
  };

  const addDepartmentParticipants = (departmentId) => {
    if (!departmentId) return;
    const idsToAdd = (usersByDeptId[String(departmentId)] || []).map(u => normalizeId(u.id));
    setFormData(prev => ({
      ...prev,
      participants: Array.from(new Set([...(prev.participants || []), ...idsToAdd]))
    }));
  };

  const removeDepartmentParticipants = (departmentId) => {
    if (!departmentId) return;
    const idsToRemove = new Set(
      (usersByDeptId[String(departmentId)] || []).map(u => normalizeId(u.id))
    );
    setFormData(prev => ({
      ...prev,
      participants: (prev.participants || []).filter(id => !idsToRemove.has(id))
    }));
  };

  const toggleDepartmentExpanded = (departmentId) => {
    setExpandedDepartments(prev => ({
      ...prev,
      [departmentId]: !prev[departmentId]
    }));
  };

  // Enhanced filter users based on search term and filters
  const filterUsers = (users, searchTerm, filters) => {
    let filteredUsers = users;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(term) || 
        user.surname.toLowerCase().includes(term) ||
        `${user.name} ${user.surname}`.toLowerCase().includes(term) ||
        (user.email && user.email.toLowerCase().includes(term))
      );
    }

    // Apply department filter
    if (filters.department !== 'all') {
      filteredUsers = filteredUsers.filter(user => 
        String(getUserDepartmentId(user) || "") === String(filters.department)
      );
    }

    // Apply role filter
    if (filters.role !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === filters.role);
    }

    // Apply selected filter
    if (filters.showSelected) {
      filteredUsers = filteredUsers.filter(user => 
        (formData.participants || []).includes(String(user.id))
      );
    }

    return filteredUsers;
  };

  // Get unique roles from users
  const getUniqueRoles = () => {
    const roles = [...new Set(users.map(user => user.role))];
    return roles.filter(role => role !== 'admin');
  };

  // Check for meeting conflicts at the selected location and time
  const checkMeetingConflicts = async () => {
    if (!formData.start_time || !formData.end_time || !formData.location) {
      return [];
    }
    try {
      const params = new URLSearchParams({
        start: new Date(formData.start_time).toISOString(),
        end: new Date(formData.end_time).toISOString(),
        location: formData.location,
      });
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/"}api/meetings/conflicts?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        return data.conflicts || [];
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
    return [];
  };

  // Get selected participants count
  const getSelectedParticipantsCount = () => {
    return formData.participants ? formData.participants.length : 0;
  };

  // Get selected participants names
  const getSelectedParticipantsNames = () => {
    if (!formData.participants || formData.participants.length === 0) return [];
    return formData.participants.map(participantId => {
      const user = users.find(u => String(u.id) === String(participantId));
      return user ? `${user.name} ${user.surname}` : `User ${participantId}`;
    });
  };

  // Initialize email popup with all participants selected
  const initializeEmailPopup = () => {
    setEmailParticipants([...(formData.participants || [])]);
    setEmailSubject(`Meeting Invitation: ${formData.title}`);
    setEmailMessage(`Dear Participant,

You are cordially invited to attend the following meeting:

📅 Meeting Details:
• Title: ${formData.title}
• Start Time: ${formatDateTimeGB(formData.start_time)}
• Location: ${formData.location || 'To be determined'}
${formData.meeting_chair ? `• Meeting Chair: ${formData.meeting_chair}` : ''}

${formData.description ? `📋 \n${formData.description}` : ''}



Looking forward to seeing you there!

Best regards,
Meeting Organizer`);
    setEmailErrors({});
    setShowEmailPopup(true);
  };

  // Validate email form
  const validateEmailForm = () => {
    const newErrors = {};
    
    if (!emailSubject.trim()) {
      newErrors.subject = "Email subject is required";
    }
    
    if (!emailMessage.trim()) {
      newErrors.message = "Email message is required";
    }
    
    if (emailParticipants.length === 0) {
      newErrors.participants = "Please select at least one participant";
    }
    
    setEmailErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const selectDepartmentParticipants = (departmentId) => {
    const deptUsers = usersByDeptId[String(departmentId)] || [];
    const deptUserIds = deptUsers.map(u => String(u.id));
    setFormData(prev => ({
      ...prev,
      participants: Array.from(new Set([...(prev.participants || []), ...deptUserIds]))
    }));
  };


  // Handle email participant selection
  const handleEmailParticipantChange = (userId) => {
    const idStr = String(userId);
    setEmailParticipants(prev => 
      prev.includes(idStr)
        ? prev.filter(id => id !== idStr)
        : [...prev, idStr]
    );
  };

  // Send email notifications
  const sendEmailNotifications = async () => {
    if (!validateEmailForm()) {
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/"}api/meetings/send-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          meetingId: formData.meetingId, // We'll need to get this from the created meeting
          participants: emailParticipants,
          subject: emailSubject,
          message: emailMessage,
          meetingTitle: formData.title,
          startTime: formData.start_time,
          endTime: formData.end_time,
          location: formData.location,
          description: formData.description
        })
      });

      if (response.ok) {
        showSuccess("Emails sent successfully from Sun Valley Meeting Point.");
        setShowEmailPopup(false);
        afterEmailStep();
      } else {
        const errorData = await response.json();
        showError("Failed to send email notifications: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error sending email notifications:", error);
      showError("Failed to send email notifications: " + (error.message || "Unknown error"));
    } finally {
      setSendingEmail(false);
    }
  };

  const afterEmailStep = () => {
    if (selectedFiles.length > 0) {
      initializeFileNotifyPopup();
    } else {
      resetFormAndClose();
    }
  };

  const initializeFileNotifyPopup = () => {
    setFileNotifyParticipants([...(formData.participants || [])]);
    setFileNotifySubject(`Document Shared: ${formData.title}`);
    const fileList = selectedFiles.map(f => `• ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join('\n');
    setFileNotifyMessage(`Dear Participant,

New documents have been attached to the following meeting:

📅 Meeting: ${formData.title}
📅 Start Time: ${formatDateTimeGB(formData.start_time)}

📎 Attached Documents:
${fileList}

Please review the attached documents before the meeting.

Best regards,
Meeting Organizer`);
    setFileNotifyErrors({});
    setShowFileNotifyPopup(true);
  };

  const sendFileNotifications = async () => {
    const newErrors = {};
    if (!fileNotifySubject.trim()) newErrors.subject = "Subject is required";
    if (!fileNotifyMessage.trim()) newErrors.message = "Message is required";
    if (fileNotifyParticipants.length === 0) newErrors.participants = "Please select at least one participant";
    setFileNotifyErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSendingFileNotify(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/"}api/meetings/send-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          meetingId: formData.meetingId,
          participants: fileNotifyParticipants,
          subject: fileNotifySubject,
          message: fileNotifyMessage,
          meetingTitle: formData.title,
          startTime: formData.start_time,
          endTime: formData.end_time,
          location: formData.location,
          description: formData.description
        })
      });
      if (response.ok) {
        showSuccess("Document notification sent successfully!");
        setShowFileNotifyPopup(false);
        resetFormAndClose();
      } else {
        const errorData = await response.json();
        showError("Failed to send notification: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      showError("Failed to send notification: " + (error.message || "Unknown error"));
    } finally {
      setSendingFileNotify(false);
    }
  };

  // Reset form and close modal
  const resetFormAndClose = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      meeting_number: "",
      meeting_chair: "",
      start_time: "",
      end_time: "",
      participants: []
    });
    setSelectedFiles([]);
    setErrors({});
    setParticipantSearch("");
    setExpandedDepartments({});

    // Notify parent component
    if (onCreated) {
      onCreated();
    }

    // Close modal
    if (onClose) {
      onClose();
    }
  };

  const onDrop = (acceptedFiles) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
      'text/plain': ['.txt']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const applyTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      title: template.title || prev.title,
      description: template.description || prev.description,
      location: template.location || prev.location,
      meeting_chair: template.meeting_chair || prev.meeting_chair,
      participants: Array.isArray(template.participant_ids) && template.participant_ids.length > 0
        ? template.participant_ids.map(id => String(id))
        : prev.participants
    }));
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/"}api/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: templateName.trim(),
          title: formData.title,
          description: formData.description,
          location: formData.location,
          meeting_chair: formData.meeting_chair,
          participant_ids: (formData.participants || []).map(id => parseInt(id)).filter(id => !isNaN(id))
        })
      });
      if (res.ok) {
        showSuccess('Template saved successfully!');
        setShowTemplateSave(false);
        setTemplateName('');
        const tRes = await fetch(`${process.env.REACT_APP_SERVER_IP || "http://192.168.0.109:5000/"}api/templates`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (tRes.ok) setTemplates(await tRes.json());
      } else {
        showError('Failed to save template');
      }
    } catch (e) {
      showError('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const validateForm = () => {
    const newErrors = validateMeetingData(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      // Sanitize form data
      const sanitizedData = sanitizeMeetingData(formData);
      
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.keys(sanitizedData).forEach(key => {
        if (key === 'participants') {
          // Convert participant IDs back to numbers if possible for API compatibility
          const normalized = (sanitizedData[key] || []).map(v => {
            const n = Number(v);
            return Number.isFinite(n) ? n : v;
          });
          formDataToSend.append(key, JSON.stringify(normalized));
        } else {
          formDataToSend.append(key, sanitizedData[key] || "");
        }
      });

      // Add department_id as null since we removed the department selection
      formDataToSend.append('department_id', '');

      // Add recurring options if enabled
      if (recurringOptions.isRecurring) {
        formDataToSend.append('recurring', 'true');
        formDataToSend.append('recurringOptions', JSON.stringify({
          frequency: recurringOptions.frequency,
          interval: recurringOptions.interval,
          endType: 'count',
          count: recurringOptions.occurrences || 5,
          endDate: recurringOptions.endDate || ''
        }));
      }

      // Add files
      selectedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });

      const meetingResponse = await createMeeting(token, formDataToSend);

      // Handle both single meeting and recurring meetings response
      const createdMeetingId = meetingResponse?.id || meetingResponse?.meetings?.[0]?.id;
      if (createdMeetingId) {
        setFormData(prev => ({ ...prev, meetingId: createdMeetingId }));
      }

      const isRecurring = meetingResponse?.meetings?.length > 1;
      if (isRecurring) {
        showSuccess(`Created ${meetingResponse.meetings.length} recurring meetings successfully!`);
        resetFormAndClose();
        return;
      }

      // Show success message using toast
      showSuccess("Meeting created successfully!");

      // Show email notification popup if there are participants with emails
      if (formData.participants && formData.participants.length > 0) {
        initializeEmailPopup();
      } else {
        resetFormAndClose();
      }

    } catch (error) {
      console.error("Error creating meeting:", error);
      showError("Failed to create meeting: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white  shadow-xl max-w-2xl w-full p-6">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mb-4"></div>
            <p className="text-gray-600">Loading form data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-white shadow-2xl max-w-3xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b-2 border-yellow-400 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Meeting</h2>
                <p className="text-gray-500 text-sm">Schedule and organize your meeting</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-2xl transition-colors p-1 hover:bg-gray-100 rounded-lg"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(98vh-70px)] sm:max-h-[calc(95vh-80px)]">

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Template Selector */}
            {templates.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const tpl = templates.find(t => String(t.id) === e.target.value);
                      if (tpl) applyTemplate(tpl);
                    }
                    e.target.value = '';
                  }}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                >
                  <option value="">Use a template to pre-fill...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Title - Full Width */}
            <div>
              <FloatingInput
                label="Meeting Title *"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder=" "
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.title}
                </p>
              )}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Meeting Number */}
                <FloatingInput
                  label="Meeting Number"
                  id="meeting_number"
                  name="meeting_number"
                  value={formData.meeting_number}
                  onChange={handleChange}
                  placeholder=" "
                />

                {/* Meeting Chair */}
                <FloatingInput
                  label="Meeting Chair"
                  id="meeting_chair"
                  name="meeting_chair"
                  value={formData.meeting_chair}
                  onChange={handleChange}
                  placeholder=" "
                />

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">Select Location (Optional)</option>
                {locations.map(location => (
                  <option key={location.id} value={location.name}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border  focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                    errors.start_time ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.start_time && (
                  <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>
                )}
              </div>

                {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                  {formData.start_time && formData.end_time && (() => {
                    const startDate = new Date(formData.start_time);
                    const endDate = new Date(formData.end_time);
                    const timeDiff = endDate.getTime() - startDate.getTime();
                    const minutes = Math.round(timeDiff / (1000 * 60));
                    return minutes === 30 ? (
                      <span className="ml-2 text-xs text-green-600 font-normal">(Auto-set to 30 min duration)</span>
                    ) : null;
                  })()}
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border  focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                    errors.end_time ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.end_time && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.end_time}
                  </p>
                )}
                {formData.start_time && formData.end_time && (() => {
                  const startDate = new Date(formData.start_time);
                  const endDate = new Date(formData.end_time);
                  const timeDiff = endDate.getTime() - startDate.getTime();
                  const minutes = Math.round(timeDiff / (1000 * 60));
                  
                  if (minutes < 0) {
                    return (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        End time cannot be before start time. Auto-correcting to 30 minutes after start time.
                      </p>
                    );
                  } else if (minutes > 0 && minutes !== 30) {
                    return (
                      <p className="text-yellow-600 text-sm mt-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Meeting duration: {minutes} minutes
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
              </div>
            </div>

            {/* Recurring Meeting Options */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={recurringOptions.isRecurring}
                  onChange={(e) => setRecurringOptions(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="w-4 h-4 text-yellow-500 focus:ring-yellow-400 rounded"
                />
                <label htmlFor="recurring" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Make this a recurring meeting
                </label>
              </div>

              {recurringOptions.isRecurring && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                    <select
                      value={recurringOptions.frequency}
                      onChange={(e) => setRecurringOptions(prev => ({ ...prev, frequency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Repeat every</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={recurringOptions.interval}
                      onChange={(e) => setRecurringOptions(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Occurrences</label>
                    <input
                      type="number"
                      min="2"
                      max="52"
                      value={recurringOptions.occurrences}
                      onChange={(e) => setRecurringOptions(prev => ({ ...prev, occurrences: parseInt(e.target.value) || 5 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>
              )}
            </div>


            {/* Conflict Warning */}
            {conflictWarnings.length > 0 && (
              <div className="bg-orange-50 border border-orange-300 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-orange-800">Location conflict detected</p>
                    <p className="text-xs text-orange-700 mt-0.5">This location is already booked:</p>
                    <ul className="mt-1 space-y-0.5">
                      {conflictWarnings.map(c => (
                        <li key={c.id} className="text-xs text-orange-700">
                          • <strong>{c.title}</strong> ({new Date(c.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – {new Date(c.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Description - Full Width */}
            <FloatingInput
              label="Description"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder=" "
            />

            {/* Participants */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Participants
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={fetchDepartmentsAndUsers}
                    disabled={dataLoading}
                    className="text-xs text-yellow-600 hover:text-yellow-800 flex items-center gap-1 disabled:opacity-50"
                    title="Refresh participant list"
                  >
                    <svg className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  <div className="text-sm text-gray-500">
                    {getSelectedParticipantsCount()} selected
                  </div>
                </div>
              </div>

              {/* Enhanced Search and Filters */}
              <div className="mb-3 space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search participants by name or email..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap gap-2">
                  <select
                    value={participantFilter.department}
                    onChange={(e) => setParticipantFilter(prev => ({ ...prev, department: e.target.value }))}
                    className="px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>

                  <select
                    value={participantFilter.role}
                    onChange={(e) => setParticipantFilter(prev => ({ ...prev, role: e.target.value }))}
                    className="px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="all">All Roles</option>
                    {getUniqueRoles().map(role => (
                      <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={participantFilter.showSelected}
                      onChange={(e) => setParticipantFilter(prev => ({ ...prev, showSelected: e.target.checked }))}
                      className="text-yellow-500 focus:ring-yellow-400"
                    />
                    Show Selected Only
                  </label>

                  <button
                    onClick={() => setParticipantFilter({ department: 'all', role: 'all', showSelected: false })}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Selected Participants Summary */}
              {getSelectedParticipantsCount() > 0 && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 ">
                  <div className="text-sm font-medium text-yellow-800 mb-2">
                    Selected Participants ({getSelectedParticipantsCount()}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getSelectedParticipantsNames().map((name, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs "
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants List */}
              <div className="max-h-60 overflow-y-auto border border-gray-300 ">
                {/* Departments */}
                {departments.map(dept => {
                  const deptUsers = filterUsers(
                    usersByDeptId[String(dept.id)] || [],
                    participantSearch,
                    participantFilter
                  );
                  const expanded = !!expandedDepartments[dept.id];
                  
                  // Don't show department if no users match search
                  if (participantSearch && deptUsers.length === 0) return null;
                  
                  return (
                    <div key={dept.id} className="border-b last:border-b-0">
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleDepartmentExpanded(dept.id)}
                          className="flex items-center gap-2 text-left flex-1"
                          aria-expanded={expanded}
                          aria-label={`Toggle ${dept.name} department`}
                        >
                          <span className="inline-block w-4 text-gray-500 transition-transform">
                            {expanded ? '▾' : '▸'}
                          </span>
                          <span className="text-sm font-medium text-gray-800">{dept.name}</span>
                          <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-1 ">
                            {deptUsers.length}
                          </span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addDepartmentParticipants(dept.id)}
                            className="px-2 py-1 text-xs bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition-colors flex items-center gap-1"
                            title={`Add all users from ${dept.name}`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add all
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDepartmentParticipants(dept.id)}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-800  hover:bg-gray-300 transition-colors flex items-center gap-1"
                            title={`Remove all users from ${dept.name}`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Remove all
                          </button>
                        </div>
                      </div>
                      {expanded && (
                        <div className="px-3 py-2 space-y-1 bg-white">
                          {deptUsers.length === 0 ? (
                            <div className="text-xs text-gray-500 italic">
                              {participantSearch ? 'No users match your search' : 'No users in this department'}
                            </div>
                          ) : (
                            deptUsers.map(user => (
                              <label 
                                key={user.id} 
                                className="flex items-center gap-2 p-2 hover:bg-gray-50  cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={(formData.participants || []).includes(String(user.id))}
                                  onChange={() => handleParticipantChange(user.id)}
                                  className=" text-yellow-500 focus:ring-yellow-400"
                                  aria-label={`Select ${user.name} ${user.surname}`}
                                />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-800">
                                    {user.name} {user.surname}
                                  </span>
                                  {user.email && (
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                  )}
                                </div>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Users with no department */}
                {(() => {
                  const noDeptUsers = filterUsers(
                    usersNoDept,
                    participantSearch,
                    participantFilter
                  );
                  if (noDeptUsers.length === 0) return null;
                  
                  const key = 'no_dept';
                  const expanded = !!expandedDepartments[key];
                  
                  return (
                    <div className="border-b last:border-b-0">
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <button 
                          type="button" 
                          onClick={() => toggleDepartmentExpanded(key)} 
                          className="flex items-center gap-2 text-left flex-1"
                          aria-expanded={expanded}
                          aria-label="Toggle users without department"
                        >
                          <span className="inline-block w-4 text-gray-500 transition-transform">
                            {expanded ? '▾' : '▸'}
                          </span>
                          <span className="text-sm font-medium text-gray-800">No Department</span>
                          <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-1 ">
                            {noDeptUsers.length}
                          </span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button" 
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                participants: Array.from(new Set([...(prev.participants || []), ...noDeptUsers.map(u => String(u.id))]))
                              }));
                            }} 
                            className="px-2 py-1 text-xs bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition-colors"
                            title="Add all users without department"
                          >
                            Add all
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              const toRemove = new Set(noDeptUsers.map(u => String(u.id)));
                              setFormData(prev => ({
                                ...prev,
                                participants: (prev.participants || []).filter(id => !toRemove.has(id))
                              }));
                            }} 
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-800  hover:bg-gray-300 transition-colors"
                            title="Remove all users without department"
                          >
                            Remove all
                          </button>
                        </div>
                      </div>
                      {expanded && (
                        <div className="px-3 py-2 space-y-1 bg-white">
                          {noDeptUsers.map(user => (
                            <label 
                              key={user.id} 
                              className="flex items-center gap-2 p-2 hover:bg-gray-50  cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={(formData.participants || []).includes(String(user.id))}
                                onChange={() => handleParticipantChange(user.id)}
                                className=" text-yellow-500 focus:ring-yellow-400"
                                aria-label={`Select ${user.name} ${user.surname}`}
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-800">
                                  {user.name} {user.surname}
                                </span>
                                {user.email && (
                                  <div className="text-xs text-gray-500">{user.email}</div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* No results message */}
                {participantSearch && users.length > 0 && 
                 departments.every(dept => {
                   const deptUsers = filterUsers(
                     users.filter(u => String(getUserDepartmentId(u) || "") === String(dept.id)),
                     participantSearch
                   );
                   return deptUsers.length === 0;
                 }) && 
                 filterUsers(users.filter(u => !getUserDepartmentId(u)), participantSearch).length === 0 && (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    No participants found matching "{participantSearch}"
                  </div>
                )}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Attachments
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed  p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? "border-yellow-400 bg-yellow-50 scale-105"
                    : "border-gray-300 hover:border-yellow-400 hover:bg-yellow-50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-gray-600">
                  <div className={`mx-auto h-16 w-16 mb-4 transition-colors ${
                    isDragActive ? "text-blue-500" : "text-gray-400"
                  }`}>
                    <svg stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2">
                    {isDragActive
                      ? "Drop files here..."
                      : "Drag & drop files here, or click to select"}
                  </p>
                  <p className="text-sm text-gray-500 mb-3">
                    PDF, DOC, DOCX, XLS, XLSX, TXT, Images (max 10MB each)
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Click to browse files</span>
                  </div>
                </div>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Selected Files ({selectedFiles.length})</h4>
                    <button
                      type="button"
                      onClick={() => setSelectedFiles([])}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white border border-gray-200 p-3  hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-800">{file.name}</span>
                            <div className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50  transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 gap-3 flex-wrap">
              {/* Save as Template */}
              <div className="flex items-center gap-2">
                {!showTemplateSave ? (
                  <button
                    type="button"
                    onClick={() => setShowTemplateSave(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save as Template
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Template name..."
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 w-40"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    />
                    <button type="button" onClick={saveAsTemplate} disabled={savingTemplate || !templateName.trim()} className="px-3 py-2 text-sm bg-yellow-400 text-gray-900 font-semibold rounded-md hover:bg-yellow-300 disabled:opacity-50">
                      {savingTemplate ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => { setShowTemplateSave(false); setTemplateName(''); }} className="p-2 text-gray-500 hover:text-gray-700 text-sm">✕</button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300  hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2 bg-yellow-400 text-gray-900 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Meeting
                  </>
                )}
              </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Email Notification Popup */}
      {showEmailPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white shadow-2xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-white border-b-2 border-yellow-400 px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Send Email Notifications</h2>
                    <p className="text-gray-500 text-sm">Notify participants about the meeting</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEmailPopup(false);
                    resetFormAndClose();
                  }}
                  className="text-gray-400 hover:text-gray-700 text-2xl transition-colors p-1 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-6 overflow-y-auto flex-1">
                <div className="space-y-4 sm:space-y-6">
                  {/* Email Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Subject *
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => {
                        setEmailSubject(e.target.value);
                        if (emailErrors.subject) {
                          setEmailErrors(prev => ({ ...prev, subject: "" }));
                        }
                      }}
                      className={`w-full px-4 py-3 border  focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors ${
                        emailErrors.subject ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="Enter email subject"
                    />
                    {emailErrors.subject && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {emailErrors.subject}
                      </p>
                    )}
                  </div>

                  {/* Email Message */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Message *
                    </label>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => {
                        setEmailMessage(e.target.value);
                        if (emailErrors.message) {
                          setEmailErrors(prev => ({ ...prev, message: "" }));
                        }
                      }}
                      rows={14}
                      className={`w-full px-4 py-3 border  focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors resize-none ${
                        emailErrors.message ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="Enter your message to participants..."
                    />
                    {emailErrors.message && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {emailErrors.message}
                      </p>
                    )}
                  </div>

                  {/* Participants Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Select Participants
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {emailParticipants.length} of {formData.participants?.length || 0} selected
                        </span>
                        <div className="w-2 h-2 bg-green-500 "></div>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-gray-300  p-4 space-y-2 bg-gray-50">
                      {formData.participants && formData.participants.length > 0 ? (
                        formData.participants.map(participantId => {
                          const user = users.find(u => String(u.id) === String(participantId));
                          if (!user) return null;
                          
                          return (
                            <label 
                              key={user.id} 
                              className="flex items-center gap-3 p-3 hover:bg-white  cursor-pointer transition-all duration-200 border border-transparent hover:border-yellow-200 hover:shadow-sm"
                            >
                              <input
                                type="checkbox"
                                checked={emailParticipants.includes(String(user.id))}
                                onChange={() => handleEmailParticipantChange(user.id)}
                                className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300  focus:ring-yellow-400 focus:ring-2"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-yellow-100 flex items-center justify-center">
                                    <span className="text-yellow-700 font-semibold text-sm">
                                      {user.name.charAt(0)}{user.surname.charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-800">
                                      {user.name} {user.surname}
                                    </span>
                                    {user.email && (
                                      <div className="text-xs text-gray-500">{user.email}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {emailParticipants.includes(String(user.id)) && (
                                <div className="w-5 h-5 bg-green-500  flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </label>
                          );
                        })
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-8">
                          <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          No participants selected for this meeting
                        </div>
                      )}
                    </div>
                    {emailErrors.participants && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {emailErrors.participants}
                      </p>
                    )}
                  </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {emailParticipants.length > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Ready to send to {emailParticipants.length} participant(s)
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailPopup(false);
                      afterEmailStep();
                    }}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300  hover:bg-gray-50 transition-colors font-medium"
                  >
                    Skip Email
                  </button>
                  <button
                    type="button"
                    onClick={sendEmailNotifications}
                    disabled={sendingEmail || emailParticipants.length === 0 || !emailSubject.trim() || !emailMessage.trim()}
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
                        Send Emails
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* File Notification Popup */}
      {showFileNotifyPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-white border-b-2 border-yellow-400 px-6 py-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Notify About Attached Documents</h2>
                    <p className="text-gray-500 text-sm">Inform participants about the files added to this meeting</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowFileNotifyPopup(false); resetFormAndClose(); }}
                  className="text-gray-400 hover:text-gray-700 text-2xl transition-colors p-1 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-5">
                {/* Attached Files Summary */}
                <div className="bg-yellow-50 border border-yellow-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {selectedFiles.length} file(s) attached to this meeting
                  </h3>
                  <div className="space-y-1">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{file.name}</span>
                        <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notification Subject */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notification Subject *</label>
                  <input
                    type="text"
                    value={fileNotifySubject}
                    onChange={(e) => {
                      setFileNotifySubject(e.target.value);
                      if (fileNotifyErrors.subject) setFileNotifyErrors(prev => ({ ...prev, subject: "" }));
                    }}
                    className={`w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors ${
                      fileNotifyErrors.subject ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="Enter notification subject"
                  />
                  {fileNotifyErrors.subject && (
                    <p className="text-red-500 text-sm mt-1">{fileNotifyErrors.subject}</p>
                  )}
                </div>

                {/* Notification Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notification Message *</label>
                  <textarea
                    value={fileNotifyMessage}
                    onChange={(e) => {
                      setFileNotifyMessage(e.target.value);
                      if (fileNotifyErrors.message) setFileNotifyErrors(prev => ({ ...prev, message: "" }));
                    }}
                    rows={14}
                    className={`w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors resize-none ${
                      fileNotifyErrors.message ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="Enter your message to participants..."
                  />
                  {fileNotifyErrors.message && (
                    <p className="text-red-500 text-sm mt-1">{fileNotifyErrors.message}</p>
                  )}
                </div>

                {/* Participants Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">Select Participants</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {fileNotifyParticipants.length} of {formData.participants?.length || 0} selected
                      </span>
                      <div className="w-2 h-2 bg-green-500"></div>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 p-4 space-y-2 bg-gray-50">
                    {formData.participants && formData.participants.length > 0 ? (
                      formData.participants.map(participantId => {
                        const user = users.find(u => String(u.id) === String(participantId));
                        if (!user) return null;
                        return (
                          <label key={user.id} className="flex items-center gap-3 p-3 hover:bg-white cursor-pointer transition-all duration-200 border border-transparent hover:border-yellow-200 hover:shadow-sm">
                            <input
                              type="checkbox"
                              checked={fileNotifyParticipants.includes(String(user.id))}
                              onChange={() => {
                                const idStr = String(user.id);
                                setFileNotifyParticipants(prev =>
                                  prev.includes(idStr) ? prev.filter(id => id !== idStr) : [...prev, idStr]
                                );
                              }}
                              className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 focus:ring-yellow-400 focus:ring-2"
                            />
                            <div className="flex-1 flex items-center gap-2">
                              <div className="w-8 h-8 bg-yellow-100 flex items-center justify-center">
                                <span className="text-yellow-700 font-semibold text-sm">
                                  {user.name.charAt(0)}{user.surname.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-800">{user.name} {user.surname}</span>
                                {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
                              </div>
                            </div>
                            {fileNotifyParticipants.includes(String(user.id)) && (
                              <div className="w-5 h-5 bg-green-500 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-4">No participants in this meeting</div>
                    )}
                  </div>
                  {fileNotifyErrors.participants && (
                    <p className="text-red-500 text-sm mt-1">{fileNotifyErrors.participants}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {fileNotifyParticipants.length > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Ready to notify {fileNotifyParticipants.length} participant(s)
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowFileNotifyPopup(false); resetFormAndClose(); }}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={sendFileNotifications}
                    disabled={sendingFileNotify || fileNotifyParticipants.length === 0}
                    className="px-8 py-2 bg-yellow-400 text-gray-900 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                  >
                    {sendingFileNotify ? (
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Notify Participants
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Templates Modal */}
    </div>
  );
};

export default MeetingForm;
