import React, { useState, useRef, useEffect } from 'react';
import CustomScrollbar from './CustomScrollbar';
import { ProfilePersonIcon, HeaderCalendarIcon, VerticalDividerIcon } from './Icons';
import '../style/ProjectCard.css';

const ProjectCard = ({ project, departments = [], onEdit, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

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

    const team = project.team_structure || project.teamStructure || {};

    const countFor = (value) => {
        if (Array.isArray(value)) return value.length;
        if (typeof value === 'number') return value;
        return 0;
    };

    // Build rows from master department list + any extras in `team`, then sort so
    // departments with members appear before those with none (stable within each group).
    const rawRows = [];
    const seen = new Set();
    departments.forEach(d => {
        rawRows.push({ name: d.name, count: countFor(team[d.name]) });
        seen.add(d.name);
    });
    Object.entries(team).forEach(([name, value]) => {
        if (!seen.has(name)) rawRows.push({ name, count: countFor(value) });
    });
    const rows = [
        ...rawRows.filter(r => r.count > 0),
        ...rawRows.filter(r => r.count <= 0),
    ];

    const totalCount = rows.reduce((sum, r) => sum + r.count, 0)
        || Number(project.team_size)
        || Number(project.total_team_size)
        || 0;

    const cardBgColor = project.color_code || project.accentColor || '#7751FF';

    const calculateProgress = () => {
        if (!project.start_date || !project.end_date) return 0;
        const startDate = new Date(project.start_date).getTime();
        const endDate = new Date(project.end_date).getTime();
        const today = new Date().getTime();
        if (today <= startDate) return 0;
        if (today >= endDate) return 100;
        return ((today - startDate) / (endDate - startDate)) * 100;
    };

    const progressPercentage = calculateProgress();

    return (
        <div className="project-card" style={{ '--card-accent': cardBgColor }}>
            <div className="card-header" ref={menuRef}>
                <button className="more-options-btn" onClick={() => setShowMenu(!showMenu)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        <ProfilePersonIcon />
                        {project.client_name || 'Unknown'}
                    </span>
                    <VerticalDividerIcon className="card-meta-divider" opacity={0.3} height={12} />
                    <span className="meta-item">
                        <HeaderCalendarIcon width={15} height={15} />
                        {formatDate(project.end_date)}
                    </span>
                </div>
            </div>

            <div className="card-body">
                <div className="card-body-inner">
                    <div className="timeline-row">
                        <span className="list-title">TIMELINE</span>
                        <div className="progress-bar-bg" style={{ backgroundColor: `${cardBgColor}33` }}>
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${progressPercentage}%`, backgroundColor: cardBgColor }}
                            />
                        </div>
                    </div>

                    <div className="team-section-divider" />
                    <div className="list-title">TEAM STRUCTURE</div>

                    <div className="team-list-wrap">
                        <CustomScrollbar className="team-list-scroll">
                            <div className="team-structure-list">
                                {rows.length > 0 ? rows.map(({ name, count }) => (
                                    <div className="list-item" key={name}>
                                        <span className="list-name">{name}</span>
                                        <span className="list-count">{count > 0 ? count : '-'}</span>
                                    </div>
                                )) : (
                                    <div className="list-item">
                                        <span className="list-name">No departments</span>
                                        <span className="list-count">-</span>
                                    </div>
                                )}
                            </div>
                        </CustomScrollbar>
                    </div>
                </div>

                <div className="card-footer-total">
                    <span>Total</span>
                    <span className="total-number">{totalCount > 0 ? totalCount : '-'}</span>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
