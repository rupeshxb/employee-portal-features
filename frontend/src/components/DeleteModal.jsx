import React from 'react';

const DeleteModal = ({ show, task, onClose, onConfirm }) => {
  if (!show || !task) return null;

  const raw = task.date || task.created_at;
  const dateObj = task.date
    ? new Date(task.date + 'T00:00:00')
    : new Date(raw);
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="modal-overlay">
      <div className="modal-content delete-modal">
        <button className="delete-modal-close" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="#747575" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 6L18 18" stroke="#747575" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <h2 className="delete-modal-title">Delete Task?</h2>

        <p className="delete-modal-body">
          Are you sure you want to delete task for <strong>"{formattedDate}"</strong>? This action cannot be undone afterwards.
        </p>

        <div className="delete-modal-actions">
          <button className="delete-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="delete-modal-confirm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
