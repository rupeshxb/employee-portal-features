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

    // Grab team structure, handling both Django's snake_case or React's camelCase
    const team = project.team_structure || project.teamStructure || {};

    return (
        <div className="project-card" style={{ backgroundColor: project.color_code || project.accentColor || '#0FB7FE' }}>
            <div className="card-header">
                <div className="title-row" ref={menuRef} style={{ position: 'relative' }}>
                    {/* Updated to project.name */}
                    <h3>{project.name} {project.acronym && `(${project.acronym})`}</h3>

                    <button className="more-options-btn" onClick={() => setShowMenu(!showMenu)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                    </button>

                    {/* The Dropdown Menu */}
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
                </div>

                <div className="meta-row">
                    {/* Updated to project.client and project.start_date */}
                    <span className="meta-item">{project.client_name || 'Unknown'}</span>
                    <span className="meta-item">{formatDate(project.start_date)}</span>
                </div>
            </div>

            <div className="card-body">
                <div className="team-structure-list">
                    <div className="list-title">TEAM STRUCTURE</div>
                    <div className="list-item"><span>Front-end Developers</span><span>{team.frontend?.length || '-'}</span></div>
                    <div className="list-item"><span>Back-end Developers</span><span>{team.backend?.length || '-'}</span></div>
                    <div className="list-item"><span>UI/UX Designers</span><span>{team.uiux?.length || '-'}</span></div>
                </div>
                <div className="card-footer-total">
                    <span>Total</span>
                    <span className="total-number">{project.total_team_size || project.totalTeamSize || '-'}</span>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;