import React, { useState, useEffect, useRef } from 'react';
import '../style/TeamUpdatesFilterBar.css';
import {
    SearchIcon,
    ProjectIcon,
    PillCloseIcon,
    TodayIcon,
    YesterdayIcon,
    CustomDateIcon,
    ClockIcon,
    HourglassIcon,
    BlockIcon,
} from './Icons';
import CustomDatePicker from './CustomDatePicker';

const ManagerFilterBar = ({
    searchTerm, setSearchTerm,
    selectedProject, setSelectedProject,
    dateFilter, setDateFilter,
    customDate, setCustomDate,
    timeFilter, setTimeFilter,
    projectList
}) => {
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

    const projectContainerRef = useRef(null);
    const dateContainerRef = useRef(null);
    const timeContainerRef = useRef(null);

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

    const selectedProjectObj = projectList.find(p => p.name === selectedProject);
    const selectedProjectColor = selectedProjectObj?.color || selectedProjectObj?.color_code || '#475569';

    const filteredProjects = projectList.filter(p =>
        p.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (projectContainerRef.current && !projectContainerRef.current.contains(event.target)) {
                setIsProjectDropdownOpen(false);
                setProjectSearchTerm('');
            }
            if (dateContainerRef.current && !dateContainerRef.current.contains(event.target)) {
                setIsDateDropdownOpen(false);
            }
            if (timeContainerRef.current && !timeContainerRef.current.contains(event.target)) {
                setIsTimeDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleProjectSelect = (projectName) => {
        setSelectedProject(projectName);
        setIsProjectDropdownOpen(false);
        setProjectSearchTerm('');
    };

    const clearSelectedProject = (e) => {
        e.stopPropagation();
        setSelectedProject('All Projects');
    };

    const handleDateSelect = (value) => {
        setDateFilter(value);
        setIsDateDropdownOpen(false);

        if (value === 'Custom Date') {
            setIsCalendarOpen(true);
        } else {
            setIsCalendarOpen(false);
        }
    };

    const handleTimeSelect = (value) => {
        setTimeFilter(value);
        setIsTimeDropdownOpen(false);
    };

    const renderTimeIcon = (value) => {
        if (value === 'Before 10 AM') return <ClockIcon />;
        if (value === 'After 10 AM') return <HourglassIcon />;
        if (value === 'Not Submitted') return <BlockIcon />;
        return <ClockIcon />;
    };

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

            {/* 2. Project Dropdown */}
            <div ref={projectContainerRef} className="project-dropdown-container">
                <div
                    className="filter-item-wrapper project-dropdown-trigger"
                    onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                >
                    {selectedProject === 'All Projects' ? (
                        <>
                            <ProjectIcon />
                            <span className="select-display">All Projects</span>
                        </>
                    ) : (
                        <div className="selected-project-pill" style={{ backgroundColor: selectedProjectColor }}>
                            <span className="selected-project-pill-text">{selectedProject}</span>
                            <button
                                className="pill-close-btn"
                                onClick={clearSelectedProject}
                                aria-label="Clear project filter"
                                type="button"
                            >
                                <PillCloseIcon />
                            </button>
                        </div>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isProjectDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>

                {isProjectDropdownOpen && (
                    <div className="project-dropdown-menu">
                        <div className="project-menu-search">
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Search project"
                                value={projectSearchTerm}
                                onChange={(e) => setProjectSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="project-pill-list">
                            {filteredProjects.map(p => (
                                <div
                                    key={p.id}
                                    className={`project-pill-row ${selectedProject === p.name ? 'selected' : ''}`}
                                    onClick={() => handleProjectSelect(p.name)}
                                >
                                    <div className="project-pill" style={{ backgroundColor: p.color || p.color_code }}>
                                        {p.name}
                                    </div>
                                </div>
                            ))}
                            {filteredProjects.length === 0 && (
                                <div className="project-no-results">
                                    {projectSearchTerm ? 'No projects found' : 'No projects available'}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Date Dropdown — TeamUpdates style */}
            <div ref={dateContainerRef} className="date-dropdown-container">
                <div className="filter-item-wrapper date-dropdown-pill" onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}>
                    {dateFilter === 'Date' && <CustomDateIcon />}
                    {dateFilter === 'Today' && <TodayIcon />}
                    {dateFilter === 'Yesterday' && <YesterdayIcon />}
                    {dateFilter === 'Custom Date' && <CustomDateIcon />}
                    <div className="date-dropdown-content">
                        {dateFilter === 'Date' && 'Date'}
                        {dateFilter === 'Today' && <>Today <span className="date-subtext">({formattedToday})</span></>}
                        {dateFilter === 'Yesterday' && <>Yesterday <span className="date-subtext">({formattedYesterday})</span></>}
                        {dateFilter === 'Custom Date' && <>Custom Date <span className="date-subtext">{formattedCustomDate ? `(${formattedCustomDate})` : ''}</span></>}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isDateDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>

                {isDateDropdownOpen && (
                    <div className="date-dropdown-menu">
                        <div className="date-dropdown-item date-dropdown-item-bordered" onClick={() => handleDateSelect('Today')}>
                            <TodayIcon />
                            <span>Today <span className="date-subtext">({formattedToday})</span></span>
                        </div>
                        <div className="date-dropdown-item date-dropdown-item-bordered" onClick={() => handleDateSelect('Yesterday')}>
                            <YesterdayIcon />
                            <span>Yesterday <span className="date-subtext">({formattedYesterday})</span></span>
                        </div>
                        <div className="date-dropdown-item" onClick={() => handleDateSelect('Custom Date')}>
                            <CustomDateIcon />
                            <span>Custom Date</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </div>
                    </div>
                )}

                <CustomDatePicker
                    isOpen={isCalendarOpen}
                    onClose={() => setIsCalendarOpen(false)}
                    value={customDate}
                    onChange={(newDate) => setCustomDate(newDate)}
                    ignoreRef={dateContainerRef}
                />
            </div>

            {/* 4. Time Dropdown — with icons, opens leftward */}
            <div ref={timeContainerRef} className="time-dropdown-container">
                <div className="filter-item-wrapper date-dropdown-pill time-dropdown-pill" onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}>
                    {renderTimeIcon(timeFilter)}
                    <div className="date-dropdown-content">
                        {timeFilter}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isTimeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>

                {isTimeDropdownOpen && (
                    <div className="time-dropdown-menu">
                        <div
                            className={`date-dropdown-item ${timeFilter === 'Before 10 AM' ? 'selected' : ''}`}
                            onClick={() => handleTimeSelect('Before 10 AM')}
                        >
                            <ClockIcon />
                            <span>Before 10 AM</span>
                        </div>
                        <div
                            className={`date-dropdown-item ${timeFilter === 'After 10 AM' ? 'selected' : ''}`}
                            onClick={() => handleTimeSelect('After 10 AM')}
                        >
                            <HourglassIcon />
                            <span>After 10 AM</span>
                        </div>
                        <div
                            className={`date-dropdown-item ${timeFilter === 'Not Submitted' ? 'selected' : ''}`}
                            onClick={() => handleTimeSelect('Not Submitted')}
                        >
                            <BlockIcon />
                            <span>Not Submitted</span>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default ManagerFilterBar;
