import React, { useState } from "react";
import Modal from "./Modal";
import IconAddUser from "../components/SVG/IconAddUser";

const AddUserModal = ({
  userAddPart,
  setUserAddPart,
  handleAddUser,
  newUser,
  setNewUser,
  departments,
  isManager = false,
  managerDepartment = "",
}) => {
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If role changes to supervisor or general manager, clear the department
    if (name === 'role' && (value === 'supervisor' || value === 'gm')) {
      setNewUser((prev) => ({
        ...prev,
        [name]: value,
        department: '', // Clear department for supervisors and GMs
      }));
    } else {
      setNewUser((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Department is not required for supervisors and general managers
    const isDepartmentRequired = newUser.role !== 'supervisor' && newUser.role !== 'gm';
    
    if (!newUser.username || !newUser.name || !newUser.surname || !newUser.role || !newUser.password) {
      setError("Please fill in all required fields");
      return;
    }
    
    if (isDepartmentRequired && !newUser.department) {
      setError("Department is required for this role");
      return;
    }

    try {
      await handleAddUser(e);
    } catch (err) {
      console.error('Error in form submission:', err);
      setError(err.message || "Failed to add user");
    }
  };

  if (!userAddPart) return null;

  return (
    <Modal
      title="Add User"
      onClose={() => setUserAddPart(false)}
      show={userAddPart}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative h-11">
            <input
              type="text"
              id="username"
              name="username"
              value={newUser.username || ""}
              onChange={handleChange}
              className="peer h-full w-full border-b border-blue-gray-200 bg-transparent pt-4 pb-1.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border-blue-gray-200 focus:border-yellow-500 focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
              placeholder=" "
              required
            />
            <label className="after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-500 transition-all after:absolute after:-bottom-0 after:block after:w-full after:scale-x-0 after:border-b-2 after:border-blue-600 after:transition-transform after:duration-300 peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.25] peer-placeholder-shown:text-blue-gray-500 peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-blue-600 peer-focus:after:scale-x-100 peer-focus:after:border-blue-600 peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
              Username
            </label>
          </div>

          <div className="relative h-11">
            <input
              type="email"
              id="email"
              name="email"
              value={newUser.email || ""}
              onChange={handleChange}
              className="peer h-full w-full border-b border-blue-gray-200 bg-transparent pt-4 pb-1.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border-blue-gray-200 focus:border-yellow-500 focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
              placeholder=" "
            />
            <label className="after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-500 transition-all after:absolute after:-bottom-0 after:block after:w-full after:scale-x-0 after:border-b-2 after:border-blue-600 after:transition-transform after:duration-300 peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.25] peer-placeholder-shown:text-blue-gray-500 peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-blue-600 peer-focus:after:scale-x-100 peer-focus:after:border-blue-600 peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
              Email (Optional)
            </label>
          </div>

          <div className="relative h-11">
            <input
              type="text"
              id="name"
              name="name"
              value={newUser.name || ""}
              onChange={handleChange}
              className="peer h-full w-full border-b border-blue-gray-200 bg-transparent pt-4 pb-1.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border-blue-gray-200 focus:border-yellow-500 focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
              placeholder=" "
              required
            />
            <label className="after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-500 transition-all after:absolute after:-bottom-0 after:block after:w-full after:scale-x-0 after:border-b-2 after:border-blue-600 after:transition-transform after:duration-300 peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.25] peer-placeholder-shown:text-blue-gray-500 peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-blue-600 peer-focus:after:scale-x-100 peer-focus:after:border-blue-600 peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
              Name
            </label>
          </div>

          <div className="relative h-11">
            <input
              type="text"
              id="surname"
              name="surname"
              value={newUser.surname || ""}
              onChange={handleChange}
              className="peer h-full w-full border-b border-blue-gray-200 bg-transparent pt-4 pb-1.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border-blue-gray-200 focus:border-yellow-500 focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
              placeholder=" "
              required
            />
            <label className="after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-500 transition-all after:absolute after:-bottom-0 after:block after:w-full after:scale-x-0 after:border-b-2 after:border-blue-600 after:transition-transform after:duration-300 peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.25] peer-placeholder-shown:text-blue-gray-500 peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-blue-600 peer-focus:after:scale-x-100 peer-focus:after:border-blue-600 peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
              Surname
            </label>
          </div>

          <div className="relative h-11">
            <select
              id="role"
              name="role"
              value={isManager ? "user" : (newUser.role || "")}
              onChange={handleChange}
              disabled={isManager}
              className={`peer h-full w-full border-b border-blue-gray-200 bg-transparent pt-4 pb-1.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all focus:border-yellow-500 focus:outline-0 ${
                isManager ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              required
            >
              <option value="">
                {isManager ? 'Fixed to User' : 'Select Role'}
              </option>
              {!isManager && (
                <>
                  <option value="admin">Admin</option>
                  {/* <option value="manager">Manager</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="gm">General Manager</option> */}
                </>
              )}
              <option value="user">User</option>
            </select>
            <label className="after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-600 transition-all after:absolute after:-bottom-0 after:block after:w-full after:scale-x-0 after:border-b-2 after:border-blue-600 after:transition-transform after:duration-300 peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.25] peer-placeholder-shown:text-blue-gray-500 peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-blue-600 peer-focus:after:scale-x-100 peer-focus:after:border-blue-600 peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
              Role {isManager ? '(Fixed to User)' : '*'}
            </label>
          </div>

          <div className="relative h-11">
            <select
              id="department"
              name="department"
              value={isManager ? (departments.find(dept => dept.name === managerDepartment)?.id || managerDepartment) : (newUser.department || "")}
              onChange={handleChange}
              disabled={isManager || newUser.role === 'supervisor' || newUser.role === 'gm'}
              className={`peer h-full w-full border-b border-blue-gray-200 bg-transparent pt-4 pb-1.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all focus:border-yellow-500 focus:outline-0 ${
                (isManager || newUser.role === 'supervisor' || newUser.role === 'gm') ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              required={!isManager && newUser.role !== 'supervisor' && newUser.role !== 'gm'}
            >
              <option value="">
                {isManager ? `Fixed to ${managerDepartment}` :
                 newUser.role === 'supervisor' ? 'Not applicable for Supervisor' : 
                 newUser.role === 'gm' ? 'Not applicable for General Manager' : 
                 'Select Department'}
              </option>
              {departments?.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <label className="after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-600 transition-all after:absolute after:-bottom-0 after:block after:w-full after:scale-x-0 after:border-b-2 after:border-blue-600 after:transition-transform after:duration-300 peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.25] peer-placeholder-shown:text-blue-gray-500 peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-blue-600 peer-focus:after:scale-x-100 peer-focus:after:border-blue-600 peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
              Department {isManager ? '(Fixed to your department)' : (newUser.role !== 'supervisor' && newUser.role !== 'gm') ? '*' : '(Not required)'}
            </label>
          </div>

          <div className="relative h-11">
            <input
              type="password"
              id="password"
              name="password"
              value={newUser.password || ""}
              onChange={handleChange}
              className="peer h-full w-full border-b border-blue-gray-200 bg-transparent pt-4 pb-1.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border-blue-gray-200 focus:border-yellow-500 focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
              placeholder=" "
              required
            />
            <label className="after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-600 transition-all after:absolute after:-bottom-0 after:block after:w-full after:scale-x-0 after:border-b-2 after:border-blue-600 after:transition-transform after:duration-300 peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.25] peer-placeholder-shown:text-blue-gray-500 peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-blue-600 peer-focus:after:scale-x-100 peer-focus:after:border-blue-600 peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
              Password
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => setUserAddPart(false)}
            className="mr-4 px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-md focus:outline-none transition-colors duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold rounded-md focus:outline-none flex items-center gap-2 transition-colors duration-300"
          >
            <IconAddUser className="w-5 h-5" />
            Add User
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
