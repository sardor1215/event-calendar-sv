import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import Layout from '../components/Layout';

const UserGuidePage = () => {
  const { userRole } = useAuth();
  
  return (
    <Layout 
      title="User Guide" 
      subtitle="Read the application user manual"
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
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">User Manual</h3>
            <div className="flex items-center space-x-3">
              <a
                href="/user-manual.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Open PDF in new tab
              </a>
            </div>
          </div>

          <div className="aspect-[1/1.414] w-full" style={{ minHeight: '70vh' }}>
            <iframe
              title="User Manual"
              src="/user-manual.pdf"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserGuidePage;


