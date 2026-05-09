import React, { useState, useEffect, useRef } from 'react';
import '../style/TagAddEditModal.css';

const PREDEFINED_COLORS = [
    '#00C897', '#FF33A1', '#5D5DFF', '#FF4B4B', '#7B3BFF',
    '#D926A9', '#FF2A5F', '#A37F5B', '#FF8C00'
];

const defaultFormState = {
    display_name: '', system_name: '', description: '',
    color: '#00C897', status: 'Active', designation_ids: []
};

// Checkmark icon for selected colors
const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

// Chevron down icon for dropdown
const ChevronDown = ({ isOpen }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const TagAddEditModal = ({ isOpen, onClose, onSubmit, tag, designations }) => {
    const [formData, setFormData] = useState(defaultFormState);
    const [isCustomColor, setIsCustomColor] = useState(false);
    const [isDesignationOpen, setIsDesignationOpen] = useState(false);
    const [errors, setErrors] = useState({});

    const dropdownRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            if (tag) {
                setFormData({
                    display_name: tag.display_name,
                    system_name: tag.system_name,
                    description: tag.description || '',
                    color: tag.color,
                    status: tag.status,
                    designation_ids: tag.designations.map(d => d.id)
                });
                setIsCustomColor(!PREDEFINED_COLORS.includes(tag.color));
            } else {
                setFormData(defaultFormState);
                setIsCustomColor(false);
            }
            setErrors({});
            setIsDesignationOpen(false);
        }
    }, [isOpen, tag]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDesignationOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDesignationToggle = (desigId) => {
        setFormData(prev => ({
            ...prev,
            designation_ids: prev.designation_ids.includes(desigId)
                ? prev.designation_ids.filter(id => id !== desigId)
                : [...prev.designation_ids, desigId]
        }));
    };

    const handleStatusToggle = (newStatus) => {
        setFormData({ ...formData, status: newStatus });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.display_name.trim()) newErrors.display_name = 'Display name is required.';
        if (!formData.system_name.trim()) newErrors.system_name = 'System name is required.';
        if (formData.designation_ids.length === 0) newErrors.designations = 'Select at least one designation.';
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        setErrors({});
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content tag-modal">
                <button className="modal-close" onClick={onClose}>×</button>
                <h2>{tag ? 'Edit Tag' : 'Add New Tag'}</h2>
                <p className="modal-subtitle">
                    {tag ? 'Update tag name, description, status & attach designations.' : 'Adding tag allows you to group manage designations.'}
                </p>

                <form onSubmit={handleSubmit} className="tag-form">
                    <div className="form-group">
                        <label>Display Name <span className="req">*</span></label>
                        <input
                            type="text" placeholder="e.g. Developers, Marketing, QA"
                            value={formData.display_name}
                            className={errors.display_name ? 'input-error' : ''}
                            onChange={(e) => { setFormData({ ...formData, display_name: e.target.value }); if (errors.display_name) setErrors(p => ({ ...p, display_name: '' })); }}
                        />
                        {errors.display_name && <span className="field-error">{errors.display_name}</span>}
                    </div>

                    <div className="form-group">
                        <label>System Name <span className="req">*</span></label>
                        <input
                            type="text" placeholder="e.g. developers"
                            value={formData.system_name}
                            className={errors.system_name ? 'input-error' : ''}
                            onChange={(e) => { setFormData({ ...formData, system_name: e.target.value }); if (errors.system_name) setErrors(p => ({ ...p, system_name: '' })); }}
                        />
                        {errors.system_name && <span className="field-error">{errors.system_name}</span>}
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            placeholder="Brief description of the tag group" rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="form-group tag-color-group">
                        <label>Tag Color</label>
                        <div className="color-picker-box">
                            <div className="color-row">
                                <span className="color-label">Predefined Color</span>
                                <div className="color-options">
                                    {PREDEFINED_COLORS.map(c => {
                                        const isSelected = !isCustomColor && formData.color === c;
                                        return (
                                            <div
                                                key={c}
                                                className={`color-circle ${isSelected ? 'selected' : ''}`}
                                                style={{ backgroundColor: c }}
                                                onClick={() => { setIsCustomColor(false); setFormData({ ...formData, color: c }); }}
                                            >
                                                {isSelected && <CheckIcon />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            <div className="color-row">
                                <span className="color-label">Custom Color</span>
                                <div className="custom-color-controls">
                                    <div 
                                        className="color-square custom-color-preview"
                                        style={{ backgroundColor: isCustomColor ? formData.color : '#F3F4F6' }}
                                        onClick={() => setIsCustomColor(true)}
                                    >
                                        {isCustomColor && <CheckIcon />}
                                        <input 
                                            type="color" 
                                            value={formData.color} 
                                            onChange={(e) => {
                                                setIsCustomColor(true);
                                                setFormData({ ...formData, color: e.target.value });
                                            }}
                                            className="hidden-color-picker"
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={isCustomColor ? formData.color.toUpperCase() : ''} 
                                        placeholder="#HEXCODE"
                                        disabled={!isCustomColor}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="hex-input"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group designations-select">
                        <label>Designations <span className="req">*</span></label>

                        <div className="designation-dropdown-wrapper" ref={dropdownRef}>
                            <div 
                                className="dropdown-trigger-btn" 
                                onClick={() => setIsDesignationOpen(!isDesignationOpen)}
                            >
                                <span>Select designations</span>
                                <ChevronDown isOpen={isDesignationOpen} />
                            </div>

                            {isDesignationOpen && (
                                <div className="dropdown-menu-floating">
                                    {designations.map(desig => (
                                        <label key={desig.id} className="dropdown-option">
                                            <input
                                                type="checkbox"
                                                className="blue-checkbox"
                                                checked={formData.designation_ids.includes(desig.id)}
                                                onChange={() => handleDesignationToggle(desig.id)}
                                            />
                                            {desig.name}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="selected-badges-area">
                            {formData.designation_ids.map(id => {
                                const d = designations.find(des => des.id === id);
                                return d ? (
                                    <span key={id} className="sel-badge">
                                        {d.name}
                                        <button type="button" onClick={() => { handleDesignationToggle(id); if (errors.designations) setErrors(p => ({ ...p, designations: '' })); }}>×</button>
                                    </span>
                                ) : null;
                            })}
                        </div>
                        {errors.designations && <span className="field-error">{errors.designations}</span>}
                    </div>

                    <div className="form-group status-group">
                        <label>Status</label>
                        <div className="status-radios">
                            <label className="radio-label">
                                <input 
                                    type="checkbox" 
                                    className="blue-checkbox"
                                    checked={formData.status === 'Active'}
                                    onChange={() => handleStatusToggle('Active')}
                                />
                                <span>Active</span>
                            </label>
                            <label className="radio-label">
                                <input 
                                    type="checkbox" 
                                    className="blue-checkbox"
                                    checked={formData.status === 'Inactive'}
                                    onChange={() => handleStatusToggle('Inactive')}
                                />
                                <span>Inactive</span>
                            </label>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-outline" onClick={() => setFormData(defaultFormState)}>Reset</button>
                        <button type="submit" className="btn-primary">{tag ? 'Update Tag' : 'Add Tag'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TagAddEditModal;