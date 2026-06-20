import React from "react";
import IconClose from "../components/SVG/IconClose";

const Modal = ({ title, onClose, show, children, onSubmit, size = "lg" }) => {
  if (!show) {
    return null;
  }

  const sizeClass =
    size === "sm"
      ? "sm:max-w-sm"
      : size === "md"
      ? "sm:max-w-md"
      : size === "xl"
      ? "sm:max-w-xl"
      : "sm:max-w-lg"; // default lg

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <span
          className="hidden sm:inline-block sm:h-screen sm:align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className={`relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full ${sizeClass} sm:align-middle`}>
          <div className="bg-white px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 hover:bg-gray-100 focus:outline-none"
              >
                <IconClose className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="mt-3">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
