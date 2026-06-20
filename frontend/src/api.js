// export const serverIP = "https://ticket-system-server-kzww.vercel.app/";

// Auto-detect env first; fall back by protocol
const getServerIP = () => {
  const fromEnv = process.env.REACT_APP_SERVER_IP;
  if (fromEnv) return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`;
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  return isHttps ? 'https://your-production-api.example.com/' : 'http://localhost:5000/';
};

export const serverIP = getServerIP();

export const fetchTicketDetails = async (ticketId, token) => {
  try {
    const response = await fetch(`${serverIP}api/tickets/${ticketId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching ticket details: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    throw error;
  }
};

// Mark message as seen by current user
export const markMessageAsSeen = async (ticketId, messageId, token) => {
  try {
    const response = await fetch(`${serverIP}api/tickets/${ticketId}/messages/${messageId}/seen`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error marking message as seen: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error marking message as seen:", error);
    throw error;
  }
};

// Fetch who has seen a specific message
export const fetchMessageSeenBy = async (ticketId, messageId, token) => {
  try {
    const response = await fetch(`${serverIP}api/tickets/${ticketId}/messages/${messageId}/seen`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching message seen by: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching message seen by:", error);
    throw error;
  }
};

// Fetch seen status for all messages in a ticket
export const fetchTicketMessagesSeenStatus = async (ticketId, token) => {
  try {
    const response = await fetch(`${serverIP}api/tickets/${ticketId}/messages/seen-status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching messages seen status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching messages seen status:", error);
    throw error;
  }
};

// Mark multiple messages as seen (bulk operation)
export const markMultipleMessagesAsSeen = async (ticketId, messageIds, token) => {
  try {
    const response = await fetch(`${serverIP}api/tickets/${ticketId}/messages/mark-seen`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messageIds }),
    });

    if (!response.ok) {
      throw new Error(`Error marking messages as seen: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error marking messages as seen:", error);
    throw error;
  }
};

// Get unseen message count for current user
export const getUnseenMessageCount = async (ticketId, token) => {
  try {
    const response = await fetch(`${serverIP}api/tickets/${ticketId}/unseen-count`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching unseen count: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching unseen count:", error);
    throw error;
  }
};

export const fetchTicketMessages = async (ticketId, token) => {
  try {
    const response = await fetch(
      `${serverIP}api/tickets/${ticketId}/messages`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching messages: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

export const sendMessage = async (ticketId, messageObject, token, files = null) => {
  try {
    let body;
    let headers = {
      Authorization: `Bearer ${token}`,
    };

    if (files && files.length > 0) {
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append('message', messageObject.message);
      formData.append('sender', messageObject.sender);
      formData.append('sender_name', messageObject.sender_name);
      formData.append('sender_surname', messageObject.sender_surname);
      
      // Add files to FormData
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      body = formData;
      // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
    } else {
      // Use JSON for text-only messages
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(messageObject);
    }

    const response = await fetch(
      `${serverIP}api/tickets/${ticketId}/messages`,
      {
        method: "POST",
        headers,
        body,
      }
    );

    if (!response.ok) {
      throw new Error(`Error sending message: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const fetchTreeData = async (token) => {
  try {
    const response = await fetch(`${serverIP}api/tree-data`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch tree data");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching tree data:", error);
    throw error;
  }
};

export const fetchCountsTree = async (token) => {
  try {
    const response = await fetch(`${serverIP}api/counts`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch counts");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching counts:", error);
    throw error;
  }
};

// Events API helpers
export const createEvent = async (token, formData) => {
  try {
    const response = await fetch(`${serverIP}api/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create event");
    }

    return response.json();
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const fetchEvents = async (token, query = {}) => {
  try {
    const queryString = new URLSearchParams(query).toString();
    const url = `${serverIP}api/events${queryString ? `?${queryString}` : ""}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

export const fetchEventById = async (token, eventId) => {
  try {
    const response = await fetch(`${serverIP}api/events/${eventId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch event");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
};

export const updateEvent = async (token, eventId, formData) => {
  try {
    const response = await fetch(`${serverIP}api/events/${eventId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update event");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

export const deleteEvent = async (token, eventId) => {
  try {
    const response = await fetch(`${serverIP}api/events/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete event");
    }

    return response.json();
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

export const fetchDepartments = async (token) => {
  try {
    const response = await fetch(`${serverIP}api/departments`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch departments");
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch departments", error);
    throw error;
  }
};

export const createDepartment = async (name, description, token) => {
  try {
    const response = await fetch(`${serverIP}api/departments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) {
      throw new Error("Failed to create department");
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to create department", error);
    throw error;
  }
};

export const updateDepartment = async (id, name, description, token) => {
  try {
    const response = await fetch(`${serverIP}api/departments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) {
      throw new Error("Failed to update department");
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to update department", error);
    throw error;
  }
};

export const deleteDepartment = async (id, token) => {
  try {
    const response = await fetch(`${serverIP}api/departments/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to delete department");
    }
  } catch (error) {
    console.error("Failed to delete department", error);
    throw error;
  }
};

export const handleForwardToUsers = async (
  ticketId,
  userIds,
  token,
  setLoading
) => {
  if (!ticketId || !userIds.length) {
    alert("Please select a ticket and at least one user");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${serverIP}api/tickets/${ticketId}/forward`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipients: userIds }),
    });

    if (response.ok) {
      alert("Ticket forwarded successfully");
    } else {
      const errorData = await response.text();
      console.error("Failed to forward ticket:", response.status, errorData);
      alert("Failed to forward ticket");
    }
  } catch (error) {
    console.error("Error forwarding ticket", error);
    alert("Failed to forward ticket");
  } finally {
    setLoading(false);
  }
};

// Fetch all subjects or subjects by department
export const fetchSubjects = async (token, departmentId = null) => {
  try {
    let url = `${serverIP}api/subjects`;
    if (departmentId) {
      url += `?departmentId=${departmentId}`;
    }
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch subjects");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Create a new subject
export const createSubject = async (name, departmentId, token) => {
  try {
    const response = await fetch(`${serverIP}api/subjects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, departmentId }),
    });

    if (!response.ok) {
      throw new Error("Failed to create subject");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Update a subject by ID
export const updateSubject = async (id, name, token) => {
  try {
    const response = await fetch(`${serverIP}api/subjects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error("Failed to update subject");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to update subject", error);
    throw error;
  }
};

// Delete a subject by ID
export const deleteSubject = async (id, token) => {
  try {
    const response = await fetch(`${serverIP}api/subjects/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete subject");
    }

    // Optionally, return a success message
    return "Subject deleted successfully";
  } catch (error) {
    console.error(error);
    throw error; // Rethrow the error to handle it in the calling function
  }
};
