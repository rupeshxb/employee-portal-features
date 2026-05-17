import React from 'react';
import '../style/TagDeleteModal.css';

const DeleteModal = ({ show, task, onClose, onConfirm }) => {
  if (!show || !task) return null;

  const raw = task.date || task.created_at;
  const dateObj = task.date
    ? new Date(task.date + 'T00:00:00')
    : new Date(raw);
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="modal-overlay">
      <div className="delete-confirm-box">
        <button className="close-icon" onClick={onClose} aria-label="Close">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.5 5.5L5.5 16.5M5.5 5.5L16.5 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="delete-header">
          <h3>Delete Task?</h3>
        </div>
        <p>Are you sure you want to delete task for <strong>"{formattedDate}"</strong>?<br />This action cannot be undone afterwards.</p>
        <div className="delete-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm-delete" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
