import React, { useState } from "react";
import { useAuth } from "../auth";
import { useNavigate, useLocation } from "react-router-dom";
import IconCalendar from "./SVG/IconCalendar";
import IconLogout from "./SVG/IconLogout";
import IconPerson from "./SVG/IconPerson";
import IconUsersOutline from "./SVG/IconUsersOutline";
import LocationManagementModal from "./admin/LocationManagementModal";
import DepartmentManagementModal from "./admin/DepartmentManagementModal";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { userRole, userName, userSurname, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  React.useEffect(() => { setShowMobileMenu(false); }, [location.pathname]);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const navLinkClass = (path) =>
    `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
      isActive(path)
        ? "bg-yellow-400 text-gray-900 shadow-sm"
        : "text-gray-600 hover:bg-yellow-50 hover:text-gray-900"
    }`;

  return (
    <>
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-display">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex-shrink-0">
              <img
                src="/sunvalley-logo.png"
                className="h-20 w-auto cursor-pointer"
                alt="Sun Valley Cyprus"
                onClick={() => navigate(userRole === "admin" ? "/calendar" : "/user/events")}
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">

              {/* User avatar */}
              {(userName || userSurname) && (
                <div className="flex items-center space-x-2 mr-3 pl-2 pr-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                  <div className="h-7 w-7 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center text-xs font-bold">
                    {`${(userName || '').charAt(0)}${(userSurname || '').charAt(0)}`.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {userName || ''} {userSurname || ''}
                  </span>
                </div>
              )}

              {userRole === "admin" && (
                <button
                  onClick={() => navigate("/admin/users")}
                  className={navLinkClass('/admin/users')}
                  title="Manage Users"
                >
                  <IconUsersOutline className="h-4 w-4" />
                  <span>Users</span>
                </button>
              )}

              {userRole === "admin" && (
                <button
                  onClick={() => setShowDepartmentModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-yellow-50 hover:text-gray-900 transition-all duration-200"
                  title="Manage Departments"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Departments</span>
                </button>
              )}

              {userRole === "admin" && (
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-yellow-50 hover:text-gray-900 transition-all duration-200"
                  title="Manage Locations"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Locations</span>
                </button>
              )}

              <button
                onClick={() => navigate("/calendar")}
                className={navLinkClass('/calendar')}
                title="Calendar"
              >
                <IconCalendar className="h-4 w-4" />
                <span>Calendar</span>
              </button>

              <NotificationBell />

              <div className="w-px h-5 bg-gray-200 mx-1" />

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                title="Logout"
              >
                <IconLogout className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-center space-x-2">
              <NotificationBell />
              {(userName || userSurname) && (
                <div className="h-8 w-8 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center text-xs font-bold border-2 border-yellow-300">
                  {`${(userName || '').charAt(0)}${(userSurname || '').charAt(0)}`.toUpperCase()}
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 text-gray-600 hover:bg-yellow-50 hover:text-gray-900 rounded-lg transition-colors"
                  title="Menu"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showMobileMenu
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    }
                  </svg>
                </button>

                {showMobileMenu && (
                  <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100">
                    {/* User info */}
                    {(userName || userSurname) && (
                      <div className="px-4 py-3 border-b border-gray-100 mb-1">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center text-xs font-bold">
                            {`${(userName || '').charAt(0)}${(userSurname || '').charAt(0)}`.toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-gray-800 truncate">
                            {userName || ''} {userSurname || ''}
                          </span>
                        </div>
                      </div>
                    )}

                    {userRole === "admin" && (
                      <button
                        onClick={() => { navigate("/admin/users"); setShowMobileMenu(false); }}
                        className={`flex items-center w-full px-4 py-2.5 text-sm font-medium transition-colors ${isActive('/admin/users') ? 'bg-yellow-50 text-yellow-700' : 'text-gray-700 hover:bg-yellow-50 hover:text-gray-900'}`}
                      >
                        <IconUsersOutline className="h-4 w-4 mr-3 text-gray-500" />
                        Users
                      </button>
                    )}

                    {userRole === "admin" && (
                      <button
                        onClick={() => { setShowDepartmentModal(true); setShowMobileMenu(false); }}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-yellow-50 hover:text-gray-900 transition-colors"
                      >
                        <svg className="h-4 w-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Departments
                      </button>
                    )}

                    {userRole === "admin" && (
                      <button
                        onClick={() => { setShowLocationModal(true); setShowMobileMenu(false); }}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-yellow-50 hover:text-gray-900 transition-colors"
                      >
                        <svg className="h-4 w-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Locations
                      </button>
                    )}

                    <button
                      onClick={() => { navigate("/calendar"); setShowMobileMenu(false); }}
                      className={`flex items-center w-full px-4 py-2.5 text-sm font-medium transition-colors ${isActive('/calendar') ? 'bg-yellow-50 text-yellow-700' : 'text-gray-700 hover:bg-yellow-50 hover:text-gray-900'}`}
                    >
                      <IconCalendar className="h-4 w-4 mr-3 text-gray-500" />
                      Calendar
                    </button>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <IconLogout className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </nav>

      <LocationManagementModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} />
      <DepartmentManagementModal isOpen={showDepartmentModal} onClose={() => setShowDepartmentModal(false)} />
    </>
  );
}
