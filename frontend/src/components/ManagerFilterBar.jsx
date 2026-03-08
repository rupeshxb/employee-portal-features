import React, { useState, useEffect, useRef } from 'react';
import '../style/TeamUpdatesFilterBar.css';
import { SearchIcon, ProjectIcon, DateIcon } from './Icons';

const ClockIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const ManagerFilterBar = ({
    searchTerm, setSearchTerm,
    selectedProject, setSelectedProject,
    dateFilter, setDateFilter,
    customDate, setCustomDate,
    timeFilter, setTimeFilter,
    projectList
}) => {
    // --- States ---
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    // NEW: Time dropdown state
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

    // --- Refs ---
    const projectContainerRef = useRef(null);
    const dateContainerRef = useRef(null);
    const dateInputRef = useRef(null);
    const timeContainerRef = useRef(null);

    // --- Date Formatting Logic ---
    const formattedToday = new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedYesterday = yesterday.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    const formattedCustomDate = customDate
        ? new Date(customDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

    // --- Effects (Click Outside) ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close Project Dropdown
            if (projectContainerRef.current && !projectContainerRef.current.contains(event.target)) {
                setIsProjectDropdownOpen(false);
            }
            // Close Date Dropdown
            if (dateContainerRef.current && !dateContainerRef.current.contains(event.target)) {
                setIsDateDropdownOpen(false);
            }
            // NEW: Close Time Dropdown
            if (timeContainerRef.current && !timeContainerRef.current.contains(event.target)) {
                setIsTimeDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Handlers ---
    const handleProjectSelect = (projectName) => {
        setSelectedProject(projectName);
        setIsProjectDropdownOpen(false);
        setProjectSearch('');
    };

    const handleClearProject = (e) => {
        e.stopPropagation();
        setSelectedProject('All Projects');
    };

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

    // NEW: Time Selection Handler
    const handleTimeSelect = (value) => {
        setTimeFilter(value);
        setIsTimeDropdownOpen(false);
    };

    // Filter projects for the menu
    const filteredProjects = projectList.filter(p =>
        p.name.toLowerCase().includes(projectSearch.toLowerCase())
    );

    const activeProjectData = projectList.find(p => p.name === selectedProject);

    return (
        <div className="filter-bar">
            {/* 1. Search */}
            <div className="filter-item-wrapper search-wrapper">
                <SearchIcon />
                <input
                    type="text"
                    placeholder="Search team member"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* 2. CUSTOM Project Dropdown */}
            {/* ... (Keep your existing project dropdown code here) ... */}
            <div ref={projectContainerRef} className="custom-project-container">
                <div
                    className="filter-item-wrapper custom-project-trigger"
                    onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                >
                    {selectedProject === 'All Projects' && <ProjectIcon />}

                    <div className="project-trigger-content">
                        {selectedProject === 'All Projects' ? (
                            <span>All Projects</span>
                        ) : (
                            <div
                                className="selected-project-pill"
                                style={{ backgroundColor: activeProjectData?.color || '#cbd5e1' }}
                            >
                                {selectedProject}
                                <span className="clear-project-btn" onClick={handleClearProject}>
                                    <CloseIcon />
                                </span>
                            </div>
                        )}
                    </div>

                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`project-caret ${isProjectDropdownOpen ? 'open' : ''}`}>
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>

                {isProjectDropdownOpen && (
                    <div className="custom-project-menu">
                        <div className="project-menu-search">
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Search project"
                                value={projectSearch}
                                onChange={(e) => setProjectSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="project-menu-list">
                            {filteredProjects.length > 0 ? (
                                filteredProjects.map(p => (
                                    <div
                                        key={p.id}
                                        className="project-menu-item"
                                        onClick={() => handleProjectSelect(p.name)}
                                    >
                                        <span className="project-pill" style={{ backgroundColor: p.color }}>
                                            {p.name}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="project-no-results">No projects found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. CUSTOM Date Dropdown */}
            {/* ... (Keep your existing date dropdown code here) ... */}
            <div ref={dateContainerRef} className="date-dropdown-container">
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

                <input
                    type="date"
                    ref={dateInputRef}
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="date-invisible-input"
                />
            </div>

            {/* 4. CUSTOM Time Submission Dropdown */}
            <div ref={timeContainerRef} className="date-dropdown-container">
                {/* Notice we added 'time-dropdown-pill' here */}
                <div className="filter-item-wrapper date-dropdown-pill time-dropdown-pill" onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}>
                    <ClockIcon />
                    <div className="date-dropdown-content">
                        {timeFilter}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>

                {isTimeDropdownOpen && (
                    <div className="date-dropdown-menu">
                        <div className="date-dropdown-item date-dropdown-item-bordered" onClick={() => handleTimeSelect('Time')}>
                            Time
                        </div>
                        <div className="date-dropdown-item date-dropdown-item-bordered" onClick={() => handleTimeSelect('Before 10 AM')}>
                            Before 10 AM
                        </div>
                        <div className="date-dropdown-item date-dropdown-item-bordered" onClick={() => handleTimeSelect('After 10 AM')}>
                            After 10 AM
                        </div>
                        <div className="date-dropdown-item" onClick={() => handleTimeSelect('Not Submitted')}>
                            Not Submitted
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default ManagerFilterBar;