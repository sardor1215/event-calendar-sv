import React, { useEffect, useState } from "react";

const Alert = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const alertStyles = {
    success: " border-l-4  border-green-500 text-green-800",
    error: " border-l-4 border-red-500 text-red-800",
    info: " border-l-4 border-blue-500 text-blue-800",
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 200);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-10 px-4 py-3 transition-opacity duration-300 ${
        alertStyles[type]
      } ${fadeOut ? "opacity-0" : "opacity-100"}`}
      role="alert"
    >
      <div className="flex items-center bg-white border rounded-md shadow-lg w-full max-w-md">
        <div className="py-2 px-3">
          {/* Icon based on alert type */}
          <svg
            className={`fill-current h-6 w-6 ${
              type === "error"
                ? "text-red-500"
                : type === "success"
                ? "text-green-500"
                : "text-blue-500"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            {type === "error" && (
              <path d="M10 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8zm0 14a6 6 0 1 0-6-6 6 6 0 0 0 6 6zM9 9h2v2H9V9zm0 4h2v2H9v-2z" />
            )}
            {type === "success" && (
              <path d="M10 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8zm0 14a6 6 0 1 0-6-6 6 6 0 0 0 6 6zM8 12l4-4-1.4-1.4L8 9.2l-1.6-1.6L5 8l3 3z" />
            )}
            {type === "info" && (
              <path d="M10 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8zm0 14a6 6 0 1 0-6-6 6 6 0 0 0 6 6zM9 7h2v2H9V7zm0 4h2v2H9v-2z" />
            )}
          </svg>
        </div>
        <div className="flex-1 p-2">
          <p className="font-semibold text-lg">
            {type === "error"
              ? "Error:"
              : type === "success"
              ? "Success:"
              : "Info:"}
          </p>
          <p className="text-sm">{message}</p>
        </div>
        <button
          className="p-2 text-gray-600 hover:text-gray-800"
          onClick={() => {
            setFadeOut(true);
            setTimeout(() => {
              setIsVisible(false);
              onClose();
            }, 200);
          }}
          aria-label="Close alert"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path
              fill="currentColor"
              d="M10 9l-4.5 4.5L5 15l5-5-5-5 1.5-1.5L10 7l4.5-4.5L15 5l-5 5z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Alert;
