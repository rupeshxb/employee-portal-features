import React, { useState, useEffect } from 'react';
import '../style/DesignationAddEditModal.css';

const defaultForm = { name: '' };

const DesignationAddEditModal = ({ isOpen, onClose, onSubmit, designation }) => {
    const [formData, setFormData] = useState(defaultForm);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData(designation ? { name: designation.name } : defaultForm);
            setError('');
        }
    }, [isOpen, designation]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Designation name is required.');
            return;
        }
        onSubmit({ name: formData.name.trim() });
    };

    if (!isOpen) return null;

    return (
        <div className="desig-modal-overlay">
            <div className="desig-modal-content">
                <button className="desig-modal-close" onClick={onClose} type="button">×</button>

                <div className="desig-modal-header">
                    <h2>{designation ? 'Edit Designation' : 'Add New Designation'}</h2>
                    <p className="desig-modal-subtitle">
                        {designation
                            ? 'Update the designation name used across the system.'
                            : 'Add a new designation to categorise employees in your organisation.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="desig-form">
                    <div className="desig-form-group">
                        <label htmlFor="desig-name">
                            Designation Name <span className="req">*</span>
                        </label>
                        <input
                            id="desig-name"
                            type="text"
                            required
                            placeholder="e.g. Software Engineer, Project Manager"
                            value={formData.name}
                            onChange={(e) => { setFormData({ name: e.target.value }); setError(''); }}
                            autoFocus
                        />
                        {error && <span className="field-error">{error}</span>}
                    </div>

                    <div className="desig-modal-actions">
                        <button type="button" className="btn-outline" onClick={() => { setFormData(defaultForm); setError(''); }}>
                            Reset
                        </button>
                        <button type="submit" className="btn-primary">
                            {designation ? 'Update Designation' : 'Add Designation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DesignationAddEditModal;
