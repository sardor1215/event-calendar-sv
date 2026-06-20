
import React, { useState } from 'react';

export const formatDate = (dateString) => {
  if (!dateString) return "No date";
  
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }
  
  // Display time without timezone conversion - show exact database time
  return date.toLocaleString("en-GB", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const ImageWithPlaceholder = ({ src, alt, onClick }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-10 h-10 cursor-pointer" onClick={onClick}>
      <img
        src={src}
        alt={alt}
        className="w-10 h-10 object-cover rounded"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.error(`Failed to load image: ${src}`);
          setIsLoading(false);
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded z-10">
          <svg
            className="w-6 h-6 text-gray-400 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
          </svg>
        </div>
      )}
    </div>
  );
};
export const deleteUser = async (userId, serverIP, token, fetchUsers) => {
  try {
    const response = await fetch(`${serverIP}api/users/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) {
      if (fetchUsers) {
        await fetchUsers();
      }
      return { success: true };
    } else {
      const errorData = await response.json();
      console.error("Error deleting user:", errorData);
      throw new Error(errorData.message || "Failed to delete user");
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
export const editUser = async (
  e,
  serverIP,
  token,
  editingUser,
  editUserData,
  fetchUsers,
  setEditingUser,
  setEditUser
) => {
  if (e) e.preventDefault();
  try {
    
    const response = await fetch(`${serverIP}api/users/${editingUser.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editUserData),
    });
    
    if (response.ok) {
      await fetchUsers();
      setEditingUser(null);
      setEditUser({
        username: "",
        name: "",
        surname: "",
        role: "",
        department: "",
        email: "",
        password: "",
      });
      alert('User updated successfully!');
    } else {
      const errorData = await response.json();
      console.error("Error editing user:", errorData);
      alert(`Error editing user: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error("Error:", error);
    alert(`Error editing user: ${error.message}`);
  }
};
export const addUserAdmin = async (
  e,
  serverIP,
  token,
  newUser,
  fetchUsers,
  setNewUser,
  setUserAddPart
) => {
  e.preventDefault();
  try {
    const response = await fetch(`${serverIP}api/addUser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newUser),
    });
    if (response.ok) {
      fetchUsers();
      setNewUser({
        username: "",
        name: "",
        surname: "",
        role: "",
        department: "",
        email: "",
        password: "",
      });
      setUserAddPart(false);
    } else {
      alert("Error adding user:", await response.json());
    }
  } catch (error) {
    alert("Error:", error);
  }
};
