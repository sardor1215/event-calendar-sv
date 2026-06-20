// Input validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export const validateEventData = (data) => {
  const errors = {};

  if (!data.title || data.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters long";
  }

  if (data.title && data.title.length > 255) {
    errors.title = "Title must be less than 255 characters";
  }

  if (!data.start_time) {
    errors.start_time = "Start time is required";
  }

  if (!data.end_time) {
    errors.end_time = "End time is required";
  }

  if (data.start_time && data.end_time) {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    
    if (start >= end) {
      errors.end_time = "End time must be after start time";
    }
  }

  if (data.description && data.description.length > 1000) {
    errors.description = "Description must be less than 1000 characters";
  }

  return errors;
};

export const validateUserData = (data) => {
  const errors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters long";
  }

  if (!data.surname || data.surname.trim().length < 2) {
    errors.surname = "Surname must be at least 2 characters long";
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (data.password && !validatePassword(data.password)) {
    errors.password = "Password must be at least 8 characters with uppercase, lowercase, and number";
  }

  return errors;
};

export const sanitizeEventData = (data) => {
  return {
    ...data,
    title: sanitizeInput(data.title || ''),
    description: sanitizeInput(data.description || ''),
    location: sanitizeInput(data.location || ''),
    event_number: sanitizeInput(data.event_number || ''),
    event_chair: sanitizeInput(data.event_chair || '')
  };
};

