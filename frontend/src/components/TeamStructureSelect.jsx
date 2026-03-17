import React, { useState, useRef, useEffect } from 'react';

const TeamStructureSelect = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // Close the dropdown if the user clicks anywhere outside of it
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOption = (user) => {
        const isSelected = selected.some(item => item.id === user.id);
        let newSelected;
        if (isSelected) {
            newSelected = selected.filter(item => item.id !== user.id);
        } else {
            newSelected = [...selected, user];
        }
        onChange(newSelected);
    };

    const removeOption = (e, userId) => {
        e.stopPropagation(); // Prevents the dropdown from toggling when clicking the 'x'
        onChange(selected.filter(item => item.id !== userId));
    };

    const filteredOptions = options.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Limit how many tags show in the closed box to prevent it from getting too tall
    const displayLimit = 4;
    const visibleSelected = selected.slice(0, displayLimit);
    const hiddenCount = selected.length - displayLimit;

    return (
        <div className="custom-multi-select" ref={wrapperRef}>
            <label className="select-label">{label}</label>
            
            {/* The Trigger Box */}
            <div className={`select-trigger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <div className="selected-tags-container">
                    {selected.length === 0 && <span className="placeholder-text">Select members...</span>}
                    
                    {visibleSelected.map(user => (
                        <span key={user.id} className="selected-tag">
                            <img src={user.avatar} alt={user.name} className="tag-avatar" />
                            <span className="tag-name">{user.name}</span>
                            <button className="remove-tag-btn" onClick={(e) => removeOption(e, user.id)}>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M9 3L3 9M3 3l6 6"/>
                                </svg>
                            </button>
                        </span>
                    ))}
                    
                    {hiddenCount > 0 && (
                        <span className="selected-tag more-tag">+{hiddenCount}</span>
                    )}
                </div>
                
                <div className="chevron-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={isOpen ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}/>
                    </svg>
                </div>
            </div>

            {/* The Dropdown Menu */}
            {isOpen && (
                <div className="select-dropdown-menu">
                    <div className="search-bar-wrapper">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search team members"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()} // Let user type without closing
                        />
                    </div>

                    <div className="options-list">
                        {filteredOptions.map(user => {
                            const isSelected = selected.some(s => s.id === user.id);
                            if (isSelected) return null; // Hide already selected items from the top list
                            
                            return (
                                <div key={user.id} className="option-pill" onClick={() => toggleOption(user)}>
                                    <img src={user.avatar} alt={user.name} className="option-avatar" />
                                    {user.name}
                                </div>
                            );
                        })}
                        {filteredOptions.length === 0 && <p className="no-results">No members found.</p>}
                    </div>

                    {/* Selected Section at the bottom of dropdown */}
                    {selected.length > 0 && (
                        <div className="dropdown-selected-section">
                            <div className="section-label">SELECTED</div>
                            <div className="selected-tags-container">
                                {selected.map(user => (
                                    <span key={user.id} className="selected-tag">
                                        <img src={user.avatar} alt={user.name} className="tag-avatar" />
                                        <span className="tag-name">{user.name}</span>
                                        <button className="remove-tag-btn" onClick={(e) => removeOption(e, user.id)}>
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <path d="M9 3L3 9M3 3l6 6"/>
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamStructureSelect;