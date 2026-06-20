import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import pushManager, { 
  requestNotificationPermission, 
  subscribeToNotifications, 
  unsubscribeFromNotifications,
  getNotificationPermission,
  isNotificationSupported
} from '../utils/pushNotifications';

const NotificationSettings = ({ className = "" }) => {
  const { token, userId } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check initial status
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const permission = getNotificationPermission();
    setPermissionStatus(permission);

    if (permission === 'granted') {
      const subscribed = await pushManager.isSubscribed();
      setIsSubscribed(subscribed);
    }
  };

  const handleEnableNotifications = async (forceAttempt = false) => {
    if (!forceAttempt && !isNotificationSupported()) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Request permission
      setSuccess('Step 1: Requesting permission...');
      
      // Add a timeout to prevent hanging forever
      const permissionTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Permission request timeout')), 10000)
      );
      
      const permissionPromise = requestNotificationPermission(forceAttempt);
      
      const permission = await Promise.race([permissionPromise, permissionTimeout]);
      setPermissionStatus(permission);

      if (permission === 'granted') {
        // Step 2: Subscribe to push notifications
        setSuccess('Step 2: Setting up push subscription...');
        await subscribeToNotifications(token, userId);
        setIsSubscribed(true);
        setSuccess('✅ Notifications enabled successfully!');
      } else if (permission === 'denied') {
        setError('❌ Notification permission denied. Please enable in browser settings.');
      } else {
        setError('⚠️ Notification permission not granted.');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      
      // More detailed error messages for debugging
      let errorMessage = 'Failed to enable notifications. ';
      
      if (error.message.includes('Service Worker')) {
        errorMessage += 'Service Worker issue detected. ';
      } else if (error.message.includes('subscription')) {
        errorMessage += 'Push subscription failed. ';
      } else if (error.message.includes('VAPID')) {
        errorMessage += 'VAPID key issue. ';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage += 'Network connection issue. ';
      }
      
      errorMessage += `Error: ${error.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await unsubscribeFromNotifications(token, userId);
      setIsSubscribed(false);
      setSuccess('Notifications disabled successfully!');
    } catch (error) {
      console.error('Error disabling notifications:', error);
      setError('Failed to disable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (!isNotificationSupported()) {
      // Better messaging for different browsers and PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    window.navigator.standalone === true;
      
      let description = 'Your browser does not support push notifications';
      
      if (isIOS && isPWA) {
        description = 'PWA push notifications require iOS 16.4+. If you have iOS 16.4+, try the "Force Try" button below.';
      } else if (isIOS && isSafari) {
        description = 'Push notifications require iOS 16.4+ and Safari. Please update your iOS version if needed.';
      } else if (isIOS) {
        description = 'Push notifications are only supported in Safari on iOS devices.';
      }
      
      return {
        status: 'Not Supported',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        description: description
      };
    }

    switch (permissionStatus) {
      case 'granted':
        return {
          status: isSubscribed ? 'Enabled' : 'Permission Granted',
          color: 'text-green-700',
          bgColor: 'bg-green-100',
          description: isSubscribed 
            ? 'You will receive push notifications for new tickets and messages'
            : 'Permission granted but not subscribed to notifications'
        };
      case 'denied':
        return {
          status: 'Blocked',
          color: 'text-red-700',
          bgColor: 'bg-red-100',
          description: 'Notifications are blocked. Please enable them in your browser settings.'
        };
      default:
        return {
          status: 'Not Enabled',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-100',
          description: 'Click "Enable Notifications" to receive push notifications'
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Push Notifications
          </h3>
          
          {/* Status Badge */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color} mb-3`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isSubscribed && permissionStatus === 'granted' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            {statusInfo.status}
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            {statusInfo.description}
          </p>

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

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            {!isSubscribed && permissionStatus !== 'denied' && (
              <button
                onClick={handleEnableNotifications}
                disabled={loading || !isNotificationSupported()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
              >
                {loading ? 'Enabling...' : 'Enable Notifications'}
              </button>
            )}
            
            {/* Force try button for debugging */}
            {!isNotificationSupported() && (
              <button
                onClick={() => handleEnableNotifications(true)}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
              >
                {loading ? 'Trying...' : 'Force Try'}
              </button>
            )}
            
            {/* Skip permission button for iOS PWA */}
            {(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) && (
              <button
                onClick={() => {
                  const currentPermission = Notification.permission;
                  setPermissionStatus(currentPermission);
                  if (currentPermission === 'granted') {
                    setSuccess('✅ Permission already granted! Try subscribing directly.');
                    handleEnableNotifications(true);
                  } else {
                    setError(`Current permission status: ${currentPermission}. You may need to enable notifications in Safari first, then add to home screen.`);
                  }
                }}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
              >
                Check Status
              </button>
            )}

            {isSubscribed && (
              <button
                onClick={handleDisableNotifications}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
              >
                {loading ? 'Disabling...' : 'Disable Notifications'}
              </button>
            )}

            {permissionStatus === 'denied' && (
              <div className="text-sm text-gray-500">
                To enable notifications, please:
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Allow notifications for this site</li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Notification Icon */}
        <div className="ml-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusInfo.bgColor}`}>
            <svg
              className={`w-6 h-6 ${statusInfo.color}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Test Notification Button (for development) */}
      {isSubscribed && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => pushManager.showLocalNotification('Test Notification', {
              body: 'This is a test notification from SVRR | Tickets',
              tag: 'test'
            })}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Send Test Notification
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
