import React from 'react';
const DeleteModal = ({ show, task, onClose, onConfirm }) => {
  if (!show || !task) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content delete-modal">
          <div className="modal-header-simple">
              <h2>Delete Task?</h2>
              <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
              <p>Are you sure you want to delete task for <strong>"{new Date(task.date || task.created_at).toLocaleDateString()}"</strong>?</p>
              <p className="sub-text">This action cannot be undone.</p>
          </div>
          <div className="modal-actions-right">
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
              <button className="btn-delete-confirm" onClick={onConfirm}>Delete</button>
          </div>
      </div>
    </div>
  );
};
export default DeleteModal;