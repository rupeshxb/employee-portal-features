import React from 'react';

const TagDeleteModal = ({ isOpen, onClose, onConfirm, tag }) => {
    if (!isOpen || !tag) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content delete-modal">
                <button className="modal-close" onClick={onClose}>×</button>
                <h2>Delete Tag?</h2>
                <p>Are you sure you want to delete tag <strong>"{tag.display_name}"</strong>?</p>
                <p>This action cannot be undone afterwards.</p>

                <div className="modal-actions center">
                    <button className="btn-outline" onClick={onClose}>Cancel</button>
                    <button className="btn-danger" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    );
};

export default TagDeleteModal;