import React, { useState, useEffect } from "react";
import { IconRefresh } from "../SVG/svg";

export const RefreshButton = ({ onClick, loading }) => {
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date()); // Initialize with current time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    onClick();
    setLastUpdateTime(new Date());
  };

  const formatLastUpdate = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex items-center space-x-3">
      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
        Last updated: {formatLastUpdate(lastUpdateTime)}
      </span>
      <button
        className="flex items-center space-x-2 text-black p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors duration-300 active:bg-gray-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleClick}
        disabled={loading}
        title={`Last updated: ${formatLastUpdate(lastUpdateTime)}`}
      >
        <IconRefresh className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
