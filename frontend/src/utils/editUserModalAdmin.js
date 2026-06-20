import React, { useState } from "react";
import Modal from "../Modals/Modal";
import { useAuth } from "../auth";
import { serverIP } from "../api";
import IconEdit from "../components/SVG/IconEdit";
import IconSave from "../components/SVG/IconSave";

const EditUserModal = ({
  editingUser,
  setEditingUser,
  editUser,
  setEditUser,
  handleEditUser,
  departments,
  fetchUsers,
}) => {
  const { token } = useAuth();
  const [password, setPassword] = useState(""); // State for new password
  const [editingField, setEditingField] = useState(null); // Track which field is being edited
  const [tempValues, setTempValues] = useState({}); // Store temporary values while editing
  const [savingField, setSavingField] = useState(null);
  const [error, setError] = useState("");

  const handleFieldEdit = (fieldName) => {
    setEditingField(fieldName);
    // Initialize temp value with current value
    setTempValues(prev => ({
      ...prev,
      [fieldName]: editUser[fieldName] || ""
    }));
  };

  const handleFieldSave = (fieldName, value) => {
    // Immediate per-field save to server
    setError("");
    setSavingField(fieldName);

    const payloadValue = fieldName === 'department' ? (value || null) : value;
    const userId = editingUser?.id || editingUser?._id;
    if (!userId) {
      setSavingField(null);
      setError('User id is missing; cannot update.');
      return;
    }

    const roleValue = fieldName === 'role' ? value : editUser.role;
    // Coerce department: empty string -> null; force null for supervisor/gm; ensure number when present
    let departmentRaw = fieldName === 'department' ? payloadValue : editUser.department;
    if (roleValue === 'supervisor' || roleValue === 'gm') {
      departmentRaw = null;
    } else if (departmentRaw === '' || departmentRaw === undefined) {
      departmentRaw = null;
    }
    const departmentValue = departmentRaw == null ? null : Number(departmentRaw);

    const payload = {
      username: fieldName === 'username' ? value : editUser.username,
      name: fieldName === 'name' ? value : editUser.name,
      surname: fieldName === 'surname' ? value : editUser.surname,
      role: roleValue,
      department: departmentValue,
      email: fieldName === 'email' ? value : editUser.email,
      ...(fieldName === 'password' ? { password: value } : {}),
    };

    fetch(`${serverIP}api/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || `Failed to update ${fieldName}`);
        }
        return data;
      })
      .then(() => {
        if (fieldName === 'password') {
          setPassword("");
        } else {
          setEditUser({ ...editUser, [fieldName]: value });
        }
        setEditingField(null);
        setTempValues(prev => {
          const newTemp = { ...prev };
          delete newTemp[fieldName];
          return newTemp;
        });
        if (typeof fetchUsers === 'function') {
          fetchUsers();
        }
      })
      .catch((e) => {
        setError(e.message || 'Update failed');
      })
      .finally(() => setSavingField(null));
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    // Clear temp values
    setTempValues({});
  };

  const handleInputChange = (fieldName, value) => {
    setTempValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Single-field save flow only; no bulk save

  return (
    <Modal
      title="Edit User"
      show={Boolean(editingUser)}
      onClose={() => setEditingUser(null)}
      size="xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="text-sm px-3 py-2 rounded bg-red-100 text-red-700 border border-red-200">{error}</div>
        )}
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-3">
            {/* Username Field */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Username</label>
              {editingField === 'username' ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={tempValues.username || ""}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleFieldSave('username', e.target.value);
                      } else if (e.key === 'Escape') {
                        handleFieldCancel();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleFieldSave('username', tempValues.username || "")}
                    className="px-1.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                    disabled={savingField === 'username'}
                  >
                    <IconSave className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-1.5 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 text-sm">{editUser.username}</span>
                  <button
                    onClick={() => handleFieldEdit('username')}
                    className="p-1.5 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <IconEdit className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Name Field */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Name</label>
              {editingField === 'name' ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={tempValues.name || ""}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleFieldSave('name', e.target.value);
                      } else if (e.key === 'Escape') {
                        handleFieldCancel();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleFieldSave('name', tempValues.name || "")}
                    className="px-1.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                    disabled={savingField === 'name'}
                  >
                    <IconSave className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-1.5 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 text-sm">{editUser.name}</span>
                  <button
                    onClick={() => handleFieldEdit('name')}
                    className="p-1.5 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <IconEdit className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Role Field */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Role</label>
              {editingField === 'role' ? (
                <div className="flex gap-1">
                  <select
                    value={tempValues.role || ""}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        handleFieldCancel();
                      }
                    }}
                    autoFocus
                  >
                    <option value="" disabled>Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    {/* <option value="manager">Manager</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="gm">General Manager</option> */}
                  </select>
                  <button
                    onClick={() => handleFieldSave('role', tempValues.role || "")}
                    className="px-1.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                    disabled={savingField === 'role'}
                  >
                    <IconSave className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-1.5 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 text-sm capitalize">{editUser.role}</span>
                  <button
                    onClick={() => handleFieldEdit('role')}
                    className="p-1.5 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <IconEdit className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {/* Email Field */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
              {editingField === 'email' ? (
                <div className="flex gap-1">
                  <input
                    type="email"
                    value={tempValues.email || ""}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleFieldSave('email', e.target.value);
                      } else if (e.key === 'Escape') {
                        handleFieldCancel();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleFieldSave('email', tempValues.email || "")}
                    className="px-1.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                    disabled={savingField === 'email'}
                  >
                    <IconSave className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-1.5 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 text-sm">{editUser.email}</span>
                  <button
                    onClick={() => handleFieldEdit('email')}
                    className="p-1.5 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <IconEdit className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Surname Field */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Surname</label>
              {editingField === 'surname' ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={tempValues.surname || ""}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleFieldSave('surname', e.target.value);
                      } else if (e.key === 'Escape') {
                        handleFieldCancel();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleFieldSave('surname', tempValues.surname || "")}
                    className="px-1.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                    disabled={savingField === 'surname'}
                  >
                    <IconSave className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-1.5 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 text-sm">{editUser.surname}</span>
                  <button
                    onClick={() => handleFieldEdit('surname')}
                    className="p-1.5 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <IconEdit className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Department Field */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Department</label>
              {editingField === 'department' ? (
                <div className="flex gap-1">
                  <select
                    value={tempValues.department || ""}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        handleFieldCancel();
                      }
                    }}
                    autoFocus
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleFieldSave('department', tempValues.department || "")}
                    className="px-1.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                    disabled={savingField === 'department'}
                  >
                    <IconSave className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-1.5 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 text-sm">
                    {departments.find(d => d.id === editUser.department)?.name || 'Not assigned'}
                  </span>
                  <button
                    onClick={() => handleFieldEdit('department')}
                    className="p-1.5 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <IconEdit className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Password Field - Full Width */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
          {editingField === 'password' ? (
            <div className="flex gap-1">
              <input
                type="password"
                value={tempValues.password || ""}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter new password"
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleFieldSave('password', e.target.value);
                  } else if (e.key === 'Escape') {
                    handleFieldCancel();
                  }
                }}
                autoFocus
              />
              <button
                onClick={() => handleFieldSave('password', tempValues.password || "")}
                className="px-1.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                disabled={savingField === 'password'}
              >
                <IconSave className="w-3 h-3" />
              </button>
              <button
                onClick={handleFieldCancel}
                className="px-1.5 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">••••••••</span>
              <button
                onClick={() => handleFieldEdit('password')}
                className="p-1.5 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <IconEdit className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EditUserModal;


