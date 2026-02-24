import React, { useState, useEffect, useRef } from 'react';
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
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const dateContainerRef = useRef(null);
    const dateInputRef = useRef(null);

    // Format today's date
    const formattedToday = new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    // Format yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedYesterday = yesterday.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    // Format the selected custom date (if one is selected)
    const formattedCustomDate = customDate
        ? new Date(customDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

    // Close dropdowns if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateContainerRef.current && !dateContainerRef.current.contains(event.target)) {
                setIsDateDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDateSelect = (value) => {
        setDateFilter(value);
        setIsDateDropdownOpen(false);

        // Auto-open calendar for custom date
        if (value === 'Custom' && dateInputRef.current && 'showPicker' in HTMLInputElement.prototype) {
            try {
                dateInputRef.current.showPicker();
            } catch (err) {
                console.error("Browser blocked auto-opening date picker", err);
            }
        }
    };

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

            {/* Custom Date Dropdown Section */}
            <div ref={dateContainerRef} className="date-dropdown-container">

                {/* The "Select" Pill */}
                <div className="filter-item-wrapper date-dropdown-pill" onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}>
                    <DateIcon />
                    <div className="date-dropdown-content">
                        {dateFilter === 'Date' && 'Date'}
                        {dateFilter === 'Today' && <>Today <span className="date-subtext">({formattedToday})</span></>}
                        {dateFilter === 'Yesterday' && <>Yesterday <span className="date-subtext">({formattedYesterday})</span></>}
                        {dateFilter === 'Custom' && <>Custom Date <span className="date-subtext">{formattedCustomDate ? `(${formattedCustomDate})` : ''}</span></>}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>

                {/* The Dropdown Menu List */}
                {isDateDropdownOpen && (
                    <div className="date-dropdown-menu">
                        <div className="date-dropdown-item date-dropdown-item-bordered" onClick={() => handleDateSelect('Date')}>
                            Date
                        </div>
                        <div className="date-dropdown-item date-dropdown-item-bordered" onClick={() => handleDateSelect('Today')}>
                            Today <span className="date-subtext">({formattedToday})</span>
                        </div>
                        <div className="date-dropdown-item date-dropdown-item-bordered" onClick={() => handleDateSelect('Yesterday')}>
                            Yesterday <span className="date-subtext">({formattedYesterday})</span>
                        </div>
                        <div className="date-dropdown-item" onClick={() => handleDateSelect('Custom')}>
                            Custom Date
                        </div>
                    </div>
                )}

                {/* Invisible Custom Date Input */}
                <input
                    type="date"
                    ref={dateInputRef}
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="date-invisible-input"
                />
            </div>

        </div>
    );
};

export default TeamUpdatesFilterBar;