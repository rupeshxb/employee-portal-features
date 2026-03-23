import React, { useState, useRef, useEffect } from 'react';
import '../style/ProjectCard.css';

const ProjectCard = ({ project, onEdit, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Close menu if clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'No date set';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // --- NEW: Dynamic Timeline Calculation ---
    const calculateProgress = () => {
        if (!project.start_date || !project.end_date) return 0; // 0% if dates are missing
        
        const startDate = new Date(project.start_date).getTime();
        const endDate = new Date(project.end_date).getTime();
        const today = new Date().getTime();

        // If we haven't started yet
        if (today <= startDate) return 0;
        // If we are past the end date
        if (today >= endDate) return 100;

        // Calculate percentage
        const totalDuration = endDate - startDate;
        const timePassed = today - startDate;
        return (timePassed / totalDuration) * 100;
    };

    const team = project.team_structure || project.teamStructure || {};
    const cardBgColor = project.color_code || project.accentColor || '#7C3AED';
    const progressPercentage = calculateProgress();

    return (
        <div className="project-card" style={{ backgroundColor: cardBgColor }}>
            
            <div className="card-header" ref={menuRef}>
                <button className="more-options-btn" onClick={() => setShowMenu(!showMenu)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1.5"></circle>
                        <circle cx="19" cy="12" r="1.5"></circle>
                        <circle cx="5" cy="12" r="1.5"></circle>
                    </svg>
                </button>

                {showMenu && (
                    <div className="card-dropdown-menu">
                        <button onClick={() => { setShowMenu(false); onEdit(project); }}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.75 2.25023C12.947 2.05324 13.1808 1.89699 13.4382 1.79038C13.6956 1.68378 13.9714 1.62891 14.25 1.62891C14.5286 1.62891 14.8044 1.68378 15.0618 1.79038C15.3192 1.89699 15.553 2.05324 15.75 2.25023C15.947 2.44721 16.1032 2.68106 16.2098 2.93843C16.3165 3.1958 16.3713 3.47165 16.3713 3.75023C16.3713 4.0288 16.3165 4.30465 16.2098 4.56202C16.1032 4.81939 15.947 5.05324 15.75 5.25023L5.625 15.3752L1.5 16.5002L2.625 12.3752L12.75 2.25023Z" stroke="#17181A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Edit Details
                        </button>
                        <button className="delete-btn-text" onClick={() => { setShowMenu(false); onDelete(project); }}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.25 5.25L13.5995 14.3569C13.5434 15.1418 12.8903 15.75 12.1033 15.75H5.89668C5.10972 15.75 4.45656 15.1418 4.40049 14.3569L3.75 5.25M7.5 8.25V12.75M10.5 8.25V12.75M11.25 5.25V3C11.25 2.58579 10.9142 2.25 10.5 2.25H7.5C7.08579 2.25 6.75 2.58579 6.75 3V5.25M3 5.25H15" stroke="#FF493F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Delete Project
                        </button>
                    </div>
                )}

                <h3 className="project-title">
                    {project.name} {project.acronym && `(${project.acronym})`}
                </h3>

                <div className="meta-row">
                    <span className="meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        {project.client_name || 'Unknown'}
                    </span>
                    <span className="meta-divider">|</span>
                    <span className="meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {formatDate(project.end_date)}
                    </span>
                </div>
            </div>

            <div className="card-body">
                <div className="timeline-row">
                    <span className="list-title">TIMELINE</span>
                    <div className="progress-bar-bg">
                        {/* Dynamic Progress Bar Applied Here */}
                        <div 
                            className="progress-bar-fill" 
                            style={{ width: `${progressPercentage}%`, backgroundColor: cardBgColor }}
                        ></div>
                    </div>
                </div>

                <hr className="section-divider" />

                <div className="list-title">TEAM STRUCTURE</div>
                
                <div className="team-structure-list">
                    {team && Object.keys(team).length > 0 ? (
                        Object.entries(team).map(([deptName, count]) => (
                            <div className="list-item" key={deptName}>
                                <span>{deptName}</span>
                                <span className="list-count">{count}</span>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            No team assigned yet
                        </div>
                    )}
                </div>
                
                <div className="card-footer-total">
                    <span>Total</span>
                    <span className="total-number">{project.team_size || project.total_team_size || '-'}</span>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;