import React from 'react';
import '../style/TeamUpdatesFilterBar.css';
import { SearchIcon, ProjectIcon, RoleIcon, DateIcon } from './Icons';

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
            <div className="filter-item-wrapper search-wrapper">
                <SearchIcon />
                <input
                    type="text"
                    placeholder="Search team member"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Project Dropdown */}
            <div className="filter-item-wrapper">
                <ProjectIcon />
                <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                >
                    <option value="All Projects">All Projects</option>
                    {projectList.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Role Dropdown */}
            <div className="filter-item-wrapper">
                <RoleIcon />
                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                >
                    {roleList.map((role, index) => (
                        <option key={index} value={role}>{role}</option>
                    ))}
                </select>
            </div>

            {/* Date Dropdown */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <div className="filter-item-wrapper">
                    <DateIcon />
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    >
                        <option value="Today">Today</option>
                        <option value="Yesterday">Yesterday</option>
                        <option value="Custom">Custom Date</option>
                    </select>
                </div>

                {/* Custom Date Input (Appears alongside when 'Custom Date' is selected) */}
                {dateFilter === 'Custom' && (
                    <div className="filter-item-wrapper">
                        <input
                            type="date"
                            className="date-input"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamUpdatesFilterBar;