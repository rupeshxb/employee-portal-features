import React, { useState, useEffect, useRef } from 'react';
import { CheckmarkRound, ArrowDown, ActiveIcon, InactiveIcon } from './Icons';

const TagStatusDropdown = ({ statusFilter, setStatusFilter }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const statusOptions = ['All Status', 'Active', 'Inactive'];

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (e, status) => {
        e.preventDefault();
        e.stopPropagation();
        setStatusFilter(status);
        setIsDropdownOpen(false);
    };

    const toggleDropdown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDropdownOpen(!isDropdownOpen);
    };

    return (
        <div className="status-filter-container custom-dropdown" ref={dropdownRef}>
            <div 
                className={`custom-dropdown-trigger ${isDropdownOpen ? 'active' : ''}`}
                onClick={toggleDropdown}
            >
                <div className="trigger-content">
                    {statusFilter === 'All Status' && <CheckmarkRound />} 
                    {statusFilter === 'Active' && <ActiveIcon />}
                    {statusFilter === 'Inactive' && <InactiveIcon />}
                    <span>{statusFilter}</span>
                </div>
                <ArrowDown className={`arrow-icon ${isDropdownOpen ? 'rotated' : ''}`} />
            </div>

            {isDropdownOpen && (
                <div className="custom-dropdown-menu">
                    {statusOptions.map((status) => (
                        <div 
                            key={status}
                            className="custom-dropdown-item"
                            onClick={(e) => handleSelect(e, status)}
                        >
                            <div className="item-label">
                                {status === 'All Status' && <CheckmarkRound />} 
                                {status === 'Active' && <ActiveIcon />}
                                {status === 'Inactive' && <InactiveIcon />}
                                <span>{status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TagStatusDropdown;