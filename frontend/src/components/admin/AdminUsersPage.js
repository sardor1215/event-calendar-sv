import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth";
import { deleteUser, editUser as editUserApi } from "../../tools/Tools";
import EditUserModal from "../../utils/editUserModalAdmin";
import { serverIP, fetchDepartments } from "../../api";
import AddUserModal from "../../Modals/AddUserModal";
import ProgressBar from "../../tools/ProgressBar";
import Layout from "../Layout";
import { RefreshButton } from "../../tools/RefreshButton";
import ModernUsersTable from "./ModernUsersTable";
import UserProfileModal from "./UserProfileModal";
import IconAddUser from "../SVG/IconAddUser";
import IconClose from "../SVG/IconClose";
import IconDownload from "../SVG/IconDownload";
import IconUpload from "../SVG/IconUpload";
import IconUsers from "../SVG/IconUsers";
import IconChart from "../SVG/IconChart";
import IconSettings from "../SVG/IconSettings";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [userAddPart, setUserAddPart] = useState(false);
  const { token, userDepartment } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: "",
    name: "",
    surname: "",
    role: "",
    department: "",
    email: "",
    password: ""
  });
  const [editUser, setEditUser] = useState({
    username: "",
    name: "",
    surname: "",
    role: "",
    department: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartmentsData();
  }, []);

  const refreshData = async () => {
    await fetchUsers();
    await fetchDepartmentsData();
  };

  // Advanced analytics
  const userAnalytics = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.last_login && new Date(u.last_login) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    const newUsersThisMonth = users.filter(u => new Date(u.registered_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    
    const roleDistribution = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    const departmentDistribution = users.reduce((acc, user) => {
      const dept = user.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      roleDistribution,
      departmentDistribution,
      inactiveUsers: totalUsers - activeUsers
    };
  }, [users]);

  // Bulk operations
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;
    
    setLoading(true);
    try {
      switch (bulkAction) {
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
            await Promise.all(selectedUsers.map(userId => deleteUser(userId, serverIP, token)));
            await fetchUsers();
            setSelectedUsers([]);
          }
          break;
        case 'changeRole':
          const newRole = prompt('Enter new role for selected users:');
          if (newRole) {
            await Promise.all(selectedUsers.map(userId => 
              fetch(`${serverIP}api/users/${userId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
              })
            ));
            await fetchUsers();
            setSelectedUsers([]);
          }
          break;
        case 'assignDepartment':
          const departmentId = prompt('Enter department ID for selected users:');
          if (departmentId) {
            await Promise.all(selectedUsers.map(userId => 
              fetch(`${serverIP}api/users/${userId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ department: departmentId })
              })
            ));
            await fetchUsers();
            setSelectedUsers([]);
          }
          break;
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert('Bulk action failed. Please try again.');
    } finally {
      setLoading(false);
      setBulkAction('');
    }
  };

  // Import/Export functionality
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setImportFile(file);
    } else {
      alert('Please select a valid CSV file.');
    }
  };

  const processImport = async () => {
    if (!importFile) return;
    
    setLoading(true);
    try {
      const text = await importFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === headers.length) {
          const userData = {};
          headers.forEach((header, index) => {
            userData[header.trim()] = values[index].trim();
          });
          
          await fetch(`${serverIP}api/addUser`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
          });
        }
      }
      
      await fetchUsers();
      setImportFile(null);
      alert('Users imported successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check your CSV format.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${serverIP}api/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-role": "admin",
          "x-user-department": userDepartment,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error("Unexpected users data format:", data);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentsData = async () => {
    try {
      const data = await fetchDepartments(token);
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
    }
  };


  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${serverIP}api/addUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newUser,
          // For supervisors and general managers, department can be null
          department: (newUser.role === 'supervisor' || newUser.role === 'gm') ? null : (newUser.department || userDepartment),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchUsers();
        setNewUser({
          username: "",
          name: "",
          surname: "",
          role: "",
          department: "",
          email: "",
          password: "",
        });
        setUserAddPart(false);
      } else {
        throw new Error(data.message || "Failed to add user");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (e) => {
    editUserApi(
      e,
      serverIP,
      token,
      editingUser,
      editUser,
      fetchUsers,
      setEditingUser,
      setEditUser
    );
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId, serverIP, token, fetchUsers);
        // Refresh the users list after successful deletion
        await fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const startEditingUser = (user) => {
    // For supervisors and general managers, department is not required and should be empty
    let departmentId = '';
    
    if (user.role !== 'supervisor' && user.role !== 'gm') {
      // Find the department ID based on the department name for roles that need departments
      const departmentObj = Array.isArray(departments) 
        ? departments.find(dept => dept.name === user.department)
        : null;
      departmentId = departmentObj ? departmentObj.id : '';
      
      // If we can't find the department, log a warning
      if (!departmentObj && user.department) {
        console.warn('Could not find department:', user.department, 'in available departments:', departments);
      }
    }
    
    const editUserData = {
      username: user.username || "",
      name: user.name || "",
      surname: user.surname || "",
      role: user.role || "",
      department: departmentId, // Empty for supervisors and GMs, ID for others
      email: user.email || "",
      password: "",
    };
    
    setEditUser(editUserData);
    setEditingUser(user);
  };
  const toggleAddUser = () => {
    setUserAddPart(!userAddPart);
  };

  return (
    <Layout
      title="User Management"
      subtitle=""
      actions={
        <div className="flex items-center gap-3 flex-wrap">
          {/* Navigation Links */}
          {/* <div className="flex items-center gap-2">
            <Link
              to="/calendar"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Calendar
            </Link>
            <Link
              to="/admin/meetings"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Meetings
            </Link>
          </div> */}
          <RefreshButton onClick={refreshData} loading={loading} />
          
          {/* Analytics Toggle */}
          {/* <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              showAnalytics 
                ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300" 
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <IconChart className="w-5 h-5" />
            <span>Analytics</span>
          </button> */}

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="">Bulk Actions ({selectedUsers.length} selected)</option>
                <option value="delete">Delete Selected</option>
                <option value="changeRole">Change Role</option>
                <option value="assignDepartment">Assign Department</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Execute
              </button>
            </div>
          )}

          {/* Import/Export */}
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-sm font-medium">
              <IconUpload className="w-4 h-4" />
              <span>Import CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
            {importFile && (
              <button
                onClick={processImport}
                className="px-3 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors text-sm"
              >
                Process Import
              </button>
            )}
          </div>

          {/* Add User */}
          <button
            className={`btn text-gray-900 font-semibold inline-flex items-center transition-all duration-300 shadow-sm ${
                userAddPart
                  ? "bg-yellow-500 hover:bg-yellow-400"
                : "bg-yellow-400 hover:bg-yellow-300"
              }`}
              onClick={toggleAddUser}
            >
              {userAddPart ? (
                <>
                <IconClose className="w-5 h-5" />
                <span>Close</span>
                </>
              ) : (
                <>
                <IconAddUser className="w-5 h-5" />
                <span></span>
                </>
              )}
            </button>
        </div>
      }
    >
      {loading && <ProgressBar />}

      {/* Analytics Dashboard */}
      {/* {showAnalytics && (
        <div className="mb-6 space-y-6">
         
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-gradient p-6 animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{userAnalytics.totalUsers}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                  <IconUsers className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="card-gradient p-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-green-600">{userAnalytics.activeUsers}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card-gradient p-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New This Month</p>
                  <p className="text-3xl font-bold text-purple-600">{userAnalytics.newUsersThisMonth}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card-gradient p-6 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                  <p className="text-3xl font-bold text-red-600">{userAnalytics.inactiveUsers}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Role Distribution</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {Object.entries(userAnalytics.roleDistribution).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          role === 'admin' ? 'bg-purple-500' :
                          role === 'manager' ? 'bg-orange-500' :
                          role === 'supervisor' ? 'bg-blue-500' :
                          role === 'gm' ? 'bg-red-500' :
                          'bg-green-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {role === 'gm' ? 'General Manager' : role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              role === 'admin' ? 'bg-purple-500' :
                              role === 'manager' ? 'bg-orange-500' :
                              role === 'supervisor' ? 'bg-blue-500' :
                              role === 'gm' ? 'bg-red-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${(count / userAnalytics.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Department Distribution</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {Object.entries(userAnalytics.departmentDistribution).map(([dept, count]) => (
                    <div key={dept} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                        <span className="text-sm font-medium text-gray-700">{dept}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-indigo-500"
                            style={{ width: `${(count / userAnalytics.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )} */}

      <ModernUsersTable
        users={users}
        onEditUser={startEditingUser}
        onDeleteUser={handleDeleteUser}
        onSelectUsers={setSelectedUsers}
        onViewProfile={setProfileUser}
        selectedUsers={selectedUsers}
        usersPerPage={15}
        role="admin"
      />

            {/* Modals */}
      {editingUser && (
        <EditUserModal
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          editUser={editUser}
          setEditUser={setEditUser}
          handleEditUser={handleEditUser}
          departments={departments}
          fetchUsers={fetchUsers}
        />
      )}
      
      {profileUser && (
        <UserProfileModal
          user={profileUser}
          show={Boolean(profileUser)}
          onClose={() => setProfileUser(null)}
          onSave={(field, value) => {
            // Handle profile updates
            // You can implement the actual update logic here
          }}
          departments={departments}
        />
      )}
      
          {userAddPart && (
            <AddUserModal
              userAddPart={userAddPart}
              setUserAddPart={setUserAddPart}
              handleAddUser={handleAddUser}
              newUser={newUser}
              setNewUser={setNewUser}
              departments={departments}
            />
          )}
    </Layout>
  );
};

export default AdminUsersPage;
