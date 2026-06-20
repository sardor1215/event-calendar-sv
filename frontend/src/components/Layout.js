import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children, title, subtitle, actions }) => {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />
      
      <main className="min-h-screen overflow-x-hidden pb-20 lg:pb-0">
        {/* Page header */}
        {(title || subtitle || actions) && (
          <div className="bg-white border-b-2 border-yellow-400">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="mt-0.5 text-sm text-gray-500">
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="flex flex-wrap gap-2">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Page content */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;






