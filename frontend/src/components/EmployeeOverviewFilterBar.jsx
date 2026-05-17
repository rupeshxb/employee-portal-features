import React, { useState, useEffect, useRef } from 'react';
import '../style/TeamUpdatesFilterBar.css'; // Reusing your existing CSS!
// Assuming you have these or similar in your Icons file
import { SearchIcon, ProjectIcon, CheckmarkRound, ActiveIcon, InactiveIcon } from './Icons';

// Basic Icons for the new dropdowns
const TeamIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const CloseIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const renderStatusIcon = (status) => {
    if (status === 'Active') return <ActiveIcon />;
    if (status === 'Inactive') return <InactiveIcon />;
    return <CheckmarkRound />;
};

const EmployeeOverviewFilterBar = ({
    searchTerm, setSearchTerm,
    selectedProject, setSelectedProject,
    teamFilter, setTeamFilter,
    statusFilter, setStatusFilter,
    projectList
}) => {
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');
    const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const projectContainerRef = useRef(null);
    const teamContainerRef = useRef(null);
    const statusContainerRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (projectContainerRef.current && !projectContainerRef.current.contains(event.target)) setIsProjectDropdownOpen(false);
            if (teamContainerRef.current && !teamContainerRef.current.contains(event.target)) setIsTeamDropdownOpen(false);
            if (statusContainerRef.current && !statusContainerRef.current.contains(event.target)) setIsStatusDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredProjects = projectList.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()));
    const activeProjectData = projectList.find(p => p.name === selectedProject);

    return (
        <div className="filter-bar">
            {/* 1. Search */}
            <div className="filter-item-wrapper search-wrapper">
                <SearchIcon />
                <input
                    type="text"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* 2. Project Dropdown (Your exact existing code) */}
            <div ref={projectContainerRef} className="custom-project-container">
                <div className="filter-item-wrapper custom-project-trigger" onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}>
                    {selectedProject === 'All Projects' && <ProjectIcon />}
                    <div className="project-trigger-content">
                        {selectedProject === 'All Projects' ? (
                            <span>All Projects</span>
                        ) : (
                            <div className="selected-project-pill" style={{ backgroundColor: activeProjectData?.color_code || '#cbd5e1' }}>
                                {selectedProject}
                                <span className="clear-project-btn" onClick={(e) => { e.stopPropagation(); setSelectedProject('All Projects'); }}><CloseIcon /></span>
                            </div>
                        )}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`project-caret ${isProjectDropdownOpen ? 'open' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
                </div>

                {isProjectDropdownOpen && (
                    <div className="custom-project-menu">
                        <div className="project-menu-search">
                            <SearchIcon />
                            <input type="text" placeholder="Search project" value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} autoFocus />
                        </div>
                        <div className="project-menu-list">
                            {filteredProjects.map(p => (
                                <div key={p.id} className="project-menu-item" onClick={() => { setSelectedProject(p.name); setIsProjectDropdownOpen(false); setProjectSearch(''); }}>
                                    <span className="project-pill" style={{ backgroundColor: p.color_code }}>{p.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Team Dropdown (Adapted from Date) */}
            <div ref={teamContainerRef} className="date-dropdown-container">
                <div className="filter-item-wrapper date-dropdown-pill" onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}>
                    <TeamIcon />
                    <div className="date-dropdown-content">{teamFilter}</div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </div>
                {isTeamDropdownOpen && (
                    <div className="date-dropdown-menu">
                        {['All Team', 'Design', 'Development', 'Management', 'QA'].map(team => (
                            <div key={team} className="date-dropdown-item date-dropdown-item-bordered" onClick={() => { setTeamFilter(team); setIsTeamDropdownOpen(false); }}>
                                {team}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. Status Dropdown (Adapted from Time) */}
            <div ref={statusContainerRef} className="date-dropdown-container status-dropdown-container">
                <div className="filter-item-wrapper date-dropdown-pill" onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}>
                    {renderStatusIcon(statusFilter)}
                    <div className="date-dropdown-content">{statusFilter}</div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </div>
                {isStatusDropdownOpen && (
                    <div className="date-dropdown-menu">
                        {['All Status', 'Active', 'Inactive'].map(status => (
                            <div key={status} className="date-dropdown-item date-dropdown-item-bordered" onClick={() => { setStatusFilter(status); setIsStatusDropdownOpen(false); }}>
                                {renderStatusIcon(status)}
                                <span>{status}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeOverviewFilterBar;