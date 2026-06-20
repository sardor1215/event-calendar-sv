import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth';
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../api';
import IconClose from '../SVG/IconClose';
import IconAdd from '../SVG/IconAdd';
import IconEdit from '../SVG/IconEdit';
import IconDelete from '../SVG/IconDelete';

const DepartmentManagementModal = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchDepartmentsData();
    }
  }, [isOpen]);

  const fetchDepartmentsData = async () => {
    try {
      setLoading(true);
      const data = await fetchDepartments(token);
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      alert('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (editingDepartment) {
        // Update existing department
        const updatedDepartment = await updateDepartment(
          editingDepartment.id,
          formData.name.trim(),
          formData.description.trim(),
          token
        );
        setDepartments(prev => 
          prev.map(dept => 
            dept.id === editingDepartment.id ? updatedDepartment : dept
          )
        );
        alert('Department updated successfully!');
      } else {
        // Create new department
        const newDepartment = await createDepartment(
          formData.name.trim(),
          formData.description.trim(),
          token
        );
        setDepartments(prev => [...prev, newDepartment]);
        alert('Department created successfully!');
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Error saving department');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (department) => {
    if (!window.confirm(`Are you sure you want to delete "${department.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteDepartment(department.id, token);
      setDepartments(prev => prev.filter(dept => dept.id !== department.id));
      alert('Department deleted successfully!');
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Error deleting department');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setEditingDepartment(null);
    setShowForm(false);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b-2 border-yellow-400 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Department Management</h3>
                <p className="text-gray-500 text-sm">Manage organizational departments</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IconClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!showForm ? (
            // Departments List View
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-gray-900">Departments</h4>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-yellow-400 text-gray-900 text-sm font-semibold rounded-md hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
                >
                  <IconAdd className="w-4 h-4 mr-2" />
                  Add Department
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              ) : departments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
                  <p className="text-gray-500 mb-4">Get started by creating your first department.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((department) => (
                    <div key={department.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="text-lg font-semibold text-gray-900">{department.name}</h5>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(department)}
                            className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded"
                            title="Edit department"
                          >
                            <IconEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(department)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Delete department"
                          >
                            <IconDelete className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {department.description && (
                        <p className="text-gray-600 text-sm mb-3">{department.description}</p>
                      )}
                      
                      <div className="flex items-center justify-end text-sm text-gray-500">
                        <span className="text-xs">
                          ID: {department.id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Form View
            <div>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-gray-900">
                  {editingDepartment ? 'Edit Department' : 'Add New Department'}
                </h4>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <IconClose className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter department name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Enter department description (optional)"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : (editingDepartment ? 'Update Department' : 'Create Department')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentManagementModal;
