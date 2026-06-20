import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./auth";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ToastContainer from "./components/common/ToastContainer";
import { useToast } from "./hooks/useToast";

// Lazy load components for better performance
const LoginPage = React.lazy(() => import("./Routes/LoginPage"));
const AdminPage = React.lazy(() => import("./Routes/AdminPage"));
const UserPage = React.lazy(() => import("./Routes/UserPage"));
const AdminOverView = React.lazy(() => import("./components/admin/AdminOverView"));
const AdminReports = React.lazy(() => import("./components/admin/AdminReports"));
const AdminUsersPage = React.lazy(() => import("./components/admin/AdminUsersPage"));
const AdminMeetings = React.lazy(() => import("./components/admin/AdminMeetings"));
const AdminCategoriesPage = React.lazy(() => import("./components/admin/AdminCategoriesPage"));
const SettingsPage = React.lazy(() => import("./Routes/SettingsPage"));
const UserGuidePage = React.lazy(() => import("./Routes/UserGuidePage"));
const UserMeetingsPage = React.lazy(() => import("./Routes/UserMeetingsPage"));
const CalendarPage = React.lazy(() => import("./Routes/CalendarPage"));

const ProtectedRoute = ({ element, roles }) => {
  const { token, userRole } = useAuth();
  if (!token) {
    return <Navigate to="/" />;
  }
  if (roles && !roles.includes(userRole)) {
    return <Navigate to="/" />;
  }
  return element;
};

const AuthenticatedRoute = () => {
  const { token, userRole } = useAuth();
  
  // If user is already authenticated, redirect to their dashboard
  if (token && userRole) {
    if (userRole === "admin") {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/user" replace />;
    }
  }
  
  // If not authenticated, show login page
  return <LoginPage />;
};

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

const App = () => {
  const { toasts, removeToast } = useToast();

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<AuthenticatedRoute />} />
            <Route
              path="/admin"
              element={<ProtectedRoute element={<AdminPage />} roles={["admin"]} />}
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute element={<AdminUsersPage />} roles={["admin", "manager", "supervisor", "gm"]} />
              }
            />
            <Route
              path="/admin/overview"
              element={
                <ProtectedRoute element={<AdminOverView />} roles={["admin"]} />
              }
            />
            <Route
              path="/admin/meetings"
              element={
                <ProtectedRoute element={<AdminMeetings />} roles={["admin", "manager", "supervisor", "gm"]} />
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute element={<AdminReports />} roles={["admin"]} />
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute element={<AdminCategoriesPage />} roles={["admin"]} />
              }
            />

            <Route
              path="/user"
              element={<ProtectedRoute element={<UserPage />} roles={["user"]} />}
            />
            <Route
              path="/user/meetings"
              element={
                <ProtectedRoute element={<UserMeetingsPage />} roles={["user", "admin"]} />
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute element={<CalendarPage />} roles={["user", "admin", "manager", "supervisor", "gm"]} />
              }
            />
            
            {/* Settings routes for all user types */}
            <Route
              path="/settings"
              element={<ProtectedRoute element={<SettingsPage />} roles={["user", "admin", "manager", "supervisor", "gm"]} />}
            />
            <Route
              path="/settings/user-guide"
              element={<ProtectedRoute element={<UserGuidePage />} roles={["user", "admin", "manager", "supervisor", "gm"]} />}
            />
            
          </Routes>
        </Suspense>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </Router>
    </ErrorBoundary>
  );
};

export default App;
