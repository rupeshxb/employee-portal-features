import React, { useState, useEffect } from 'react';
import '../style/DesignationAddEditModal.css';
import { ModalCloseIcon, CheckTickIcon } from './Icons';
import CustomScrollbar from './CustomScrollbar';

const defaultForm = { name: '', system_name: '', description: '', status: 'Active' };

const DesignationAddEditModal = ({ isOpen, onClose, onSubmit, designation }) => {
    const [formData, setFormData] = useState(defaultForm);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setFormData(designation
                ? { name: designation.name, system_name: designation.system_name || '', description: designation.description || '', status: designation.status || 'Active' }
                : defaultForm
            );
            setErrors({});
        }
    }, [isOpen, designation]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Display name is required.';
        if (!formData.system_name.trim()) newErrors.system_name = 'System name is required.';
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        setErrors({});
        onSubmit({ name: formData.name.trim(), system_name: formData.system_name.trim(), description: formData.description.trim(), status: formData.status });
    };

    if (!isOpen) return null;

    return (
        <div className="dm-overlay">
            <div className="dm-content">
                <button className="dm-close" onClick={onClose} type="button" aria-label="Close">
                    <ModalCloseIcon size={28} color="#64748B" strokeWidth={2} />
                </button>

                <div className="dm-header">
                    <h2>{designation ? 'Edit Designation' : 'Add Designation'}</h2>
                    <p className="dm-subtitle">Define a designation and link it to a tag streamline team organization.</p>
                </div>

                <form onSubmit={handleSubmit} className="dm-form">
                    <CustomScrollbar className="dm-scroll">
                        <div className="dm-fields">
                            <div className="dm-form-group">
                                <label>Display Name <span className="dm-req">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Front-end Developer"
                                    value={formData.name}
                                    className={errors.name ? 'dm-input-error' : ''}
                                    onChange={(e) => { setFormData(f => ({ ...f, name: e.target.value })); if (errors.name) setErrors(p => ({ ...p, name: '' })); }}
                                />
                                {errors.name && <span className="dm-field-error">{errors.name}</span>}
                            </div>

                            <div className="dm-form-group">
                                <label>System Name <span className="dm-req">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. frontend_developer"
                                    value={formData.system_name}
                                    className={errors.system_name ? 'dm-input-error' : ''}
                                    onChange={(e) => { setFormData(f => ({ ...f, system_name: e.target.value })); if (errors.system_name) setErrors(p => ({ ...p, system_name: '' })); }}
                                />
                                {errors.system_name && <span className="dm-field-error">{errors.system_name}</span>}
                            </div>

                            <div className="dm-form-group">
                                <label>Description</label>
                                <textarea
                                    placeholder="Brief description about this designation"
                                    value={formData.description}
                                    onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                                    rows={4}
                                />
                            </div>

                            <div className="dm-form-group">
                                <label>Status</label>
                                <div className="dm-status-row">
                                    {['Active', 'Inactive'].map(s => (
                                        <label key={s} className="dm-check-label">
                                            <input
                                                type="checkbox"
                                                className="dm-checkbox-input"
                                                checked={formData.status === s}
                                                onChange={() => setFormData(f => ({ ...f, status: s }))}
                                            />
                                            <span className={`dm-checkbox-visual${formData.status === s ? ' dm-checkbox-checked' : ''}`}>
                                                {formData.status === s && <CheckTickIcon />}
                                            </span>
                                            <span>{s}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CustomScrollbar>

                    <div className="dm-actions">
                        <button type="button" className="dm-btn-reset" onClick={() => { setFormData(defaultForm); setErrors({}); }}>Reset</button>
                        <button type="submit" className="dm-btn-submit">Add Designation</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DesignationAddEditModal;
