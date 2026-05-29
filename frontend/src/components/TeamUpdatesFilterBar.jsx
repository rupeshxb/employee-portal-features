import React, { useState, useEffect, useRef } from 'react';
import '../style/TeamUpdatesFilterBar.css';
import { SearchIcon, ProjectIcon, RoleIcon, TodayIcon, YesterdayIcon, CustomDateIcon, PillCloseIcon, RoleDevelopersIcon, RoleDesignerIcon, RoleProjectManagerIcon, RoleQAIcon, RoleAllIcon } from './Icons';

const getRoleIcon = (role) => {
    const r = role.toLowerCase();
    if (r === 'all roles') return <RoleAllIcon />;
    if (r.includes('develop') || r.includes('engineer') || r.includes('full stack') || r.includes('frontend') || r.includes('backend') || r.includes('front-end') || r.includes('back-end')) return <RoleDevelopersIcon />;
    if (r.includes('design') || r.includes('ui') || r.includes('ux')) return <RoleDesignerIcon />;
    if (r.includes('manager') || r.includes('lead') || r.includes('product') || r.includes('scrum')) return <RoleProjectManagerIcon />;
    if (r.includes('qa') || r.includes('quality') || r.includes('test')) return <RoleQAIcon />;
    return <RoleAllIcon />;
};
import CustomDatePicker from './CustomDatePicker';

const TeamUpdatesFilterBar = ({
    searchTerm, setSearchTerm,
    selectedProject, setSelectedProject,
    selectedRole, setSelectedRole,
    dateFilter, setDateFilter,
    customDate, setCustomDate,
    projectList, roleList
}) => {
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const dateContainerRef = useRef(null);
    const projectContainerRef = useRef(null);
    const roleContainerRef = useRef(null);

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

    // Find color of currently selected project
    const selectedProjectObj = projectList.find(p => p.name === selectedProject);
    const selectedProjectColor = selectedProjectObj?.color_code || '#475569';

    // Filter projects in dropdown by search
    const filteredProjects = projectList.filter(p =>
        p.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
    );

    // Close dropdowns if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateContainerRef.current && !dateContainerRef.current.contains(event.target)) {
                setIsDateDropdownOpen(false);
            }
            if (projectContainerRef.current && !projectContainerRef.current.contains(event.target)) {
                setIsProjectDropdownOpen(false);
                setProjectSearchTerm('');
            }
            if (roleContainerRef.current && !roleContainerRef.current.contains(event.target)) {
                setIsRoleDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDateSelect = (value) => {
        setDateFilter(value);
        setIsDateDropdownOpen(false);

        if (value === 'Custom') {
            setIsCalendarOpen(true);
        } else {
            setIsCalendarOpen(false);
        }
    };

    const handleProjectSelect = (projectName) => {
        setSelectedProject(projectName);
        setIsProjectDropdownOpen(false);
        setProjectSearchTerm('');
    };

    const clearSelectedProject = (e) => {
        e.stopPropagation();
        setSelectedProject('All Projects');
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

            {/* Project Dropdown — Custom with colored pills */}
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
                                    <div className="project-pill" style={{ backgroundColor: p.color_code }}>
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

            {/* Role Dropdown — Custom */}
            <div ref={roleContainerRef} className="role-dropdown-container">
                <div
                    className="filter-item-wrapper role-dropdown-trigger"
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                >
                    {getRoleIcon(selectedRole)}
                    <span className="role-display">{selectedRole}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isRoleDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>

                {isRoleDropdownOpen && (
                    <div className="role-dropdown-menu">
                        {roleList.map((role, index) => (
                            <div
                                key={index}
                                className={`role-dropdown-item ${selectedRole === role ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedRole(role);
                                    setIsRoleDropdownOpen(false);
                                }}
                            >
                                {getRoleIcon(role)}
                                {role}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Custom Date Dropdown Section */}
            <div ref={dateContainerRef} className="date-dropdown-container">

                {/* The "Select" Pill */}
                <div className="filter-item-wrapper date-dropdown-pill" onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}>
                    {dateFilter === 'Today' && <TodayIcon />}
                    {dateFilter === 'Yesterday' && <YesterdayIcon />}
                    {dateFilter === 'Custom' && <CustomDateIcon />}
                    <div className="date-dropdown-content">
                        {dateFilter === 'Today' && <>Today <span className="date-subtext">({formattedToday})</span></>}
                        {dateFilter === 'Yesterday' && <>Yesterday <span className="date-subtext">({formattedYesterday})</span></>}
                        {dateFilter === 'Custom' && <>Custom Date <span className="date-subtext">{formattedCustomDate ? `(${formattedCustomDate})` : ''}</span></>}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isDateDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>

                {/* The Dropdown Menu List */}
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
                        <div className="date-dropdown-item" onClick={() => handleDateSelect('Custom')}>
                            <CustomDateIcon />
                            <span>Custom Date</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Custom (Figma-styled) Date Picker */}
                <CustomDatePicker
                    isOpen={isCalendarOpen}
                    onClose={() => setIsCalendarOpen(false)}
                    value={customDate}
                    onChange={(newDate) => setCustomDate(newDate)}
                    ignoreRef={dateContainerRef}
                />
            </div>

        </div>
    );
};

export default TeamUpdatesFilterBar;
