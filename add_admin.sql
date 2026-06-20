-- SQL Script to Add Admin User
-- Run this script in your PostgreSQL database

-- First, let's create a sample department if it doesn't exist
INSERT INTO departments (name, description) 
VALUES ('Administration', 'Administrative Department') 
ON CONFLICT (name) DO NOTHING;

-- Admin user doesn't need a department (department = NULL)

-- Add admin user
-- Password: 'admin123' (hashed with bcrypt)
-- You can change the password by generating a new hash
INSERT INTO users (name, surname, username, role, department, email, password) 
VALUES (
    'Admin', 
    'User', 
    'admin', 
    'admin', 
    NULL, -- Admin doesn't need a department
    'admin@meetingpoint.com', -- Change this to your admin email
    '$2a$10$6rCahpL./2qFcvV89F2AOOQqZ/3xKD70W8F2Avbdkrsoam11zWcay' -- This is 'admin123' hashed
) 
ON CONFLICT (username) DO NOTHING;

-- Verify the admin user was created
SELECT id, name, surname, username, role, email, registered_date 
FROM users 
WHERE username = 'admin';

-- Optional: Create a regular user for testing
INSERT INTO users (name, surname, username, role, department, email, password) 
VALUES (
    'Test', 
    'User', 
    'testuser', 
    'user', 
    1, -- Department ID
    'test@meetingpoint.com', -- Change this to your test user email
    '$2a$10$6rCahpL./2qFcvV89F2AOOQqZ/3xKD70W8F2Avbdkrsoam11zWcay' -- This is 'admin123' hashed
) 
ON CONFLICT (username) DO NOTHING;

-- Show all users
SELECT id, name, surname, username, role, email, registered_date 
FROM users 
ORDER BY id;
