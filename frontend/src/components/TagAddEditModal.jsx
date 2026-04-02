import React, { useState, useEffect } from 'react';

const PREDEFINED_COLORS = [
    '#00C897', '#FF33A1', '#5D5DFF', '#FF4B4B', '#7B3BFF',
    '#D926A9', '#FF2A5F', '#A37F5B', '#FF8C00'
];

const defaultFormState = {
    display_name: '', system_name: '', description: '',
    color: '#00C897', status: 'Active', designation_ids: []
};

const TagAddEditModal = ({ isOpen, onClose, onSubmit, tag, designations }) => {
    const [formData, setFormData] = useState(defaultFormState);
    const [isCustomColor, setIsCustomColor] = useState(false);

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
        }
    }, [isOpen, tag]);

    const handleDesignationToggle = (desigId) => {
        setFormData(prev => ({
            ...prev,
            designation_ids: prev.designation_ids.includes(desigId)
                ? prev.designation_ids.filter(id => id !== desigId)
                : [...prev.designation_ids, desigId]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
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
                            type="text" required placeholder="e.g. Developers, Marketing, QA"
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>System Name <span className="req">*</span></label>
                        <input
                            type="text" required placeholder="e.g. developers"
                            value={formData.system_name}
                            onChange={(e) => setFormData({ ...formData, system_name: e.target.value })}
                        />
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
                            <div className="predefined-colors">
                                <span className="color-label">Predefined Color</span>
                                <div className="color-options">
                                    {PREDEFINED_COLORS.map(c => (
                                        <div
                                            key={c}
                                            className={`color-circle ${!isCustomColor && formData.color === c ? 'selected' : ''}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => { setIsCustomColor(false); setFormData({ ...formData, color: c }); }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="custom-color">
                                <label className="checkbox-label">
                                    <input type="checkbox" checked={isCustomColor} onChange={(e) => setIsCustomColor(e.target.checked)} />
                                    <span className="checkmark"></span> Pick Custom Color
                                </label>
                                <input type="color" value={formData.color} disabled={!isCustomColor}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="html-color-picker"
                                />
                                <input type="text" value={formData.color.toUpperCase()} disabled={!isCustomColor}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="hex-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group designations-select">
                        <label>Designations <span className="req">*</span></label>
                        <div className="multi-select-container">
                            <div className="selected-badges">
                                {formData.designation_ids.length === 0 && <span className="placeholder">Select designations</span>}
                                {formData.designation_ids.map(id => {
                                    const d = designations.find(des => des.id === id);
                                    return d ? (
                                        <span key={id} className="sel-badge">
                                            {d.name} <button type="button" onClick={() => handleDesignationToggle(id)}>×</button>
                                        </span>
                                    ) : null;
                                })}
                            </div>
                            <div className="dropdown-options">
                                {designations.map(desig => (
                                    <label key={desig.id} className="dropdown-option">
                                        <input
                                            type="checkbox"
                                            checked={formData.designation_ids.includes(desig.id)}
                                            onChange={() => handleDesignationToggle(desig.id)}
                                        />
                                        {desig.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-group status-group">
                        <label>Status</label>
                        <div className="status-radios">
                            <label className="radio-label">
                                <input type="radio" name="status" value="Active" checked={formData.status === 'Active'}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                />
                                <span>Active</span>
                            </label>
                            <label className="radio-label">
                                <input type="radio" name="status" value="Inactive" checked={formData.status === 'Inactive'}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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