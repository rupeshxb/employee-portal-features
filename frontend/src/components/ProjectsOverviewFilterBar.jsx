import React, { useState, useEffect, useRef } from 'react';
import '../style/ProjectsOverview.css';
import {
    SearchIcon,
    CalendarIcon,
    SmallTeamIcon,
    MediumTeamIcon,
    LargeTeamIcon
} from './Icons';
import DateRangePicker from './DateRangePicker';

const ProjectsOverviewFilterBar = ({
    searchTerm, setSearchTerm,
    dateRange, setDateRange,
    teamSizeFilter, setTeamSizeFilter
}) => {
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

    const dateContainerRef = useRef(null);
    const teamContainerRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateContainerRef.current && !dateContainerRef.current.contains(event.target)) setIsDateDropdownOpen(false);
            if (teamContainerRef.current && !teamContainerRef.current.contains(event.target)) setIsTeamDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Format the date range text for the pill
    const getFormattedDateRange = () => {
        const fmt = (str) => {
            const [y, m, d] = str.split('-').map(Number);
            return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };
        if (dateRange.start && dateRange.end) {
            return `${fmt(dateRange.start)} - ${fmt(dateRange.end)}`;
        }
        if (dateRange.start) return `${fmt(dateRange.start)} - ...`;
        return "Select Date Range";
    };

    const getActiveTeamIcon = () => {
        switch (teamSizeFilter) {
            case 'Medium (6-10)': return <MediumTeamIcon />;
            case 'Large (11+)': return <LargeTeamIcon />;
            case 'Small (1-5)':
            case 'All Team':
            default: return <SmallTeamIcon />;
        }
    };

    return (
        <div className="filter-bar project-filter-bar">
            {/* 1. Search */}
            <div className="filter-item-wrapper search-wrapper">
                <SearchIcon />
                <input
                    type="text"
                    placeholder="Search project"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* 2. Date Range Dropdown */}
            <div ref={dateContainerRef} className="date-dropdown-container">
                <div className="filter-item-wrapper date-dropdown-pill" onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}>
                    <CalendarIcon />
                    <div className="date-dropdown-content">{getFormattedDateRange()}</div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>

                {isDateDropdownOpen && (
                    <DateRangePicker
                        startDate={dateRange.start}
                        endDate={dateRange.end}
                        onChange={setDateRange}
                        onClose={() => setIsDateDropdownOpen(false)}
                    />
                )}
            </div>

            {/* 3. Team Size Dropdown */}
            <div ref={teamContainerRef} className="date-dropdown-container">
                <div className="filter-item-wrapper date-dropdown-pill" onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}>
                    {/* Dynamic Team Icon */}
                    {getActiveTeamIcon()}

                    <div className="date-dropdown-content">
                        {teamSizeFilter}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#747575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>

                {isTeamDropdownOpen && (
                    <div className="date-dropdown-menu">
                        {['All Team', 'Small (1-5)', 'Medium (6-10)', 'Large (11+)'].map(size => (
                            <div
                                key={size}
                                className="date-dropdown-item date-dropdown-item-bordered"
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                onClick={() => { setTeamSizeFilter(size); setIsTeamDropdownOpen(false); }}
                            >
                                {size === 'Small (1-5)' && <SmallTeamIcon />}
                                {size === 'Medium (6-10)' && <MediumTeamIcon />}
                                {size === 'Large (11+)' && <LargeTeamIcon />}
                                {size === 'All Team' && <SmallTeamIcon />}
                                {size}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsOverviewFilterBar;