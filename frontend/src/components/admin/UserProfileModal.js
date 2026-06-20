import React, { useState, useRef } from 'react';
import Modal from '../../Modals/Modal';
import IconUpload from '../SVG/IconUpload';
import IconSave from '../SVG/IconSave';
import IconEdit from '../SVG/IconEdit';

const UserProfileModal = ({
  user,
  show,
  onClose,
  onSave,
  departments = []
}) => {
  const [editingField, setEditingField] = useState(null);
  const [tempValues, setTempValues] = useState({});
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFieldEdit = (fieldName) => {
    setEditingField(fieldName);
    setTempValues(prev => ({
      ...prev,
      [fieldName]: user[fieldName] || ""
    }));
  };

  const handleFieldSave = (fieldName, value) => {
    onSave(fieldName, value);
    setEditingField(null);
    setTempValues(prev => {
      const newTemp = { ...prev };
      delete newTemp[fieldName];
      return newTemp;
    });
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setTempValues({});
  };

  const handleInputChange = (fieldName, value) => {
    setTempValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = () => {
    if (avatar) {
      // Here you would typically upload to server
      // For now, just simulate success
      alert('Avatar uploaded successfully!');
      setAvatar(null);
      setAvatarPreview(null);
    }
  };

  if (!user) return null;

  return (
    <Modal
      title="User Profile"
      show={show}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                user.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
            >
              <IconUpload className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {user.name} {user.surname}
            </h3>
            <p className="text-sm text-gray-600">@{user.username}</p>
            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
            
            {avatar && (
              <div className="mt-3">
                <button
                  onClick={handleAvatarUpload}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <IconUpload className="w-4 h-4" />
                  Upload Avatar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Username */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              {editingField === 'username' ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempValues.username || ""}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    <IconSave className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">{user.username}</span>
                  <button
                    onClick={() => handleFieldEdit('username')}
                    className="p-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <IconEdit className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Name */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              {editingField === 'name' ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempValues.name || ""}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    <IconSave className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">{user.name}</span>
                  <button
                    onClick={() => handleFieldEdit('name')}
                    className="p-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <IconEdit className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              {editingField === 'email' ? (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={tempValues.email || ""}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    <IconSave className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">{user.email || 'Not provided'}</span>
                  <button
                    onClick={() => handleFieldEdit('email')}
                    className="p-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <IconEdit className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Surname */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              {editingField === 'surname' ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempValues.surname || ""}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    <IconSave className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">{user.surname}</span>
                  <button
                    onClick={() => handleFieldEdit('surname')}
                    className="p-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <IconEdit className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Role */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              {editingField === 'role' ? (
                <div className="flex gap-2">
                  <select
                    value={tempValues.role || ""}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        handleFieldCancel();
                      }
                    }}
                    autoFocus
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="gm">General Manager</option>
                    <option value="user">User</option>
                  </select>
                  <button
                    onClick={() => handleFieldSave('role', tempValues.role || "")}
                    className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    <IconSave className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 capitalize">
                    {user.role === 'gm' ? 'General Manager' : user.role}
                  </span>
                  <button
                    onClick={() => handleFieldEdit('role')}
                    className="p-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <IconEdit className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Department */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              {editingField === 'department' ? (
                <div className="flex gap-2">
                  <select
                    value={tempValues.department || ""}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        handleFieldCancel();
                      }
                    }}
                    autoFocus
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleFieldSave('department', tempValues.department || "")}
                    className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    <IconSave className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">
                    {departments.find(d => d.id === user.department)?.name || 'Not assigned'}
                  </span>
                  <button
                    onClick={() => handleFieldEdit('department')}
                    className="p-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <IconEdit className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-600">Member Since</div>
            <div className="text-lg font-semibold text-blue-900">
              {new Date(user.registered_date).toLocaleDateString()}
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-600">Last Login</div>
            <div className="text-lg font-semibold text-green-900">
              {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm font-medium text-purple-600">Status</div>
            <div className="text-lg font-semibold text-purple-900 capitalize">
              {user.status || 'Active'}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UserProfileModal;
