import React from 'react';

const NotificationToast = ({ show, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="notification-toast">
        {/* Content Wrapper */}
        <div className="toast-content">
            <div className="check-circle">✓</div>
            <span>{message}</span>
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
        
        {/* The Progress Bar */}
        <div className="toast-progress-bar"></div>
    </div>
  );
};

export default NotificationToast;