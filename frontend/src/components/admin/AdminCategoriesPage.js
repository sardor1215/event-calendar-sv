import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../Layout";

import IconDelete from "../SVG/IconDelete";
import IconAddDepartment from "../SVG/IconAddDepartment";
import IconEdit from "../SVG/IconEdit";
import IconSave from "../SVG/IconSave";
import IconClose from "../SVG/IconClose";
import IconAdd from "../SVG/IconAdd";
import {
  fetchDepartments,
  createDepartment,
  deleteDepartment,
  updateDepartment,
  fetchSubjects,
  createSubject,
  deleteSubject,
  updateSubject,
} from "../../api";

const AdminCategoriesPage = () => {
  const [departmentName, setDepartmentName] = useState("");
  const [departmentDescription, setDepartmentDescription] = useState("");
  const [departments, setDepartments] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Edit states
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editDepartmentName, setEditDepartmentName] = useState("");
  const [editDepartmentDescription, setEditDepartmentDescription] =
    useState("");
  const [editSubjectName, setEditSubjectName] = useState("");

  const { token } = useAuth();
  const navigate = useNavigate();

  // Fetch departments
  useEffect(() => {
    const fetchAllDepartments = async () => {
      try {
        const data = await fetchDepartments(token);
        setDepartments(data);
      } catch (error) {
        alert("Failed to fetch departments");
      }
    };

    fetchAllDepartments();
  }, [token]);

  // Fetch subjects for selected department
  useEffect(() => {
    const fetchDepartmentSubjects = async () => {
      if (!selectedDepartment) {
        setSubjects([]);
        return;
      }

      try {
        const data = await fetchSubjects(token, selectedDepartment.id);
        setSubjects(data);
      } catch (error) {
        alert("Failed to fetch subjects");
      }
    };

    fetchDepartmentSubjects();
  }, [token, selectedDepartment]);

  // Create department
  const handleCreateDepartment = async () => {
    try {
      const newDepartment = await createDepartment(
        departmentName,
        departmentDescription,
        token
      );
      setDepartments([...departments, newDepartment]);
      setDepartmentName("");
      setDepartmentDescription("");
    } catch (error) {
      alert("Failed to create department");
    }
  };

  // Delete department
  const handleDeleteDepartment = async (id) => {
    const department = departments.find((dep) => dep.id === id);
    const confirmMessage = `Are you sure you want to delete the department "${department?.name}"?\n\nThis action cannot be undone and will also delete all associated subjects.`;

    if (window.confirm(confirmMessage)) {
      try {
        await deleteDepartment(id, token);
        setDepartments(departments.filter((dep) => dep.id !== id));
        // Clear selected department if it was deleted
        if (selectedDepartment && selectedDepartment.id === id) {
          setSelectedDepartment(null);
          setSubjects([]);
        }
      } catch (error) {
        alert("Failed to delete department");
      }
    }
  };

  // Create subject
  const handleCreateSubject = async () => {
    if (!selectedDepartment) {
      alert("Please select a department first");
      return;
    }

    try {
      const newSubject = await createSubject(
        subjectName,
        selectedDepartment.id,
        token
      );
      setSubjects([...subjects, newSubject]);
      setSubjectName("");
    } catch (error) {
      alert("Failed to create subject");
    }
  };

  // Delete subject
  const handleDeleteSubject = async (id) => {
    const subject = subjects.find((sub) => sub.id === id);
    const confirmMessage = `Are you sure you want to delete the subject "${subject?.name}"?\n\nThis action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        await deleteSubject(id, token);
        setSubjects(subjects.filter((sub) => sub.id !== id));
      } catch (error) {
        alert("Failed to delete subject");
      }
    }
  };

  // Edit department functions
  const handleEditDepartment = (department) => {
    setEditingDepartment(department.id);
    setEditDepartmentName(department.name);
    setEditDepartmentDescription(department.description);
  };

  const handleSaveDepartment = async () => {
    const originalDepartment = departments.find(
      (dept) => dept.id === editingDepartment
    );
    const hasChanges =
      originalDepartment &&
      (originalDepartment.name !== editDepartmentName ||
        originalDepartment.description !== editDepartmentDescription);

    if (!hasChanges) {
      setEditingDepartment(null);
      setEditDepartmentName("");
      setEditDepartmentDescription("");
      return;
    }

    const confirmMessage = `Are you sure you want to save changes to department "${originalDepartment?.name}"?`;

    if (window.confirm(confirmMessage)) {
      try {
        await updateDepartment(
          editingDepartment,
          editDepartmentName,
          editDepartmentDescription,
          token
        );
        setDepartments(
          departments.map((dept) =>
            dept.id === editingDepartment
              ? {
                  ...dept,
                  name: editDepartmentName,
                  description: editDepartmentDescription,
                }
              : dept
          )
        );
        setEditingDepartment(null);
        setEditDepartmentName("");
        setEditDepartmentDescription("");
      } catch (error) {
        alert("Failed to update department");
      }
    }
  };

  const handleCancelEditDepartment = () => {
    setEditingDepartment(null);
    setEditDepartmentName("");
    setEditDepartmentDescription("");
  };

  // Edit subject functions
  const handleEditSubject = (subject) => {
    setEditingSubject(subject.id);
    setEditSubjectName(subject.subject_name);
  };

  const handleSaveSubject = async () => {
    const originalSubject = subjects.find((sub) => sub.id === editingSubject);
    const hasChanges =
      originalSubject && originalSubject.subject_name !== editSubjectName;

    if (!hasChanges) {
      setEditingSubject(null);
      setEditSubjectName("");
      return;
    }

    const confirmMessage = `Are you sure you want to save changes to subject "${originalSubject?.subject_name}"?`;

    if (window.confirm(confirmMessage)) {
      try {
        await updateSubject(editingSubject, editSubjectName, token);
        setSubjects(
          subjects.map((sub) =>
            sub.id === editingSubject
              ? { ...sub, subject_name: editSubjectName }
              : sub
          )
        );
        setEditingSubject(null);
        setEditSubjectName("");
      } catch (error) {
        alert("Failed to update subject");
      }
    }
  };

  const handleCancelEditSubject = () => {
    setEditingSubject(null);
    setEditSubjectName("");
  };

  return (
    <Layout
      title="Manage Departments & Ticket Subjects"
      subtitle="Create and manage departments and their associated ticket subjects"
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
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8  ">
        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Department Manager Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-3">
              <div className="bg-blue-100 p-2 rounded-full mr-2">
                <IconAddDepartment className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Departments</h3>
            </div>

            {/* Add Department Form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">
                Add New Department
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={departmentName}
                    onChange={(e) =>
                      setDepartmentName(e.target.value.toUpperCase())
                    }
                    maxLength={60}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition duration-200"
                    placeholder="Enter department name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={departmentDescription}
                    onChange={(e) => setDepartmentDescription(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition duration-200 resize-none"
                    placeholder="Enter department description"
                  />
                </div>
                <button
                  onClick={handleCreateDepartment}
                  disabled={!departmentName.trim()}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-md hover:from-yellow-500 hover:to-yellow-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <IconAddDepartment className="w-3 h-3 mr-1" />
                  Add Department
                </button>
              </div>
            </div>

            {/* Department List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-2 border-b border-gray-200">
                <h4 className="text-xs font-semibold text-gray-800">
                  Existing Departments
                </h4>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {departments.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <IconAddDepartment className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs">No departments found</p>
                    <p className="text-xs">Add your first department above</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {departments.map((department) => (
                      <div
                        key={department.id}
                        className="p-2 hover:bg-gray-50 transition duration-200"
                      >
                        {editingDepartment === department.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editDepartmentName}
                              onChange={(e) =>
                                setEditDepartmentName(e.target.value)
                              }
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400"
                            />
                            <textarea
                              value={editDepartmentDescription}
                              onChange={(e) =>
                                setEditDepartmentDescription(e.target.value)
                              }
                              rows="2"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 resize-none"
                            />
                            <div className="flex space-x-1">
                              <button
                                onClick={handleSaveDepartment}
                                className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition duration-200 flex items-center"
                              >
                                <IconSave className="w-3 h-3 mr-1" />
                                Save
                              </button>
                              <button
                                onClick={handleCancelEditDepartment}
                                className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 transition duration-200 flex items-center"
                              >
                                <IconClose className="w-3 h-3 mr-1" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 text-xs">
                                {department.name}
                              </h5>
                              <p className="text-gray-600 text-xs mt-1">
                                {department.description}
                              </p>
                            </div>
                            <div className="flex space-x-1 ml-2">
                              <button
                                onClick={() => handleEditDepartment(department)}
                                className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 transition duration-200"
                                title="Edit Department"
                              >
                                <IconEdit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteDepartment(department.id)
                                }
                                className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition duration-200"
                                title="Delete Department"
                              >
                                <IconDelete className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subject Manager Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <IconAdd className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Ticket Subjects
              </h3>
            </div>

            {/* Department Selection */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">
                Select Department
              </h4>
              <select
                value={selectedDepartment?.id || ""}
                onChange={(e) => {
                  const deptId = e.target.value;
                  const dept = departments.find((d) => d.id == deptId);
                  setSelectedDepartment(dept || null);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition duration-200"
              >
                <option value="">Choose a department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedDepartment && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                <div className="flex items-center mb-3">
                  <div className="bg-yellow-100 p-2 rounded-full mr-3">
                    <span className="text-yellow-600 font-bold text-sm">
                      📋
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">
                    Adding subjects for:{" "}
                    <span className="text-yellow-600">
                      {selectedDepartment.name}
                    </span>
                  </h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition duration-200"
                      placeholder="Enter subject name"
                    />
                  </div>
                  <button
                    onClick={handleCreateSubject}
                    disabled={!subjectName.trim()}
                    className="w-full bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-md hover:from-green-500 hover:to-green-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <IconAdd className="w-3 h-3 mr-1" />
                    Add Subject
                  </button>
                </div>
              </div>
            )}

            {/* Subjects List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-2 border-b border-gray-200">
                <h4 className="text-xs font-semibold text-gray-800">
                  {selectedDepartment
                    ? `${selectedDepartment.name} Subjects`
                    : "Ticket Subjects"}
                </h4>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {!selectedDepartment ? (
                  <div className="p-4 text-center text-gray-500">
                    <IconAdd className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs">
                      Please select a department to view its subjects
                    </p>
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <IconAdd className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs">
                      No subjects found for {selectedDepartment.name}
                    </p>
                    <p className="text-xs">Add your first subject above</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="p-2 hover:bg-gray-50 transition duration-200"
                      >
                        {editingSubject === subject.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editSubjectName}
                              onChange={(e) =>
                                setEditSubjectName(e.target.value)
                              }
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400"
                            />
                            <div className="flex space-x-1">
                              <button
                                onClick={handleSaveSubject}
                                className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition duration-200 flex items-center"
                              >
                                <IconSave className="w-3 h-3 mr-1" />
                                Save
                              </button>
                              <button
                                onClick={handleCancelEditSubject}
                                className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 transition duration-200 flex items-center"
                              >
                                <IconClose className="w-3 h-3 mr-1" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 text-xs">
                                {subject.subject_name}
                              </h5>
                              {subject.department_name && (
                                <p className="text-gray-500 text-xs mt-1">
                                  Department: {subject.department_name}
                                </p>
                              )}
                            </div>
                            <div className="flex space-x-1 ml-2">
                              <button
                                onClick={() => handleEditSubject(subject)}
                                className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 transition duration-200"
                                title="Edit Subject"
                              >
                                <IconEdit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(subject.id)}
                                className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition duration-200"
                                title="Delete Subject"
                              >
                                <IconDelete className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminCategoriesPage;
