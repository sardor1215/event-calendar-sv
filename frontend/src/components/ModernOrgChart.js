import React, { useState, useEffect } from "react";
import { useAuth } from "../auth";
import { serverIP } from "../api";

const ModernOrgChart = () => {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedDepts, setExpandedDepts] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchTreeData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${serverIP}api/tree-data`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setTreeData(data);
          // Expand all departments by default
          if (data.children) {
            setExpandedDepts(new Set(data.children.map((_, index) => index)));
          }
        } else {
          console.error("Failed to fetch tree data");
        }
      } catch (error) {
        console.error("Error fetching tree data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTreeData();
    }
  }, [token]);

  const toggleDepartment = (deptIndex) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptIndex)) {
      newExpanded.delete(deptIndex);
    } else {
      newExpanded.add(deptIndex);
    }
    setExpandedDepts(newExpanded);
  };

  const expandAllDepartments = () => {
    if (treeData?.children) {
      setExpandedDepts(new Set(treeData.children.map((_, index) => index)));
    }
  };

  const collapseAllDepartments = () => {
    setExpandedDepts(new Set());
  };

  const filteredTreeData = React.useMemo(() => {
    if (!treeData || !searchTerm.trim()) return treeData;
    
    const filtered = {
      ...treeData,
      children: treeData.children?.map(dept => ({
        ...dept,
        children: dept.children?.filter(member => 
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dept.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(dept => dept.children && dept.children.length > 0)
    };
    
    return filtered;
  }, [treeData, searchTerm]);

  const CompanyIcon = () => (
    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-all duration-300 animate-pulse-subtle">
      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.4L18.6 12H17v6H7v-6H5.4L12 5.4z"/>
        <path d="M9 14h2v2H9v-2zm4 0h2v2h-2v-2z"/>
      </svg>
    </div>
  );

  const DepartmentIcon = ({ color = "purple" }) => {
    const colorClasses = {
      purple: "from-purple-500 to-purple-600",
      blue: "from-blue-500 to-blue-600", 
      green: "from-green-500 to-green-600",
      orange: "from-orange-500 to-orange-600",
      pink: "from-pink-500 to-pink-600",
      teal: "from-teal-500 to-teal-600"
    };
    
    return (
      <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color] || colorClasses.purple} rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300 hover:rotate-3`}>
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v-2c0-1.11.89-2 2-2h2c1.11 0 2 .89 2 2v2h3v4H4zm8-10c0-2.21-1.79-4-4-4S4 5.79 4 8s1.79 4 4 4 4-1.79 4-4z"/>
        </svg>
      </div>
    );
  };

  const ManagerIcon = () => (
    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md transform hover:scale-105 transition-all duration-200 ring-2 ring-emerald-200">
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7C14.45 7 14 7.45 14 8V16C14 16.55 14.45 17 15 17H16V21H18V17H19V21H21V17H22C22.55 17 23 16.55 23 16V9H21ZM7 7C7.55 7 8 7.45 8 8V16C8 16.55 7.55 17 7 17H6V21H4V17H3V21H1V17H2C1.45 17 1 16.55 1 16V9H3V7H7Z"/>
      </svg>
    </div>
  );

  const UserIcon = () => (
    <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl flex items-center justify-center shadow-sm transform hover:scale-105 transition-all duration-200">
      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM12 14.9C10 14.9 8.4 13.3 8.4 11.3C8.4 9.3 10 7.7 12 7.7S15.6 9.3 15.6 11.3C15.6 13.3 14 14.9 12 14.9ZM12 22C8.7 22 6 19.3 6 16V15C6 14.4 6.4 14 7 14H17C17.6 14 18 14.4 18 15V16C18 19.3 15.3 22 12 22Z"/>
      </svg>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Organization Chart</h3>
          <p className="text-gray-600">Building the organizational structure...</p>
        </div>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center text-gray-500">
          <p>Unable to load organizational data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 border border-gray-100">
      {/* Header with Search and Controls */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              Organization Structure
            </h2>
            <p className="text-gray-600">Interactive organizational hierarchy and team overview</p>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <button
              onClick={expandAllDepartments}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Expand All
            </button>
            
            <button
              onClick={collapseAllDepartments}
              className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Modern Organizational Chart */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Company Level */}
          <div className="flex justify-center mb-12">
            <div className="text-center group">
              <div className="relative">
                <CompanyIcon />
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </div>
              <h3 className="mt-4 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {filteredTreeData.name}
              </h3>
              <p className="text-sm text-gray-500 font-medium">Headquarters</p>
            </div>
          </div>

          {/* Connection Line */}
          <div className="flex justify-center mb-8">
            <div className="w-1 h-12 bg-gradient-to-b from-blue-400 via-purple-400 to-gray-300 rounded-full"></div>
          </div>

          {/* Departments Level */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Horizontal Line */}
              {filteredTreeData.children && filteredTreeData.children.length > 1 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent transform -translate-y-6 rounded-full"></div>
              )}

              <div className="flex flex-wrap justify-center gap-16">
                {filteredTreeData.children?.map((department, deptIndex) => {
                  const colors = ["purple", "blue", "green", "orange", "pink", "teal"];
                  const deptColor = colors[deptIndex % colors.length];
                  
                  return (
                  <div key={deptIndex} className="relative animate-fade-in" style={{animationDelay: `${deptIndex * 0.1}s`}}>
                    {/* Vertical Line to Department */}
                    <div className="absolute left-1/2 top-0 w-1 h-6 bg-gradient-to-b from-purple-300 to-gray-300 rounded-full transform -translate-x-0.5 -translate-y-6"></div>
                    
                    {/* Department */}
                    <div className="text-center mb-8 group">
                      <button
                        onClick={() => toggleDepartment(deptIndex)}
                        className="transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-200 rounded-2xl p-2"
                      >
                        <DepartmentIcon color={deptColor} />
                        <h4 className="mt-3 text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {department.name}
                        </h4>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <div className={`w-2 h-2 rounded-full bg-${deptColor}-500`}></div>
                          <p className="text-sm text-gray-600 font-medium">
                            {department.children?.length || 0} members
                          </p>
                        </div>
                      </button>

                      {/* Expand/Collapse Indicator */}
                      {department.children && department.children.length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={() => toggleDepartment(deptIndex)}
                            className={`text-sm text-${deptColor}-600 hover:text-${deptColor}-800 flex items-center justify-center gap-2 mx-auto px-3 py-1 rounded-full bg-${deptColor}-50 hover:bg-${deptColor}-100 transition-all duration-200`}
                          >
                            {expandedDepts.has(deptIndex) ? "Hide" : "Show"} Team
                            <svg 
                              className={`w-4 h-4 transition-transform duration-200 ${expandedDepts.has(deptIndex) ? 'rotate-180' : ''}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Department Members */}
                    {expandedDepts.has(deptIndex) && department.children && (
                      <div className="mt-8 animate-slide-down">
                        {/* Connection Line to Members */}
                        <div className="flex justify-center mb-6">
                          <div className="w-1 h-6 bg-gradient-to-b from-purple-300 to-gray-300 rounded-full"></div>
                        </div>

                        {/* Members Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto">
                          {department.children.map((member, memberIndex) => (
                            <div 
                              key={memberIndex} 
                              className="group text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 cursor-pointer transform hover:-translate-y-1"
                              onClick={() => setSelectedMember(selectedMember?.name === member.name ? null : member)}
                            >
                              <div className="flex justify-center mb-3">
                                {member.isManager ? <ManagerIcon /> : <UserIcon />}
                              </div>
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 font-medium">
                                {member.isManager ? "Manager" : "Team Member"}
                              </p>
                              {member.isManager && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Lead
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ModernOrgChart;

