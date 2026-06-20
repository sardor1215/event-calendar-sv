import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth';
import { serverIP } from '../api';
import IconNotification from './SVG/IconNotification';

const EmailNotificationSettings = ({ className = "" }) => {
  const { token, userId, userRole, userEmail } = useAuth();
  const [settings, setSettings] = useState({
    newTicketAssigned: true,
    ticketStatusChanged: true,
    newMessageReceived: true,
    ticketForwarded: true,
    ticketResolved: false,
    dailyDigest: false,
    weeklyReport: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  const fetchEmailSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${serverIP}api/email-settings/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(prevSettings => ({ ...prevSettings, ...data.settings }));
        }
      } else if (response.status !== 404) {
        // 404 is expected for new users, other errors should be handled
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load email settings');
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
      setError('Failed to load email settings');
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    // Only fetch settings if user is not admin
    if (userRole !== 'admin') {
      fetchEmailSettings();
    }
  }, [userRole, fetchEmailSettings]);

  // Don't show email settings for admin users
  if (userRole === 'admin') {
    return null;
  }

  const saveEmailSettings = async (newSettings) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${serverIP}api/email-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          settings: newSettings
        }),
      });

      if (response.ok) {
        setSuccess('Email notification settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (settingKey, value) => {
    const newSettings = { ...settings, [settingKey]: value };
    setSettings(newSettings);
    
    // Auto-save after a short delay
    setTimeout(() => {
      saveEmailSettings(newSettings);
    }, 500);
  };

  const handleTestEmail = async () => {
    if (!userEmail) {
      setError('No email address found for testing');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${serverIP}api/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail: userEmail
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('🧪 Test email sent successfully! Check your inbox.');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setError('Failed to send test email. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleManualTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setTestingEmail(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${serverIP}api/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail: testEmail
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`🧪 Test email sent successfully to ${testEmail}! Check your inbox.`);
        setShowTestModal(false);
        setTestEmail('');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setError('Failed to send test email. Please try again.');
    } finally {
      setTestingEmail(false);
    }
  };

  const notificationOptions = [
    {
      key: 'newTicketAssigned',
      title: 'When I Get a New Task',
      description: 'Email me when a new ticket is assigned to me',
      category: 'immediate'
    },
    {
      key: 'ticketStatusChanged',
      title: 'When Task Status Updates',
      description: 'Email me when my tickets change status (new → in progress → completed)',
      category: 'immediate'
    },
    {
      key: 'newMessageReceived',
      title: 'When Someone Messages Me',
      description: 'Email me when I receive new messages on my tickets',
      category: 'immediate'
    },
    {
      key: 'ticketForwarded',
      title: 'When Task is Shared with Me',
      description: 'Email me when someone forwards a ticket to me',
      category: 'immediate'
    },
    {
      key: 'ticketResolved',
      title: 'When My Request is Completed',
      description: 'Email me when tickets I created are marked as resolved',
      category: 'immediate'
    },
    {
      key: 'dailyDigest',
      title: 'Daily Summary Email',
      description: 'Send me a daily summary of all my ticket activities',
      category: 'digest'
    },
    {
      key: 'weeklyReport',
      title: 'Weekly Summary Email',
      description: 'Send me a weekly overview of my department\'s ticket activities',
      category: 'digest'
    }
  ];

  // Filter options based on user role
  const filteredOptions = notificationOptions.filter(option => {
    if (userRole === 'user') {
      // Users don't need certain manager-specific notifications
      return !['weeklyReport'].includes(option.key);
    }
    return true;
  });

  const immediateNotifications = filteredOptions.filter(opt => opt.category === 'immediate');
  const digestNotifications = filteredOptions.filter(opt => opt.category === 'digest');

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Email Notifications
          </h3>
          <p className="text-gray-600 text-sm">
            Choose which email notifications you'd like to receive. Changes are saved automatically.
          </p>
          {userEmail && (
            <p className="text-blue-600 text-sm mt-1">
              📧 Notifications will be sent to: <span className="font-medium">{userEmail}</span>
            </p>
          )}
        </div>

        {/* Email Icon */}
        <div className="ml-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <IconNotification className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Immediate Notifications */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          Send Me Emails Right Away When...
        </h4>
        <div className="space-y-3">
          {immediateNotifications.map((option) => (
            <div key={option.key} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 mr-4">
                <h5 className="text-sm font-medium text-gray-900 mb-1">
                  {option.title}
                </h5>
                <p className="text-xs text-gray-600">
                  {option.description}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings[option.key]}
                  onChange={(e) => handleSettingChange(option.key, e.target.checked)}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Digest Notifications */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Send Me Summary Emails
        </h4>
        <div className="space-y-3">
          {digestNotifications.map((option) => (
            <div key={option.key} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 mr-4">
                <h5 className="text-sm font-medium text-gray-900 mb-1">
                  {option.title}
                </h5>
                <p className="text-xs text-gray-600">
                  {option.description}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings[option.key]}
                  onChange={(e) => handleSettingChange(option.key, e.target.checked)}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Saving Indicator */}
      {saving && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Saving settings...
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex gap-3">
          <button
            onClick={() => {
              const allOn = { ...settings };
              immediateNotifications.forEach(opt => allOn[opt.key] = true);
              setSettings(allOn);
              saveEmailSettings(allOn);
            }}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Turn On All Instant Emails
          </button>
                     <button
             onClick={() => {
               const allOff = { ...settings };
               immediateNotifications.forEach(opt => allOff[opt.key] = false);
               digestNotifications.forEach(opt => allOff[opt.key] = false);
               setSettings(allOff);
               saveEmailSettings(allOff);
             }}
             disabled={saving}
             className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
           >
             Turn Off All Emails
           </button>
           <button
             onClick={() => setShowTestModal(true)}
             disabled={saving}
             className="px-3 py-1.5 text-xs font-medium text-green-600 border border-green-600 rounded-md hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
           >
             🧪 Test Email Service
           </button>
                 </div>
       </div>

       {/* Test Email Modal */}
       {showTestModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">
               🧪 Test Email Service
             </h3>
             
             <div className="mb-4">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Send test email to:
               </label>
               <input
                 type="email"
                 value={testEmail}
                 onChange={(e) => setTestEmail(e.target.value)}
                 placeholder="Enter email address (e.g., sardorbtc@gmail.com)"
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
             </div>

             <div className="flex gap-3">
               <button
                 onClick={handleManualTestEmail}
                 disabled={testingEmail}
                 className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
               >
                 {testingEmail ? 'Sending...' : 'Send Test Email'}
               </button>
               <button
                 onClick={() => {
                   setShowTestModal(false);
                   setTestEmail('');
                   setError('');
                 }}
                 className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200"
               >
                 Cancel
               </button>
             </div>

             {error && (
               <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                 <p className="text-red-700 text-sm">{error}</p>
               </div>
             )}
           </div>
         </div>
       )}
     </div>
   );
 };

export default EmailNotificationSettings;
