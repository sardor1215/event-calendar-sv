import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage/sessionStorage if available
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || sessionStorage.getItem("token")
  );
  const [userRole, setUserRole] = useState(
    () => localStorage.getItem("userRole") || sessionStorage.getItem("userRole")
  );
  const [userId, setUserId] = useState(
    () => localStorage.getItem("userId") || sessionStorage.getItem("userId")
  );
  const [userName, setUserName] = useState(
    () => localStorage.getItem("userName") || sessionStorage.getItem("userName")
  );
  const [userDepartment, setUserDepartment] = useState(
    () =>
      localStorage.getItem("userDepartment") ||
      sessionStorage.getItem("userDepartment")
  );
  const [userSurname, setUserSurname] = useState(
    () =>
      localStorage.getItem("userSurname") ||
      sessionStorage.getItem("userSurname")
  );
  const [userEmail, setUserEmail] = useState(
    () =>
      localStorage.getItem("userEmail") ||
      sessionStorage.getItem("userEmail")
  );

  // Removed push notification setup - not needed for event app

  // Function to store authentication data in storage
  const saveAuthData = (
    token,
    userRole,
    userId,
    userName,
    userDepartment,
    userSurname,
    userEmail,
    rememberMe
  ) => {
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem("token", token);
    storage.setItem("userRole", userRole);
    storage.setItem("userId", userId);
    storage.setItem("userName", userName);
    storage.setItem("userDepartment", userDepartment);
    storage.setItem("userSurname", userSurname);
    storage.setItem("userEmail", userEmail);

    setToken(token);
    setUserRole(userRole);
    setUserId(userId);
    setUserName(userName);
    setUserDepartment(userDepartment);
    setUserSurname(userSurname);
    setUserEmail(userEmail);
  };

  // Function to log out and clear data
  const logout = () => {
    setToken(null);
    setUserRole(null);
    setUserId(null);
    setUserName(null);
    setUserDepartment(null);
    setUserSurname(null);
    setUserEmail(null);

    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        userRole,
        setUserRole,
        userId,
        setUserId,
        userName,
        setUserName,
        userDepartment,
        setUserDepartment,
        userSurname,
        setUserSurname,
        userEmail,
        setUserEmail,
        saveAuthData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
