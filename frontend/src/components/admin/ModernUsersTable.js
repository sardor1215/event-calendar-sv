import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../auth";
import { formatDate } from "../../tools/Tools";
import IconEdit from "../SVG/IconEdit";
import IconDelete from "../SVG/IconDelete";
import IconUsers from "../SVG/IconUsers";

// Print styles for better print formatting
const printStyles = `
@media print {
  body * {
    visibility: hidden;
  }
  .print-area, .print-area * {
    visibility: visible;
  }
  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .no-print {
    display: none !important;
  }
  .print-header {
    margin-bottom: 20px;
    border-bottom: 2px solid #000;
    padding-bottom: 10px;
  }
  .print-table {
    width: 100%;
    border-collapse: collapse;
  }
  .print-table th, .print-table td {
    border: 1px solid #000;
    padding: 8px;
    text-align: left;
    font-size: 12px;
  }
  .print-table th {
    background-color: #f0f0f0 !important;
    font-weight: bold;
  }
  @page {
    margin: 0.5in;
    size: landscape;
  }
}
`;

const ModernUsersTable = ({
  users = [],
  onEditUser,
  onDeleteUser,
  onSelectUsers,
  onViewProfile,
  selectedUsers = [],
  usersPerPage = 15,
  role,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const { token } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'cards' or 'table'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pageSize, setPageSize] = useState(usersPerPage);
  const [globalSearch, setGlobalSearch] = useState('');
  const [filters, setFilters] = useState({
    username: "",
    name: "",
    surname: "",
    role: "",
    department: "",
    email: "",
  });

  // Ensure users is an array before processing
  const usersArray = Array.isArray(users) ? users : [];
  
  const sortedUsers = useMemo(() => {
    if (!sortConfig.key) return usersArray;
    
    return [...usersArray].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (sortConfig.direction === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });
  }, [usersArray, sortConfig]);

  // Optimized filtering with useMemo
  const filteredUsers = useMemo(() => {
    return sortedUsers.filter((user) => {
      // Global search across multiple fields
      const globalMatch = globalSearch === "" ||
        user.username.toLowerCase().includes(globalSearch.toLowerCase()) ||
        user.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        user.surname.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
        user.role.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (user.department || "").toLowerCase().includes(globalSearch.toLowerCase());

      // Individual column filters
      const columnFilters = (
        (filters.username === "" || user.username.toLowerCase().includes(filters.username.toLowerCase())) &&
        (filters.name === "" || user.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (filters.surname === "" || user.surname.toLowerCase().includes(filters.surname.toLowerCase())) &&
        (filters.role === "" || user.role.toLowerCase().includes(filters.role.toLowerCase())) &&
        (filters.department === "" || (user.department || "").toLowerCase().includes(filters.department.toLowerCase())) &&
        (filters.email === "" || (user.email || "").toLowerCase().includes(filters.email.toLowerCase()))
      );

      return globalMatch && columnFilters;
    });
  }, [sortedUsers, filters, globalSearch]);


  const indexOfLastUser = currentPage * pageSize;
  const indexOfFirstUser = indexOfLastUser - pageSize;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const handleSort = useCallback(
    (key) => {
      let direction = "asc";
      if (sortConfig.key === key && sortConfig.direction === "asc") {
        direction = "desc";
      }
      setSortConfig({ key, direction });
    },
    [sortConfig]
  );

  const handleFilterChange = (e, key) => {
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));
    setCurrentPage(1);
  };

  // Bulk selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectUsers(currentUsers.map(user => user.id));
    } else {
      onSelectUsers([]);
    }
  };

  const handleSelectUser = (userId, checked) => {
    if (checked) {
      onSelectUsers([...selectedUsers, userId]);
    } else {
      onSelectUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const isAllSelected = currentUsers.length > 0 && currentUsers.every(user => selectedUsers.includes(user.id));
  const isIndeterminate = selectedUsers.length > 0 && selectedUsers.length < currentUsers.length;

  // Export functionality (Excel + PDF)
  const exportToExcel = () => {
    const headers = ["Username", "Name", "Surname", "Role", "Department", "Email", "Created At"];
    const rows = filteredUsers.map(user => [
      user.username,
      user.name,
      user.surname,
      user.role,
      user.department,
      user.email,
      formatDate(user.registered_date)
    ]);

    const tsvContent = [headers, ...rows].map(r => r.join('\t')).join('\n');
    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Print functionality
  const handlePrint = () => {
    const dataToExport = filteredUsers;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Users Report</title>
          <style>${printStyles}</style>
        </head>
        <body>
          <div class="print-area">
            <div class="print-header">
              <h1>Users Report</h1>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
              <p>Total Users: ${dataToExport.length}</p>
            </div>
            <table class="print-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Surname</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                ${dataToExport.map(user => `
                  <tr>
                    <td>${user.username}</td>
                    <td>${user.name}</td>
                    <td>${user.surname}</td>
                    <td>${user.role}</td>
                    <td>${user.department}</td>
                    <td>${user.email}</td>
                    <td>${formatDate(user.registered_date)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };



  return (
    <div className="space-y-6">

      {/* Search and Controls */}
      <div className="card">
  <div className="card-body">
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="flex-1">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users by name, email, role, or department..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            showAdvancedFilters 
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
          Filters
        </button>
        
        <button 
          onClick={exportToExcel} 
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Excel
        </button>
        
        <button 
          onClick={handlePrint} 
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Export PDF
        </button>
      </div>
    </div>

    {/* Advanced Filters */}
    {showAdvancedFilters && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg animate-slide-down">
        <input
          type="text"
          placeholder="Filter by username..."
          value={filters.username}
          onChange={(e) => handleFilterChange(e, 'username')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Filter by name..."
          value={filters.name}
          onChange={(e) => handleFilterChange(e, 'name')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Filter by surname..."
          value={filters.surname}
          onChange={(e) => handleFilterChange(e, 'surname')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
        />
        <select
          value={filters.role}
          onChange={(e) => handleFilterChange(e, 'role')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select>
        <input
          type="text"
          placeholder="Filter by department..."
          value={filters.department}
          onChange={(e) => handleFilterChange(e, 'department')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Filter by email..."
          value={filters.email}
          onChange={(e) => handleFilterChange(e, 'email')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
        />
      </div>
    )}
  </div>
</div>

      {/* Users Table */}
      <div className="card">
  <div className="card-body p-0">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            {onSelectUsers && (
              <th className="px-3 py-1.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                />
              </th>
            )}
            {[
              { key: 'username', label: 'Username', mobile: true },
              { key: 'name', label: 'Name', mobile: true },
              { key: 'surname', label: 'Surname', mobile: false },
              { key: 'role', label: 'Role', mobile: true },
              { key: 'department', label: 'Department', mobile: true },
              { key: 'email', label: 'Email', mobile: false },
              { key: 'registered_date', label: 'Created At', mobile: false },
              { key: 'last_login', label: 'Last Login', mobile: false },
            ].map((column) => (
              <th
                key={column.key}
                className={`px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${column.mobile ? '' : 'hidden sm:table-cell'}`}
                onClick={() => handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {sortConfig.key === column.key && (
                    <svg
                      className={`w-3 h-3 ${
                        sortConfig.direction === 'asc' ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </th>
            ))}
            <th className="px-3 py-1.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentUsers.length === 0 ? (
            <tr>
              <td colSpan="9" className="px-6 py-8 text-center">
                <div className="flex flex-col items-center">
                  <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h3 className="text-base font-medium text-gray-900 mb-1">No users found</h3>
                  <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              </td>
            </tr>
          ) : (
            currentUsers.map((user, index) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {onSelectUsers && (
                  <td className="px-3 py-1.5 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                      className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                    />
                  </td>
                )}
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-6 w-6">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-2">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">{user.surname}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'manager' ? 'bg-orange-100 text-orange-800' :
                    user.role === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'gm' ? 'bg-red-100 text-red-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'gm' ? 'General Manager' : user.role === 'supervisor' ? 'Supervisor' : user.role}
                  </span>
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                  {(user.role === 'supervisor' || user.role === 'gm') ? (
                    <span className="text-gray-500 italic">N/A</span>
                  ) : (
                    user.department || <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">{user.email}</td>
                <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                  {formatDate(user.registered_date)}
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap text-sm hidden sm:table-cell">
                  {user.last_login ? (
                    <span className="text-green-700 font-medium">{formatDate(user.last_login)}</span>
                  ) : (
                    <span className="text-gray-400 italic">Never</span>
                  )}
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-1">
                    {/* {onViewProfile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewProfile(user);
                        }}
                        className="p-1 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                        title="View profile"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </button>
                    )} */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditUser(user);
                      }}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                      title="Edit user"
                    >
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteUser(user.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                      title="Delete user"
                    >
                      <IconDelete className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    {totalPages > 1 && (
      <div className="bg-white px-4 py-2.5 border-t border-gray-200 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of{' '}
              {filteredUsers.length} results
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="ml-4 border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded ${
                      currentPage === pageNum
                        ? 'bg-yellow-400 text-gray-900 font-semibold'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
    </div>
  );
};

export default ModernUsersTable;
