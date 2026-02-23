import React from 'react';
import '../style/TeamUpdatesFilterBar.css';

const TeamUpdatesFilterBar = ({
    searchTerm, setSearchTerm,
    selectedProject, setSelectedProject,
    selectedRole, setSelectedRole,
    dateFilter, setDateFilter,
    customDate, setCustomDate,
    projectList, roleList
}) => {
    return (
        <div className="filter-bar">
            {/* Search */}
            <div className="search-wrapper">
                <span style={{ fontSize: '18px' }}>🔍</span>
                <input
                    type="text"
                    placeholder="Search team member"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Project Dropdown */}
            <select
                className="filter-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
            >
                <option value="All Projects">All Projects</option>
                {projectList.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                ))}
            </select>

            {/* Role Dropdown */}
            <select
                className="filter-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
            >
                {roleList.map((role, index) => (
                    <option key={index} value={role}>{role}</option>
                ))}
            </select>

            {/* Date Dropdown */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <select
                    className="filter-select"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                >
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="Custom">Custom Date</option>
                </select>

                {dateFilter === 'Custom' && (
                    <input
                        type="date"
                        className="filter-select"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                    />
                )}
            </div>
        </div>
    );
};

export default TeamUpdatesFilterBar;