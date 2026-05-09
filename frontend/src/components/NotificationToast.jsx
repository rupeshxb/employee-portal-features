import React from 'react';
import { ToastSuccessIcon } from './Icons';

const NotificationToast = ({ show, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="notification-toast">
        <div className="toast-content">
            <div className="toast-icon"><ToastSuccessIcon /></div>
            <span>{message}</span>
            <button className="toast-close" onClick={onClose} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
        </div>
        <div className="toast-progress-bar"></div>
    </div>
  );
};

export default NotificationToast;