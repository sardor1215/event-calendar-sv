import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import IconPerson from "../SVG/IconPerson";
import IconUnits from "../SVG/IconUnits";
import IconUsers from "../SVG/IconUsers";
import { fetchCountsTree, fetchTreeData, serverIP } from "../../api";
import { createTree } from "../../tools/createTree";
import { useAuth } from "../../auth";
import ProgressBar from "../../tools/ProgressBar";
import Layout from "../Layout";
import ModernOrgChart from "../ModernOrgChart";

const AdminOverView = () => {
  const [data, setData] = useState(null);
  const svgRef = useRef();
  const [departmentCount, setDepartmentCount] = useState(0);
  const [managerCount, setManagerCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [eventStats, setEventStats] = useState({ total: 0, upcoming: 0, thisMonth: 0 });
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [treeResult, countsResult] = await Promise.all([
          fetchTreeData(token),
          fetchCountsTree(token),
        ]);
        setData(treeResult);
        setDepartmentCount(countsResult.departmentCount);
        setManagerCount(countsResult.managerCount);
        setUserCount(countsResult.userCount);

        // Fetch event stats
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const headers = { Authorization: `Bearer ${token}` };
        const [totalRes, upcomingRes, monthRes] = await Promise.all([
          fetch(`${serverIP}api/events?limit=1`, { headers }),
          fetch(`${serverIP}api/events?limit=1&from=${now.toISOString()}`, { headers }),
          fetch(`${serverIP}api/events?limit=1&from=${monthStart}&to=${monthEnd}`, { headers }),
        ]);

        const [totalData, upcomingData, monthData] = await Promise.all([
          totalRes.json(), upcomingRes.json(), monthRes.json()
        ]);

        setEventStats({
          total: totalData.pagination?.total || 0,
          upcoming: upcomingData.pagination?.total || 0,
          thisMonth: monthData.pagination?.total || 0,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    createTree(svgRef, data);
  }, [data]);

  return (
    <Layout
      title="System Overview"
      subtitle="Comprehensive view of departments, users, and organizational structure"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/calendar"
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Calendar
          </Link>
          <Link
            to="/admin/users"
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Users
          </Link>
          <Link
            to="/admin/events"
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Events
          </Link>
        </div>
      }
    >
      {loading && <ProgressBar />}

      {/* Event Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Link to="/admin/events" className="bg-white rounded-xl border border-yellow-200 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{eventStats.total}</p>
            <p className="text-xs text-gray-600">Total Events</p>
          </div>
        </Link>
        <Link to="/admin/events" className="bg-white rounded-xl border border-green-200 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-700">{eventStats.upcoming}</p>
            <p className="text-xs text-gray-600">Upcoming Events</p>
          </div>
        </Link>
        <Link to="/admin/events" className="bg-white rounded-xl border border-blue-200 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">{eventStats.thisMonth}</p>
            <p className="text-xs text-gray-600">Events This Month</p>
          </div>
        </Link>
      </div>

      {/* Compact Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card-gradient p-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <IconUnits className="w-5 h-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-900">Departments</h3>
              </div>
              <p className="text-2xl font-bold text-primary-700">{departmentCount}</p>
              <p className="text-xs text-gray-600 mt-0.5">Active departments</p>
            </div>
            <div className="p-2.5 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex-shrink-0">
              <IconUnits className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card-gradient p-4 animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <IconUsers className="w-5 h-5 text-success-600" />
                <h3 className="text-sm font-semibold text-gray-900">Managers</h3>
              </div>
              <p className="text-2xl font-bold text-success-700">{managerCount}</p>
              <p className="text-xs text-gray-600 mt-0.5">Department managers</p>
            </div>
            <div className="p-2.5 bg-gradient-to-br from-success-100 to-success-200 rounded-xl flex-shrink-0">
              <IconUsers className="w-8 h-8 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card-gradient p-4 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <IconPerson className="w-5 h-5 text-warning-600" />
                <h3 className="text-sm font-semibold text-gray-900">Users</h3>
              </div>
              <p className="text-2xl font-bold text-warning-700">{userCount}</p>
              <p className="text-xs text-gray-600 mt-0.5">Registered users</p>
            </div>
            <div className="p-2.5 bg-gradient-to-br from-warning-100 to-warning-200 rounded-xl flex-shrink-0">
              <IconPerson className="w-8 h-8 text-warning-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Organization Chart */}
      <ModernOrgChart />

      {/* Compact Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <div className="card interactive-card cursor-pointer hover:scale-105 transition-transform duration-200" onClick={() => window.location.href = '/admin/events'}>
          <div className="card-body text-center p-4">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">All Events</h3>
            <p className="text-xs text-gray-600">View and manage all events</p>
          </div>
        </div>

        <div className="card interactive-card cursor-pointer hover:scale-105 transition-transform duration-200" onClick={() => window.location.href = '/admin/users'}>
          <div className="card-body text-center p-4">
            <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center mx-auto mb-2">
              <IconUsers className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">User Management</h3>
            <p className="text-xs text-gray-600">Manage users and permissions</p>
          </div>
        </div>

        <div className="card interactive-card cursor-pointer hover:scale-105 transition-transform duration-200" onClick={() => window.location.href = '/admin/reports'}>
          <div className="card-body text-center p-4">
            <div className="w-10 h-10 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Reports</h3>
            <p className="text-xs text-gray-600">View analytics and reports</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminOverView;
