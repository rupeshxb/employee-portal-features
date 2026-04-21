import React from 'react';
import '../style/DesignationDeleteModal.css';

const DesignationDeleteModal = ({ isOpen, onClose, onConfirm, designation }) => {
    if (!isOpen || !designation) return null;

    return (
        <div className="desig-del-overlay">
            <div className="desig-del-content">
                <button className="desig-del-close" onClick={onClose} type="button">×</button>

                <div className="desig-del-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </div>

                <h2>Delete Designation?</h2>
                <p>
                    Are you sure you want to delete <strong>"{designation.name}"</strong>?
                </p>
                <p className="desig-del-warning">This action cannot be undone.</p>

                <div className="desig-del-actions">
                    <button className="btn-outline" onClick={onClose}>Cancel</button>
                    <button className="btn-danger" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    );
};

export default DesignationDeleteModal;
