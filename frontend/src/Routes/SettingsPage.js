import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth';
import Layout from '../components/Layout';
import EmailNotificationSettings from '../components/EmailNotificationSettings';
import IconLogout from '../components/SVG/IconLogout';
import { serverIP } from '../api';

const SettingsPage = () => {
  const { logout: authLogout, userName, userSurname, userRole, userEmail, userId, token } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const navigate = useNavigate();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch(`${serverIP}api/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: passwordForm.current_password, new_password: passwordForm.new_password })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully' });
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setPasswordMsg({ type: 'error', text: data.message || 'Failed to change password' });
      }
    } catch (err) {
      setPasswordMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    authLogout();
    navigate("/");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <Layout 
      title="Settings" 
      subtitle={
        userRole === 'admin' ? "Administrator account settings" 
        : userRole === 'supervisor' ? "Supervisor account settings"
        : "Manage your account preferences"
      }
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/calendar"
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Calendar
          </Link>
          {["admin", "manager", "supervisor", "gm"].includes(userRole) && (
            <Link
              to="/admin/users"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Users
            </Link>
          )}
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Only show email notification settings for non-admin users */}
        {userRole !== 'admin' && (
          <>
            {/* Email Notification Settings Section */}
            <EmailNotificationSettings />
          </>
        )}
        
        {/* Account Management Section - Always visible */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Account Management
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {userName} {userSurname}
                </p>
                <p className="text-sm text-gray-500">
                  {userRole === 'admin' ? 'System Administrator' : 'Current user'}
                </p>
                {userEmail && (
                  <p className="text-sm text-blue-600 mt-1">
                    📧 {userEmail}
                  </p>
                )}
              </div>
            </div>
            
            {/* Password Change */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Change Password</h4>
              {passwordMsg && (
                <div className={`mb-3 px-4 py-2 rounded-lg text-sm ${passwordMsg.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                  {passwordMsg.text}
                </div>
              )}
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <input
                  type="password"
                  placeholder="Current password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm(p => ({ ...p, current_password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
                <input
                  type="password"
                  placeholder="New password (min. 6 characters)"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm(p => ({ ...p, confirm_password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 transition-colors text-sm"
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                <h4 className="text-sm font-semibold text-red-800 mb-2">Sign Out</h4>
                <p className="text-xs text-red-600 mb-4">
                  {userRole === 'admin' 
                    ? "Sign out of your administrator account. You will be redirected to the login page."
                    : "Click the button below to securely sign out of your account. You will be redirected to the login page."
                  }
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <IconLogout className="w-4 h-4 mr-2" />
                  Sign Out of Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <IconLogout className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Sign Out
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to sign out of your account?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelLogout}
                  className="btn-secondary flex-1 touch-target"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="btn-error flex-1 touch-target"
                >
                  <IconLogout className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SettingsPage;
